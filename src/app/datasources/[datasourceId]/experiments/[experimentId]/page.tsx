'use client';
import { Badge, Box, Flex, Heading, Separator, Tabs, Text, Tooltip, Select, Callout } from '@radix-ui/themes';
import { useParams } from 'next/navigation';
import { CalendarIcon, CodeIcon, InfoCircledIcon, PersonIcon, FileTextIcon } from '@radix-ui/react-icons';
import {
  useAnalyzeExperiment,
  useGetExperimentForUi,
  useListSnapshots,
  useUpdateExperiment,
  getGetExperimentForUiKey,
} from '@/api/admin';
import { ForestPlot } from '@/components/features/experiments/plots/forest-plot';
import {
  computeBoundsForMetric,
  AnalysisState,
  precomputeFreqEffectsByMetric,
  precomputeBanditEffects,
  isFrequentist,
  isBandit,
  transformAnalysisForForestTimeseriesPlot,
  getAlphaAndPower,
} from '@/components/features/experiments/plots/forest-plot-utils';
import { XSpinner } from '@/components/ui/x-spinner';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { useState } from 'react';
import { CodeSnippetCard } from '@/components/ui/cards/code-snippet-card';
import { prettyJSON } from '@/services/json-utils';
import { ExperimentTypeBadge } from '@/components/features/experiments/experiment-type-badge';
import { ExperimentStatusBadge } from '@/components/features/experiments/experiment-status-badge';
import { ParticipantTypeBadge } from '@/components/features/participants/participant-type-badge';
import { getExperimentStatus } from '@/services/experiment-utils';
import { SectionCard } from '@/components/ui/cards/section-card';
import { MdeBadge } from '@/components/features/experiments/mde-badge';
import { EditableTextField } from '@/components/ui/inputs/editable-text-field';
import { EditableDateField } from '@/components/ui/inputs/editable-date-field';
import { EditableTextArea } from '@/components/ui/inputs/editable-text-area';
import { EditExperimentImpact } from '@/components/features/experiments/edit-experiment-impact';
import { ArmsAndAllocationsTable } from '@/components/features/experiments/arms-and-allocations-table';
import { IntegrationGuideDialog } from '@/components/features/experiments/integration-guide-dialog';
import { ReadMoreText } from '@/components/ui/read-more-text';
import { Snapshot, MetricAnalysis, ExperimentAnalysisResponse, MABExperimentSpecOutput } from '@/api/methods.schemas';
import { DownloadAssignmentsCsvButton } from '@/components/features/experiments/download-assignments-csv-button';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { extractUtcHHMMLabel, formatUtcDownToMinuteLabel } from '@/services/date-utils';
import Link from 'next/link';
import { mutate } from 'swr';
import ForestTimeseriesPlot from '@/components/features/experiments/plots/forest-timeseries-plot';

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
    effectSizesByMetric: undefined,
    banditEffects: undefined,
  });
  // which analysis we're actually displaying (live or a snapshot)
  const [selectedAnalysisState, setSelectedAnalysisState] = useState<AnalysisState>(liveAnalysis);
  const [selectedMetricAnalysis, setSelectedMetricAnalysis] = useState<MetricAnalysis | null>(null);
  const [selectedMetricName, setSelectedMetricName] = useState<string>('unknown');

  // Track the min/max CI bounds across a recent window of snapshots for more stable forest plot display.
  const [ciBounds, setCiBounds] = useState<[number | undefined, number | undefined]>([undefined, undefined]);

  const {
    data: experiment,
    isLoading: isLoadingExperiment,
    error: experimentError,
  } = useGetExperimentForUi(datasourceId, experimentId, {
    swr: { enabled: !!datasourceId },
  });

  const {
    mutate: analyzeLive,
    isLoading: isLoadingLiveAnalysis,
    error: liveAnalysisError,
  } = useAnalyzeExperiment(datasourceId, experimentId, undefined, {
    swr: {
      enabled: !!datasourceId && !!experiment,
      // Disable revalidation to only allow manual triggering of the live analysis
      revalidateOnMount: false,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onSuccess: (analysisData) => {
        const date = new Date();
        const analysis = {
          key: 'live',
          data: analysisData,
          updated_at: date,
          label: `LIVE as of ${extractUtcHHMMLabel(date)}`,
          effectSizesByMetric: precomputeFreqEffectsByMetric(analysisData, alpha),
          banditEffects: precomputeBanditEffects(analysisData),
        };
        setLiveAnalysis(analysis);
        // Only update the display if we were previously viewing live data.
        if (selectedAnalysisState.key === 'live') {
          setSelectedAnalysisAndMetrics(analysis);
        }
      },
    },
  });

  const { isLoading: isLoadingHistory, error: analysisHistoryError } = useListSnapshots(
    organizationId,
    datasourceId,
    experimentId,
    { status: ['success'] },
    {
      swr: {
        enabled: !!organizationId && !!datasourceId && !!experimentId && !!experiment,
        revalidateOnFocus: false,
        shouldRetryOnError: false,
        onSuccess: async (data) => {
          // Make human-readable labels for the dropdown, showing UTC down to the minute.
          // Use the snapshot ID as the key, looking up the analysisState by ID upon selection.

          // Do live analysis if there are no snapshots
          if (data.items.length === 0) {
            await analyzeLive();
            return;
          }

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

          const history: AnalysisState[] = filteredSnapshots.map((s) => {
            const analysisData = s.data as ExperimentAnalysisResponse;
            const date = new Date(s.updated_at);
            return {
              key: s.id,
              data: analysisData,
              updated_at: date,
              label: formatUtcDownToMinuteLabel(date),
              effectSizesByMetric: precomputeFreqEffectsByMetric(analysisData, alpha),
              banditEffects: precomputeBanditEffects(analysisData),
            };
          });

          setAnalysisHistory(history);
          // No need to recompute CI bounds here since we don't have live analysis data yet and don't allow refreshing.
          // If we're not viewing real data, set the selected analysis to the most recent snapshot
          if (selectedAnalysisState.data === undefined) {
            setSelectedAnalysisAndMetrics(history[0]);
          }
        },
        onError: async () => {
          // Trigger live analysis if snapshot loading fails
          await analyzeLive();
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

  const setSelectedAnalysisAndMetrics = (analysis: AnalysisState, forMetricName: string | undefined = undefined) => {
    setSelectedAnalysisState(analysis);
    if (!isFrequentist(analysis.data)) {
      setSelectedMetricAnalysis(null);
      return;
    }

    // Try to maintain the same metric as before when switching between snapshots.
    // The fallback to the first metric should not actually happen in practice.
    const nameToFind = forMetricName || selectedMetricName;
    const metricAnalyses = analysis.data.metric_analyses;
    const newMetric: MetricAnalysis | undefined =
      metricAnalyses.find((metric) => metric.metric_name === nameToFind) || metricAnalyses[0];
    const newMetricName = newMetric?.metric_name || 'unknown';
    // Recompute bounds if the metric changed
    if (selectedMetricName !== newMetricName) {
      setSelectedMetricName(newMetricName);
      // check if the selection is 'live' and use it since the state may not have been updated yet.
      const bounds = computeBoundsForMetric(newMetricName, [
        analysis.key === 'live' ? analysis : liveAnalysis,
        ...analysisHistory,
      ]);
      setCiBounds(bounds);
    }
    setSelectedMetricAnalysis(newMetric);
  };

  const handleSelectAnalysis = async (key: string) => {
    const analysis = key === 'live' ? liveAnalysis : analysisHistory.find((opt) => opt.key === key);
    setSelectedAnalysisAndMetrics(analysis || liveAnalysis);
    // If we haven't fetched it yet, trigger a live analysis.
    if (key == 'live' && liveAnalysis.data === undefined) {
      await analyzeLive();
    }
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

  const { design_spec, assign_summary, decision, impact } = experiment;
  const { experiment_name, description, start_date, end_date, arms, design_url } = design_spec;
  const { alpha, power } = getAlphaAndPower(experiment); // undefined for non-frequentist experiments

  const selectedMetricAnalyses =
    selectedAnalysisState.data && 'metric_analyses' in selectedAnalysisState.data
      ? selectedAnalysisState.data.metric_analyses
      : null;

  // Calculate MDE percentage for the selected metric
  let mdePct: string | null = null;
  if (selectedMetricAnalysis?.metric?.metric_pct_change) {
    mdePct = (selectedMetricAnalysis.metric.metric_pct_change * 100).toFixed(1);
  }

  const { timeseriesData, armMetadata, minDate, maxDate } = transformAnalysisForForestTimeseriesPlot(
    analysisHistory,
    selectedMetricName,
  );

  // Determine if we should show impact reminder callout
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Start of today in local timezone

  const [year, month, day] = end_date.split('T')[0].split('-').map(Number);
  const endDateTime = new Date(year, month - 1, day); // Create date in local timezone

  const daysUntilEnd = Math.ceil((endDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isFinished = daysUntilEnd < 0;
  const isEndingToday = daysUntilEnd === 0;
  const isFinishingSoon = daysUntilEnd > 0 && daysUntilEnd <= 3;

  const shouldShowImpactReminder = !impact && (isFinished || isEndingToday || isFinishingSoon);
  const shouldShowDecisionReminder = !decision && (isFinished || isEndingToday || isFinishingSoon);

  let impactReminderMessage = '';
  if (shouldShowImpactReminder) {
    if (isFinished) {
      impactReminderMessage = 'This experiment has concluded. Please choose an impact level below.';
    } else if (isEndingToday) {
      impactReminderMessage = 'This experiment ends today. Please choose an impact level below.';
    } else if (isFinishingSoon) {
      impactReminderMessage = `This experiment ends in ${daysUntilEnd} ${daysUntilEnd === 1 ? 'day' : 'days'}. Please choose an impact level below`;
    }
  }

  let decisionReminderMessage = '';
  if (shouldShowDecisionReminder) {
    if (isFinished) {
      decisionReminderMessage = 'This experiment has concluded. Please document your decision below.';
    } else if (isEndingToday) {
      decisionReminderMessage = 'This experiment ends today. Please document your decision below.';
    } else if (isFinishingSoon) {
      decisionReminderMessage = `This experiment ends in ${daysUntilEnd} ${daysUntilEnd === 1 ? 'day' : 'days'}. Please document your decision below.`;
    }
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

        {shouldShowImpactReminder && (
          <Callout.Root color="orange" style={{ width: '100%' }}>
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>{impactReminderMessage}</Callout.Text>
          </Callout.Root>
        )}

          {shouldShowDecisionReminder && (
          <Callout.Root color="orange" style={{ width: '100%' }}>
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>{decisionReminderMessage}</Callout.Text>
          </Callout.Root>
        )}

        <Flex gap="4" align="center">
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
          <ExperimentStatusBadge status={getExperimentStatus(start_date, end_date)} />
         
              <Separator orientation="vertical" />
              <EditExperimentImpact
                value={impact}
                onSubmit={(value) => updateExperiment({ impact: value })}
                size="1"
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
            <FileTextIcon />
            <EditableTextField
              value={design_url ?? ''}
              onSubmit={(value) => updateExperiment({ design_url: value })}
              size="1"
            >
              {design_url ? (
                <Link href={design_url} target="_blank" rel="noopener noreferrer">
                  <Text color="blue" style={{ textDecoration: 'underline' }}>
                    {design_url.slice(0, 30)}
                    {design_url.length > 30 ? '...' : ''}
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
              {isFrequentist(selectedAnalysisState.data) ? (
                <Flex gap="3" wrap="wrap">
                  <Badge size="2">
                    <Flex gap="2" align="center">
                      <Heading size="2">Metric:</Heading>
                      {selectedMetricAnalyses && selectedMetricAnalyses.length > 1 ? (
                        <Select.Root
                          size="1"
                          value={selectedMetricName}
                          onValueChange={(metricName) => {
                            setSelectedAnalysisAndMetrics(selectedAnalysisState, metricName);
                          }}
                        >
                          <Select.Trigger style={{ height: 18 }} />
                          <Select.Content>
                            {selectedMetricAnalyses.map((metric) => {
                              return (
                                <Select.Item key={metric.metric_name} value={metric.metric_name}>
                                  {metric.metric_name}
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
              ) : isBandit(selectedAnalysisState.data) &&
                selectedAnalysisState.banditEffects &&
                selectedAnalysisState.banditEffects.length > 1 ? (
                <>
                  <Badge size="2">
                    <Flex gap="2" align="center">
                      <Heading size="2"> Prior Type:</Heading>
                      <Text>{(experiment.design_spec as MABExperimentSpecOutput).prior_type}</Text>
                    </Flex>
                  </Badge>
                  <Badge size="2">
                    <Flex gap="2" align="center">
                      <Heading size="2">Reward Type:</Heading>
                      <Text>{(experiment.design_spec as MABExperimentSpecOutput).reward_type}</Text>
                    </Flex>
                  </Badge>
                </>
              ) : null}
            </Flex>
          }
          headerRight={
            <Flex gap="3" wrap="wrap">
              <Flex gap="3" wrap="wrap" align="center" justify="between">
                <Badge size="2">
                  <Flex gap="2" align="center">
                    <Heading size="2">Viewing:</Heading>
                    {analysisHistory.length == 0 ? (
                      <Text>{liveAnalysis.label}</Text>
                    ) : (
                      <Select.Root size="1" value={selectedAnalysisState.key} onValueChange={handleSelectAnalysis}>
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
              {isFrequentist(selectedAnalysisState.data) ? (
                <Flex gap="3" wrap="wrap">
                  <Badge size="2">
                    <Flex gap="4" align="center">
                      <Heading size="2">Confidence:</Heading>
                      <Flex gap="2" align="center">
                        <Text>{alpha ? `${(1 - alpha) * 100}%` : '?'}</Text>
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
                        <Text>{power ? `${power * 100}%` : '?'}</Text>
                        <Tooltip content="Chance of detecting a difference at least as large as the pre-specified minimum effect for the metric, if that difference truly exists. (The probability of avoiding a false negative.)">
                          <InfoCircledIcon />
                        </Tooltip>
                      </Flex>
                    </Flex>
                  </Badge>
                </Flex>
              ) : isBandit(selectedAnalysisState.data) ? (
                <Badge size="2">
                  <Flex gap="4" align="center">
                    <Tooltip
                      content={`The leaderboard and timeseries show the posterior predictive mean—the estimated average outcome for each arm after observing data and accounting for prior beliefs and noise. This is not a treatment effect! The CI is a credible interval indicating the range containing the true average outcome with 95% probability.`}
                    >
                      <InfoCircledIcon />
                    </Tooltip>
                  </Flex>
                </Badge>
              ) : null}
            </Flex>
          }
        >
          <Flex direction="column" gap="3">
            <Tabs.Root defaultValue="leaderboard">
              <Tabs.List>
                <Tabs.Trigger value="leaderboard">Leaderboard</Tabs.Trigger>
                <Tabs.Trigger value="raw">
                  <Flex gap="2" align="center">
                    Raw Data <CodeIcon />
                  </Flex>
                </Tabs.Trigger>
              </Tabs.List>
              <Box px="4">
                <Tabs.Content value="leaderboard">
                  <Flex direction="column" gap="3" py="3">
                    {/* Analysis may not be available yet or the experiment hasn't collected enough data. */}
                    {liveAnalysisError && (
                      <GenericErrorCallout title="Error loading live analysis" error={liveAnalysisError} />
                    )}

                    {analysisHistoryError && (
                      <GenericErrorCallout
                        title="Error loading historical analyses"
                        message="Historical analyses may not be available yet."
                      />
                    )}

                    {isLoadingLiveAnalysis && <XSpinner message="Loading live analysis..." />}

                    {isLoadingHistory && <XSpinner message="Loading historical analyses..." />}

                    {!isLoadingLiveAnalysis && selectedAnalysisState.data && (
                      <ForestPlot
                        effectSizes={selectedAnalysisState.effectSizesByMetric?.get(selectedMetricName)}
                        banditEffects={selectedAnalysisState.banditEffects}
                        minX={ciBounds[0]}
                        maxX={ciBounds[1]}
                      />
                    )}

                    {!isLoadingHistory && (
                      <ForestTimeseriesPlot
                        data={timeseriesData}
                        armMetadata={armMetadata}
                        minDate={minDate}
                        maxDate={maxDate}
                        onPointClick={handleSelectAnalysis}
                      />
                    )}
                  </Flex>
                </Tabs.Content>

                <Tabs.Content value="raw">
                  <Flex direction="column" gap="3" py="3">
                    <CodeSnippetCard
                      title="Raw Data"
                      content={selectedAnalysisState.data ? prettyJSON(selectedAnalysisState.data) : 'NO DATA'}
                      height="200px"
                      tooltipContent="Copy raw data"
                      variant="ghost"
                    />
                  </Flex>
                </Tabs.Content>
              </Box>
            </Tabs.Root>
          </Flex>
        </SectionCard>
      
         <SectionCard title="Decision">
          <EditableTextArea value={decision || ''} onSubmit={(value) => updateExperiment({ decision: value })} size="2">
            <ReadMoreText text={decision || 'Briefly describe the key takeaway and decision take from this experiment'} maxWords={30} />
          </EditableTextArea>
        </SectionCard>
      </Flex>
    </Flex>
  );
}
