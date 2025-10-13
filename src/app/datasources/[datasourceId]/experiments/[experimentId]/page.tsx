'use client';
import { Badge, Box, Flex, Heading, Separator, Tabs, Text, Tooltip, Select } from '@radix-ui/themes';
import { useParams } from 'next/navigation';
import { CalendarIcon, CodeIcon, InfoCircledIcon, PersonIcon, FileTextIcon } from '@radix-ui/react-icons';
import {
  useAnalyzeExperiment,
  useGetExperimentForUi,
  useListSnapshots,
  useUpdateExperiment,
  getGetExperimentForUiKey,
} from '@/api/admin';
import { ForestPlot } from '@/components/features/experiments/forest-plot';
import {
  computeBoundsForMetric,
  AnalysisState,
  precomputeEffectSizesByMetric,
  isFrequentist,
} from '@/components/features/experiments/forest-plot-utils';
import { XSpinner } from '@/components/ui/x-spinner';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { useState } from 'react';
import { CodeSnippetCard } from '@/components/ui/cards/code-snippet-card';
import { ExperimentTypeBadge } from '@/components/features/experiments/experiment-type-badge';
import { ParticipantTypeBadge } from '@/components/features/participants/participant-type-badge';
import { SectionCard } from '@/components/ui/cards/section-card';
import { MdeBadge } from '@/components/features/experiments/mde-badge';
import { EditableTextField } from '@/components/ui/inputs/editable-text-field';
import { EditableDateField } from '@/components/ui/inputs/editable-date-field';
import { EditableTextArea } from '@/components/ui/inputs/editable-text-area';
import { ArmsAndAllocationsTable } from '@/components/features/experiments/arms-and-allocations-table';
import { IntegrationGuideDialog } from '@/components/features/experiments/integration-guide-dialog';
import { ReadMoreText } from '@/components/ui/read-more-text';
import {
  DesignSpecOutput,
  Snapshot,
  MetricAnalysis,
  ExperimentAnalysisResponse,
  OnlineFrequentistExperimentSpecOutput,
  PreassignedFrequentistExperimentSpecOutput,
} from '@/api/methods.schemas';
import { DownloadAssignmentsCsvButton } from '@/components/features/experiments/download-assignments-csv-button';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { extractUtcHHMMLabel, formatUtcDownToMinuteLabel } from '@/services/date-utils';
import Link from 'next/link';
import { mutate } from 'swr';
import ForestTimeseriesPlot from '@/components/features/experiments/forest-timeseries-plot';

// Helper to safely extract alpha from frequentist experiment design specs
const getAlpha = (designSpec: DesignSpecOutput | undefined): number | undefined => {
  if (!designSpec) return undefined;
  if (!['freq_preassigned', 'freq_online'].includes(designSpec.experiment_type)) return undefined;
  return (designSpec as OnlineFrequentistExperimentSpecOutput | PreassignedFrequentistExperimentSpecOutput).alpha;
};

export default function ExperimentViewPage() {
  const params = useParams();
  const orgCtx = useCurrentOrganization();
  const organizationId = orgCtx?.current.id || '';
  const datasourceId = (params.datasourceId as string) || '';
  const experimentId = (params.experimentId as string) || '';

  const [analysisHistory, setAnalysisHistory] = useState<AnalysisState[]>([]);
  const [liveAnalysis, setLiveAnalysis] = useState<AnalysisState>({
    key: 'live',
    data: undefined,
    updated_at: new Date(),
    label: 'No live data yet',
  });
  // which analysis we're actually displaying (live or a snapshot)
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisState>(liveAnalysis);
  const [selectedMetricAnalysis, setSelectedMetricAnalysis] = useState<MetricAnalysis | null>(null);

  // Track the min/max CI bounds across a recent window of snapshots for more stable forest plot display.
  const [ciBounds, setCiBounds] = useState<[number | undefined, number | undefined]>([undefined, undefined]);

  const {
    data: experiment,
    isLoading: isLoadingExperiment,
    error: experimentError,
  } = useGetExperimentForUi(datasourceId, experimentId, {
    swr: { enabled: !!datasourceId },
  });

  const { isLoading: isLoadingAnalysis, error: analysisError } = useAnalyzeExperiment(
    datasourceId,
    experimentId,
    undefined,
    {
      swr: {
        enabled: !!datasourceId && !!experiment,
        shouldRetryOnError: false,
        onSuccess: (analysisData) => {
          const date = new Date();
          const analysis = {
            key: 'live',
            data: analysisData,
            updated_at: date,
            label: `LIVE as of ${extractUtcHHMMLabel(date)}`,
            effectSizesByMetric: precomputeEffectSizesByMetric(analysisData, getAlpha(experiment?.design_spec)),
          };
          setLiveAnalysis(analysis);
          // Only update the display if we were previously viewing live data.
          if (selectedAnalysis.key === 'live') {
            setSelectedAnalysisAndMetrics(analysis);
          }
        },
      },
    },
  );

  const { error: snapshotsError } = useListSnapshots(
    organizationId,
    datasourceId,
    experimentId,
    { status: ['success'] },
    {
      swr: {
        enabled: !!organizationId && !!datasourceId && !!experimentId && !!experiment,
        shouldRetryOnError: false,
        onSuccess: (data) => {
          // Make human-readable labels for the dropdown, showing UTC down to the minute.
          // Use the snapshot ID as the key, looking up the analysisState by ID upon selection.
          if (!data?.items) return;

          // Group snapshots by date and keep only the most recent one per date
          const snapshotsByDate = new Map<string, Snapshot>();

          for (const s of data.items) {
            const dateKey = s.updated_at.split('T')[0]; // Get YYYY-MM-DD from ISO string
            const existing = snapshotsByDate.get(dateKey);
            if (!existing || s.updated_at > existing.updated_at) {
              snapshotsByDate.set(dateKey, s);
            }
          }

          // Convert to array and sort by date descending (most recent first)
          const filteredSnapshots = Array.from(snapshotsByDate.values());
          filteredSnapshots.sort((a, b) => b.updated_at.localeCompare(a.updated_at));

          const opts: AnalysisState[] = filteredSnapshots.map((s) => {
            const analysisData = s.data as ExperimentAnalysisResponse;
            const date = new Date(s.updated_at);
            return {
              key: s.id,
              data: analysisData,
              updated_at: date,
              label: formatUtcDownToMinuteLabel(date),
              effectSizesByMetric: precomputeEffectSizesByMetric(analysisData, getAlpha(experiment?.design_spec)),
            };
          });

          setAnalysisHistory(opts);
          const currentMetricName = selectedMetricAnalysis?.metric?.field_name;
          setCiBounds(computeBoundsForMetric(currentMetricName, [liveAnalysis, ...opts]));
        },
      },
    },
  );

  const { trigger: updateExperiment } = useUpdateExperiment(datasourceId, experimentId, {
    swr: {
      onSuccess: async () => {
        await mutate(getGetExperimentForUiKey(datasourceId, experimentId));
      },
    },
  });

  const setSelectedAnalysisAndMetrics = (analysis: AnalysisState) => {
    setSelectedAnalysis(analysis);
    if (!isFrequentist(analysis.data)) {
      setSelectedMetricAnalysis(null);
      return;
    }

    const metricAnalyses = analysis.data.metric_analyses;
    // Try to maintain the same metric as before when switching between snapshots.
    // The fallback to the first metric should not actually happen in practice.
    const oldMetricName = selectedMetricAnalysis?.metric_name || '';
    const newMetric =
      metricAnalyses.find((metric) => metric.metric?.field_name === oldMetricName) || metricAnalyses[0] || null;
    // Recompute bounds if the metric changed
    const newMetricName = newMetric?.metric_name || '';
    if (oldMetricName !== newMetricName) {
      // check if the selection is 'live' and use it since the state may not have been updated yet.
      setCiBounds(
        computeBoundsForMetric(newMetricName, [analysis.key === 'live' ? analysis : liveAnalysis, ...analysisHistory]),
      );
    }
    setSelectedMetricAnalysis(newMetric);
  };

  if (isLoadingExperiment) {
    return <XSpinner message="Loading experiment details..." />;
  }

  if (experimentError) {
    return <GenericErrorCallout title="Error loading experiment" error={experimentError} />;
  }

  if (!experiment) {
    return <Text>No experiment data found</Text>;
  }

  const { design_spec, assign_summary } = experiment;
  const { experiment_name, description, start_date, end_date, arms, design_url } = design_spec;

  const selectedMetricName = selectedMetricAnalysis?.metric?.field_name ?? 'unknown';
  const selectedMetricAnalyses =
    selectedAnalysis.data && 'metric_analyses' in selectedAnalysis.data ? selectedAnalysis.data.metric_analyses : null;

  // Calculate MDE percentage for the selected metric
  let mdePct: string | null = null;
  if (selectedMetricAnalysis?.metric?.metric_pct_change) {
    mdePct = (selectedMetricAnalysis.metric.metric_pct_change * 100).toFixed(1);
  }

  return (
    <Flex direction="column" gap="6">
      <Flex align="start" direction="column" gap="3">
        <Flex direction="row" justify="between" gap="2" align="center" width="100%">
          <EditableTextField value={experiment_name} onSubmit={(value) => updateExperiment({ name: value })} size="2">
            <Heading size="8">{experiment_name}</Heading>
          </EditableTextField>
          <IntegrationGuideDialog
            experimentId={experimentId}
            datasourceId={datasourceId}
            organizationId={organizationId}
            arms={arms}
          />
        </Flex>

        <Flex gap="4" align="center">
          <ExperimentTypeBadge type={design_spec.experiment_type} />
          <Separator orientation="vertical" />
          <ParticipantTypeBadge
            datasourceId={experiment.datasource_id}
            participantType={experiment.design_spec.participant_type}
          />
          <Separator orientation="vertical" />
          <Flex align="center" gap="2">
            <CalendarIcon />
            <EditableDateField
              value={start_date}
              onSubmit={(value) => updateExperiment({ start_date: value })}
              size="1"
            />
            <Text>→</Text>
            <EditableDateField value={end_date} onSubmit={(value) => updateExperiment({ end_date: value })} size="1" />
          </Flex>
          <Separator orientation="vertical" />
          <Flex align="center" gap="2">
            <FileTextIcon />
            <EditableTextField
              value={design_url ?? ''}
              onSubmit={(value) => updateExperiment({ design_url: value })}
              size="1"
            >
              {design_url ? (
                <Link href={design_url} target="_blank" rel="noopener noreferrer">
                  <Text color="blue" style={{ textDecoration: 'underline' }}>
                    {design_url}
                  </Text>
                </Link>
              ) : (
                <Text color="gray">No design doc</Text>
              )}
            </EditableTextField>
          </Flex>
        </Flex>
      </Flex>
      <Flex direction="column" gap="4">
        {/* Hypothesis Section */}
        <SectionCard title="Hypothesis">
          <EditableTextArea value={description} onSubmit={(value) => updateExperiment({ description: value })} size="2">
            <ReadMoreText text={description} maxWords={30} />
          </EditableTextArea>
        </SectionCard>

        {/* Arms & Allocations Section */}
        {assign_summary && (
          <SectionCard
            headerLeft={
              <Flex gap="3" align="center">
                <Heading size="3">Arms & Allocations</Heading>
                <DownloadAssignmentsCsvButton datasourceId={experiment.datasource_id} experimentId={experimentId} />
              </Flex>
            }
            headerRight={
              <Badge>
                <PersonIcon />
                <Text size="2">{assign_summary.sample_size.toLocaleString()} participants</Text>
              </Badge>
            }
          >
            <ArmsAndAllocationsTable
              datasourceId={datasourceId}
              experimentId={experimentId}
              arms={arms}
              sampleSize={assign_summary.sample_size}
              armSizes={assign_summary.arm_sizes}
            />
          </SectionCard>
        )}

        {/* Analysis Section */}
        <SectionCard
          headerLeft={
            <Flex gap="3" align="center" wrap="wrap">
              <Heading size="3">Analysis</Heading>
              <Badge size="2">
                <Flex gap="2" align="center">
                  <Heading size="2">Metric:</Heading>
                  {selectedMetricAnalyses && selectedMetricAnalyses.length > 1 ? (
                    <Select.Root
                      size="1"
                      value={selectedMetricName}
                      onValueChange={(value) => {
                        const newMetric =
                          selectedMetricAnalyses.find((metric) => metric.metric?.field_name === value) || null;
                        setSelectedMetricAnalysis(newMetric);
                        const bounds = computeBoundsForMetric(value, [liveAnalysis, ...analysisHistory]);
                        setCiBounds(bounds);
                      }}
                    >
                      <Select.Trigger style={{ height: 18 }} />
                      <Select.Content>
                        {selectedMetricAnalyses.map((metric) => {
                          const metricName = metric.metric?.field_name ?? 'unknown';
                          return (
                            <Select.Item key={metricName} value={metricName}>
                              {metricName}
                            </Select.Item>
                          );
                        })}
                      </Select.Content>
                    </Select.Root>
                  ) : (
                    <Text>{selectedMetricName}</Text>
                  )}
                </Flex>
              </Badge>
              <MdeBadge value={mdePct} />
            </Flex>
          }
          headerRight={
            (design_spec.experiment_type === 'freq_online' || design_spec?.experiment_type === 'freq_preassigned') && (
              <Flex gap="3" wrap="wrap">
                <Flex gap="3" wrap="wrap" align="center" justify="between">
                  <Badge size="2">
                    <Flex gap="2" align="center">
                      <Heading size="2">Viewing:</Heading>
                      {analysisHistory.length == 0 ? (
                        <Text>{liveAnalysis.label}</Text>
                      ) : (
                        <Select.Root
                          size="1"
                          value={selectedAnalysis.key}
                          onValueChange={(key) => {
                            const analysis =
                              key === 'live' ? liveAnalysis : analysisHistory.find((opt) => opt.key === key);
                            setSelectedAnalysisAndMetrics(analysis || liveAnalysis); // shouldn't ever need to fall back though
                          }}
                        >
                          <Select.Trigger style={{ height: 18 }} />
                          <Select.Content>
                            <Select.Group>
                              <Select.Item key="live" value="live">
                                <Box minWidth="136px">{liveAnalysis.label}</Box>
                              </Select.Item>
                            </Select.Group>
                            <Select.Separator />
                            <Select.Group>
                              {analysisHistory.map((opt) => (
                                <Select.Item key={opt.key} value={opt.key}>
                                  <Box minWidth="136px">{opt.label}</Box>
                                </Select.Item>
                              ))}
                            </Select.Group>
                          </Select.Content>
                        </Select.Root>
                      )}
                    </Flex>
                  </Badge>
                </Flex>
                <Flex gap="3" wrap="wrap">
                  <Badge size="2">
                    <Flex gap="4" align="center">
                      <Heading size="2">Confidence:</Heading>
                      <Flex gap="2" align="center">
                        <Text>{(1 - (design_spec.alpha || 0.05)) * 100}%</Text>
                        <Tooltip content="Chance that our test correctly shows no significant difference, if there truly is none. (The probability of avoiding a false positive.)">
                          <InfoCircledIcon />
                        </Tooltip>
                      </Flex>
                    </Flex>
                  </Badge>
                  <Badge size="2">
                    <Flex gap="4" align="center">
                      <Heading size="2">Power:</Heading>
                      <Flex gap="2" align="center">
                        <Text>{design_spec.power ? `${design_spec.power * 100}%` : '?'}</Text>
                        <Tooltip content="Chance of detecting a difference at least as large as the pre-specified minimum effect for the metric, if that difference truly exists. (The probability of avoiding a false negative.)">
                          <InfoCircledIcon />
                        </Tooltip>
                      </Flex>
                    </Flex>
                  </Badge>
                </Flex>
              </Flex>
            )
          }
        >
          {isLoadingAnalysis && <XSpinner message="Loading analysis data..." />}

          {analysisError && (
            <GenericErrorCallout
              title="Error loading analysis"
              message="Analysis may not be available yet or the experiment hasn't collected enough data."
            />
          )}

          {snapshotsError && (
            <GenericErrorCallout
              title="Error loading historical analyses"
              message="Historical analyses may not be available yet."
            />
          )}

          {selectedAnalysis.data && (
            <Flex direction="column" gap="3">
              <Tabs.Root defaultValue="leaderboard">
                <Tabs.List>
                  <Tabs.Trigger value="leaderboard">Leaderboard</Tabs.Trigger>
                  <Tabs.Trigger value="metric-over-time">Metric over time</Tabs.Trigger>
                  <Tabs.Trigger value="raw">
                    <Flex gap="2" align="center">
                      Raw Data <CodeIcon />
                    </Flex>
                  </Tabs.Trigger>
                </Tabs.List>
                <Box px="4">
                  <Tabs.Content value="leaderboard">
                    <Flex direction="column" gap="3" py="3">
                      {selectedAnalysis.effectSizesByMetric && (
                        <ForestPlot
                          effectSizes={selectedAnalysis.effectSizesByMetric.get(selectedMetricName)}
                          minX={ciBounds[0]}
                          maxX={ciBounds[1]}
                        />
                      )}
                    </Flex>
                  </Tabs.Content>

                  <Tabs.Content value="metric-over-time">
                    <Flex direction="column" gap="3" py="3">
                      {analysisHistory.length > 0 && (
                        <ForestTimeseriesPlot
                          effectSizesOverTime={analysisHistory.map((analysis) => {
                            const armEffects = analysis.effectSizesByMetric?.get(selectedMetricName);
                            return {
                              key: analysis.key,
                              date: analysis.updated_at,
                              effectSizes: armEffects ?? [],
                            };
                          })}
                          minY={ciBounds[0]}
                          maxY={ciBounds[1]}
                        />
                      )}
                    </Flex>
                  </Tabs.Content>

                  <Tabs.Content value="raw">
                    <Flex direction="column" gap="3" py="3">
                      <CodeSnippetCard
                        title="Raw Data"
                        content={JSON.stringify(selectedAnalysis.data, null, 2)}
                        height="200px"
                        tooltipContent="Copy raw data"
                        variant="ghost"
                      />
                    </Flex>
                  </Tabs.Content>
                </Box>
              </Tabs.Root>
            </Flex>
          )}
        </SectionCard>
      </Flex>
    </Flex>
  );
}
