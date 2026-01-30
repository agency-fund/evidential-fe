'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { mutate } from 'swr';
import { Badge, Box, Flex, Heading, Select, Separator, Tabs, Text, Tooltip } from '@radix-ui/themes';
import {
  ActivityLogIcon,
  CalendarIcon,
  CodeIcon,
  ExclamationTriangleIcon,
  FileTextIcon,
  InfoCircledIcon,
  PersonIcon,
} from '@radix-ui/react-icons';
import {
  getGetExperimentForUiKey,
  useAnalyzeCmabExperiment,
  useAnalyzeExperiment,
  useGetExperimentForUi,
  useListSnapshots,
  useUpdateExperiment,
} from '@/api/admin';
import {
  CMABContextInputRequest,
  CMABExperimentSpecOutput,
  ContextInput,
  ExperimentAnalysisResponse,
  MABExperimentSpecOutput,
  MetricAnalysis,
  Snapshot,
} from '@/api/methods.schemas';
import { ForestPlot } from '@/components/features/experiments/plots/forest-plot';
import {
  AnalysisState,
  computeBoundsForMetric,
  getAlphaAndPower,
  isBanditAnalysis,
  isFrequentistAnalysis,
  precomputeBanditEffects,
  precomputeFreqEffectsByMetric,
  transformAnalysisForForestTimeseriesPlot,
} from '@/components/features/experiments/plots/forest-plot-utils';
import ForestTimeseriesPlot from '@/components/features/experiments/plots/forest-timeseries-plot';
import { ExperimentTypeBadge } from '@/components/features/experiments/experiment-type-badge';
import { ExperimentStatusBadge } from '@/components/features/experiments/experiment-status-badge';
import { MdeBadge } from '@/components/features/experiments/mde-badge';
import { ArmsAndAllocationsTable } from '@/components/features/experiments/arms-and-allocations-table';
import { IntegrationGuideDialog } from '@/components/features/experiments/integration-guide-dialog';
import { DownloadAssignmentsCsvButton } from '@/components/features/experiments/download-assignments-csv-button';
import { ExperimentDetailsDropdownMenu } from '@/components/features/experiments/experiment-details-dropdown-menu';
import { DecisionAndImpactSection } from '@/components/features/experiments/decision-and-impact-section';
import { ExperimentCompletionCallout } from '@/components/features/experiments/experiment-completion-callout';
import { ParticipantTypeBadge } from '@/components/features/participants/participant-type-badge';
import { XSpinner } from '@/components/ui/x-spinner';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { CodeSnippetCard } from '@/components/ui/cards/code-snippet-card';
import { SectionCard } from '@/components/ui/cards/section-card';
import { EditableTextField } from '@/components/ui/inputs/editable-text-field';
import { EditableDateField } from '@/components/ui/inputs/editable-date-field';
import { EditableTextArea } from '@/components/ui/inputs/editable-text-area';
import { ReadMoreText } from '@/components/ui/read-more-text';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { prettyJSON } from '@/services/json-utils';
import { getExperimentStatus } from '@/services/experiment-utils';
import { extractUtcHHMMLabel, formatUtcDownToMinuteLabel } from '@/services/date-utils';
import { ContextConfigBox } from '@/components/features/experiments/context-config-box';
import { isBanditSpec, isCmabExperiment, isFrequentistSpec } from '../create/types';

const SNAPSHOT_ERROR_ALERT_THRESHOLD_MS = 8 * 60 * 60 * 1000;

export default function ExperimentViewPage() {
  const params = useParams();
  const orgCtx = useCurrentOrganization();
  const organizationId = orgCtx?.current.id || '';
  const datasourceId = (params.datasourceId as string) || '';
  const experimentId = (params.experimentId as string) || '';
  const [lastErrorTimestamp, setLastErrorTimestamp] = useState<null | Date>(null);

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
  const [cmabAnalysisRequest, setCmabAnalysisRequest] = useState<CMABContextInputRequest>({
    type: 'cmab_assignment',
    context_inputs: [],
  });

  // Track the min/max CI bounds across a recent window of snapshots for more stable forest plot display.
  const [ciBounds, setCiBounds] = useState<[number | undefined, number | undefined]>([undefined, undefined]);

  const {
    data: experiment,
    isLoading: isLoadingExperiment,
    error: experimentError,
  } = useGetExperimentForUi(datasourceId, experimentId, {
    swr: {
      enabled: !!datasourceId,
      onSuccess: (exp) => {
        // Only initialize context input ids for CMAB experiments if they are not already set.
        // Should only need to set this once for an experiment, as they are fixed at design time.
        if (
          isBanditSpec(exp.design_spec) &&
          exp.design_spec.contexts &&
          cmabAnalysisRequest.context_inputs.length === 0
        ) {
          const contextInputs = exp.design_spec.contexts
            .filter((ctx) => ctx.context_id !== undefined)
            .map((ctx) => ({ context_id: ctx.context_id!, context_value: 0.0 }));
          setCmabAnalysisRequest({ ...cmabAnalysisRequest, context_inputs: contextInputs });
        }
      },
    },
  });

  const {
    mutate: analyzeLive,
    isLoading: isLoadingLiveAnalysis,
    error: liveAnalysisError,
  } = useAnalyzeExperiment(datasourceId, experimentId, undefined, {
    swr: {
      enabled: !!datasourceId && !!experiment && !isCmabExperiment(experiment),
      // Disable revalidation to only allow manual triggering of the live analysis
      revalidateOnMount: false,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onSuccess: (analysisData) => handleLiveAnalysisSuccess(analysisData),
    },
  });

  const {
    trigger: analyzeLiveCmab,
    isMutating: isLoadingLiveCmabAnalysis,
    error: liveCmabAnalysisError,
  } = useAnalyzeCmabExperiment(datasourceId, experimentId, {
    swr: {
      onSuccess: (analysisData) => handleLiveAnalysisSuccess(analysisData),
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
        shouldRetryOnError: false,
        onSuccess: async (data) => {
          // Make human-readable labels for the dropdown, showing UTC down to the minute.
          // Use the snapshot ID as the key, looking up the analysisState by ID upon selection.

          // Do live analysis if there are no snapshots
          if (data.items.length === 0) {
            await triggerLiveAnalysis();
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

          // Convert to array
          const filteredSnapshots = Array.from(snapshotsByDate.values());
          const history: AnalysisState[] = filteredSnapshots.map((s) => {
            // The results are guaranteed to be non-null because of the status filter.
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

          setLastErrorTimestamp(data.latest_failure === null ? null : new Date(data.latest_failure));
          setAnalysisHistory(history);
          // If we're not viewing real data, set the selected analysis to the most recent snapshot
          if (selectedAnalysisState.data === undefined) {
            setSelectedAnalysisAndMetrics(history[0], selectedMetricName, history);
          }
        },
        onError: async () => {
          // Trigger live analysis if snapshot loading fails
          await triggerLiveAnalysis();
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

  const setSelectedAnalysisAndMetrics = (
    analysis: AnalysisState,
    forMetricName: string | undefined = undefined,
    historyOverride: AnalysisState[] | undefined = undefined,
  ) => {
    setSelectedAnalysisState(analysis);
    if (!isFrequentistAnalysis(analysis.data)) {
      setSelectedMetricAnalysis(null);
      return;
    }

    // Try to maintain the same metric as before when switching between snapshots.
    // The fallback to the first metric should not actually happen in practice.
    const nameToFind = forMetricName || selectedMetricName;
    const metricAnalyses = analysis.data.metric_analyses;
    const newMetric: MetricAnalysis | null =
      metricAnalyses.find((metric) => metric.metric_name === nameToFind) || metricAnalyses[0] || null;
    const newMetricName = newMetric?.metric_name || 'unknown';
    // Recompute bounds if the metric changed
    if (selectedMetricName !== newMetricName) {
      setSelectedMetricName(newMetricName);

      // First make a copy since we may mutate contents by adding live data.
      const snapshotsToUse = [...(historyOverride || analysisHistory)];
      // Include the live analysis if it has data.
      if (analysis.key === 'live' && analysis.data) {
        snapshotsToUse.push(analysis);
      } else if (liveAnalysis.data) {
        snapshotsToUse.push(liveAnalysis);
      }
      const bounds = computeBoundsForMetric(newMetricName, snapshotsToUse);
      setCiBounds(bounds);
    }
    setSelectedMetricAnalysis(newMetric);
  };

  // Wrapper around the live analysis functions for CMAB and non-CMAB experiments.
  const triggerLiveAnalysis = async (requestOverride?: CMABContextInputRequest) => {
    const request = requestOverride ?? cmabAnalysisRequest;
    return isCmabExperiment(experiment) ? await analyzeLiveCmab(request) : await analyzeLive();
  };

  const handleLiveAnalysisSuccess = (analysisData: ExperimentAnalysisResponse) => {
    const date = new Date();
    const analysis: AnalysisState = {
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
  };

  const handleSelectAnalysis = async (key: string) => {
    const analysis = key === 'live' ? liveAnalysis : analysisHistory.find((opt) => opt.key === key);
    setSelectedAnalysisAndMetrics(analysis || liveAnalysis);
    // If we haven't fetched it yet, trigger a live analysis.
    if (key == 'live' && liveAnalysis.data === undefined) {
      await triggerLiveAnalysis();
    }
  };

  const handleUpdateCmabContextValue = async (key: string, context_inputs: ContextInput[]) => {
    if (key === 'live') {
      const updatedRequest = { ...cmabAnalysisRequest, context_inputs: context_inputs };
      setCmabAnalysisRequest(updatedRequest);
      await triggerLiveAnalysis(updatedRequest);
    } else {
      console.warn('Cannot update context values for snapshot analyses.');
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
  const { alpha, power } = getAlphaAndPower(experiment); // undefined for non-frequentist experiments
  const { experiment_name, description, start_date, end_date, arms, design_url } = design_spec;
  const isFrequentistExperiment = isFrequentistSpec(design_spec);
  const contexts = isBanditSpec(design_spec) ? (design_spec.contexts ?? []) : [];

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

  const isLastSnapshotErrorRelevant =
    lastErrorTimestamp !== null && Date.now() - lastErrorTimestamp.getTime() <= SNAPSHOT_ERROR_ALERT_THRESHOLD_MS;

  return (
    <Flex direction="column" gap="6">
      <Flex direction="column" gap="3">
        <Flex direction="row" justify="between" gap="2" align="center">
          <EditableTextField value={experiment_name} onSubmit={(value) => updateExperiment({ name: value })} size="2">
            <Heading size="8">{experiment_name}</Heading>
          </EditableTextField>
          <Flex gap="2" align="center">
            <IntegrationGuideDialog
              experimentId={experimentId}
              datasourceId={datasourceId}
              organizationId={organizationId}
              arms={arms}
              contexts={contexts}
            />
            <ExperimentDetailsDropdownMenu datasourceId={datasourceId} experimentId={experimentId} />
          </Flex>
        </Flex>

        <ExperimentCompletionCallout endDate={end_date} hasImpact={!!impact} hasDecision={!!decision} />

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
              {isFrequentistExperiment ? (
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
              ) : isBanditAnalysis(selectedAnalysisState.data) &&
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
                  {cmabAnalysisRequest.context_inputs.length > 0 && (
                    <ContextConfigBox
                      analysisKey={selectedAnalysisState.key}
                      contexts={(experiment.design_spec as CMABExperimentSpecOutput).contexts || []}
                      contextValues={cmabAnalysisRequest.context_inputs}
                      onUpdate={handleUpdateCmabContextValue}
                    />
                  )}
                </>
              ) : null}
            </Flex>
          }
          headerRight={
            <Flex gap="3" wrap="wrap">
              <Flex gap="3" wrap="wrap" align="center" justify="between">
                <Badge size="2" style={{ height: '26px' }}>
                  <Flex gap="2" align="center">
                    <Heading size="2">Viewing:</Heading>
                    {analysisHistory.length == 0 ? (
                      <Text>{liveAnalysis.label}</Text>
                    ) : (
                      <>
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
                        {isLastSnapshotErrorRelevant ? (
                          <Tooltip content={'Last snapshot error: ' + lastErrorTimestamp?.toLocaleTimeString()}>
                            <Link href={`/datasources/${datasourceId}/experiments/${experimentId}/snapshots`}>
                              <ExclamationTriangleIcon color={'red'} />
                            </Link>
                          </Tooltip>
                        ) : (
                          <Tooltip content={'View snapshot log'}>
                            <Link href={`/datasources/${datasourceId}/experiments/${experimentId}/snapshots`}>
                              <ActivityLogIcon />
                            </Link>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </Flex>
                </Badge>
              </Flex>
              {isFrequentistExperiment ? (
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
              ) : (
                <Badge size="2">
                  <Flex gap="4" align="center">
                    <Tooltip
                      content={`The leaderboard and timeseries show the posterior predictive mean—the estimated average outcome for each arm after observing data and accounting for prior beliefs and noise. This is not a treatment effect! The CI is a confidence interval indicating the interval that contains the true average outcome with 95% probability.`}
                    >
                      <InfoCircledIcon />
                    </Tooltip>
                  </Flex>
                </Badge>
              )}
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
                {(isLoadingLiveCmabAnalysis || isLoadingLiveAnalysis || isLoadingHistory) && (
                  <Tabs.Trigger value="loading" disabled={true}>
                    <Flex gap="2" align="center">
                      <XSpinner message="Loading analyses..." />
                    </Flex>
                  </Tabs.Trigger>
                )}
              </Tabs.List>
              <Box px="4">
                <Tabs.Content value="leaderboard">
                  <Flex direction="column" gap="3" py="3">
                    {/* Analysis may not be available yet or the experiment hasn't collected enough data. */}
                    {(liveAnalysisError || liveCmabAnalysisError) && (
                      <GenericErrorCallout
                        title="Error loading live analysis"
                        error={liveAnalysisError ?? liveCmabAnalysisError}
                      />
                    )}

                    {selectedAnalysisState.data && (
                      <ForestPlot
                        effectSizes={selectedAnalysisState.effectSizesByMetric?.get(selectedMetricName)}
                        banditEffects={selectedAnalysisState.banditEffects}
                        minX={ciBounds[0]}
                        maxX={ciBounds[1]}
                      />
                    )}

                    {analysisHistoryError && (
                      <GenericErrorCallout
                        title="Error loading historical analyses"
                        message="Historical analyses may not be available yet."
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

        <div id="decision-and-impact" />
        <DecisionAndImpactSection
          impact={impact}
          decision={decision}
          onUpdate={(updates) => updateExperiment(updates)}
        />
      </Flex>
    </Flex>
  );
}
