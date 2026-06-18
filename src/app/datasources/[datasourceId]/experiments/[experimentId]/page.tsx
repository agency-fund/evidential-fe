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
import {
  isBanditSpec,
  isCmabExperiment,
  isCmabSpec,
  isFrequentistSpec,
} from '@/app/experiments/create/experiment-form/experiment-form-types';
import { TableNameBadge } from '@/components/features/participants/table-name-badge';
import { TargetingDialog } from '@/components/features/experiments/targeting-dialog';
import { DesignDetailsDialog } from '@/components/features/experiments/design-details-dialog';

const SNAPSHOT_ERROR_ALERT_THRESHOLD_MS = 8 * 60 * 60 * 1000;

/**
 * Returns the metric's analysis corresponding to the selectedMetricName from a list of analyses.
 * This list should normally come from the selected AnalysisState.
 *
 * If no analysis is found for the selectedMetricName, falls back to the first metric available.
 * This could happen e.g. when the selection is null on the first page load.
 */
function resolveSelectedMetricAnalysis(
  selectedMetricAnalyses: MetricAnalysis[] | null,
  selectedMetricName: string | null,
): MetricAnalysis | null {
  if (!selectedMetricAnalyses) return null;

  const selectedMetric = selectedMetricAnalyses.find((metric) => metric.metric_name === selectedMetricName);
  if (selectedMetric) return selectedMetric;

  return selectedMetricAnalyses[0] ?? null;
}

/**
 * Fallback metric name to use as the active metric if there even were no metric analyses available,
 * as can happen when viewing 'live' data that has not been fetched yet.
 */
function resolveFallbackMetricName(
  selectedMetricAnalyses: MetricAnalysis[] | null,
  analysisHistory: AnalysisState[],
  liveAnalysisData: ExperimentAnalysisResponse | undefined,
): string | undefined {
  const historicalMetricAnalyses = isFrequentistAnalysis(analysisHistory[0]?.data)
    ? analysisHistory[0].data.metric_analyses
    : null;
  const liveMetricAnalyses = isFrequentistAnalysis(liveAnalysisData) ? liveAnalysisData.metric_analyses : null;
  return (
    selectedMetricAnalyses?.[0]?.metric_name ??
    historicalMetricAnalyses?.[0]?.metric_name ??
    liveMetricAnalyses?.[0]?.metric_name ??
    undefined
  );
}

/**
 * Derives min/max CI bounds for more stable plot axes from a recent window of snapshots.
 */
function computeCiBoundsForForestPlot(
  activeMetricName: string | undefined,
  analysisHistory: AnalysisState[],
  liveAnalysis: AnalysisState,
): ReturnType<typeof computeBoundsForMetric> {
  const analysesForBounds = liveAnalysis.data ? [...analysisHistory, liveAnalysis] : analysisHistory;
  return computeBoundsForMetric(activeMetricName, analysesForBounds);
}

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
  // The key of the selected analysis to display ('live' or a snapshot ID) in the Forest Plot.
  const [selectedAnalysisKey, setSelectedAnalysisKey] = useState<AnalysisState['key'] | null>(null);
  const [selectedMetricName, setSelectedMetricName] = useState<string | null>(null);
  const [cmabAnalysisRequest, setCmabAnalysisRequest] = useState<CMABContextInputRequest>({
    type: 'cmab_assignment',
    context_inputs: [],
  });
  const cmabContextInputs = cmabAnalysisRequest.context_inputs ?? [];

  const {
    data: experiment,
    isLoading: isLoadingExperiment,
    error: experimentError,
  } = useGetExperimentForUi(datasourceId, experimentId, {
    swr: {
      enabled: !!datasourceId,
      onSuccess: (expForUi) => {
        const expConfig = expForUi.config;
        // Only initialize context input ids for CMAB experiments if they are not already set.
        // Should only need to set this once for an experiment, as they are fixed at design time.
        if (isCmabSpec(expConfig.design_spec) && expConfig.design_spec.contexts && cmabContextInputs.length === 0) {
          const contextInputs = expConfig.design_spec.contexts
            .filter((ctx) => ctx.context_id !== undefined)
            .map((ctx) => ({ context_id: ctx.context_id!, context_value: 0.0 }));
          setCmabAnalysisRequest({ ...cmabAnalysisRequest, context_inputs: contextInputs });
        }
      },
    },
  });

  const {
    mutate: analyzeLive,
    data: analyzeExperimentData,
    isLoading: isLoadingLiveAnalysis,
    error: liveAnalysisError,
  } = useAnalyzeExperiment(datasourceId, experimentId, undefined, {
    swr: {
      enabled: !!datasourceId && !!experiment && !isCmabExperiment(experiment.config),
      // Disable revalidation to only allow manual triggering of the live analysis
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnMount: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
      onSuccess: (analysisData) => handleLiveAnalysisSuccess(analysisData),
    },
  });

  const {
    trigger: analyzeLiveCmab,
    data: analyzeCmabExperimentData,
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
    { status: ['success'], page_size: Number.MAX_SAFE_INTEGER },
    {
      swr: {
        enabled: !!organizationId && !!datasourceId && !!experimentId && !!experiment,
        shouldRetryOnError: false,
        focusThrottleInterval: 15 * 60_000, // refresh on focus after 15 minutes
        onSuccess: async (data) => {
          // Make human-readable labels for the dropdown, showing UTC down to the minute.
          // Use the snapshot ID as the key, looking up the analysisState by ID upon selection.

          // Do live analysis if there are no snapshots and we don't have live analysis data already. This avoids
          // duplicating a potentially expensive query when useListSnapshots runs.
          if (data.items.length === 0) {
            // No snapshots. First check if we have (cached) live analysis data. If so, use that for display.
            if (isCmabExperiment(experiment?.config) && analyzeCmabExperimentData !== undefined) {
              handleLiveAnalysisSuccess(analyzeCmabExperimentData);
            } else if (analyzeExperimentData !== undefined) {
              handleLiveAnalysisSuccess(analyzeExperimentData);
            } else {
              await triggerLiveAnalysis();
            }
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

  // Wrapper around the live analysis functions for CMAB and non-CMAB experiments.
  const triggerLiveAnalysis = async (requestOverride?: CMABContextInputRequest) => {
    const request = requestOverride ?? cmabAnalysisRequest;
    return isCmabExperiment(experiment?.config) ? await analyzeLiveCmab(request) : await analyzeLive();
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
  };

  const handleSelectAnalysis = async (key: string) => {
    setSelectedAnalysisKey(key);
    if (key === 'live') {
      // If we haven't fetched it yet, trigger a live analysis.
      if (liveAnalysis.data === undefined) {
        await triggerLiveAnalysis();
      }
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

  // Using this key, we derive the displayed analysis for the Forest Plot:
  // selected analysis > first historical analysis > live.
  const activeAnalysisKey = selectedAnalysisKey ?? analysisHistory[0]?.key ?? 'live';

  // And if the selected key is stale, try to fall back to the first again else live.
  const selectedAnalysisState =
    activeAnalysisKey === 'live'
      ? liveAnalysis
      : (analysisHistory.find((opt) => opt.key === activeAnalysisKey) ?? analysisHistory[0] ?? liveAnalysis);

  // Get the list of metrics' analyses that may be displayed for dropdown selection.
  const selectedMetricAnalyses = isFrequentistAnalysis(selectedAnalysisState.data)
    ? selectedAnalysisState.data.metric_analyses
    : null;

  const selectedMetricAnalysis = resolveSelectedMetricAnalysis(selectedMetricAnalyses, selectedMetricName);

  const fallbackMetricName = resolveFallbackMetricName(selectedMetricAnalyses, analysisHistory, liveAnalysis.data);

  const activeMetricName = selectedMetricAnalysis?.metric_name ?? fallbackMetricName;

  const activeMetricEffectSizes = activeMetricName
    ? selectedAnalysisState.effectSizesByMetric?.get(activeMetricName)
    : undefined;

  const ciBounds = computeCiBoundsForForestPlot(activeMetricName, analysisHistory, liveAnalysis);

  const showLoadingAnalysisSpinner = isLoadingLiveAnalysis || isLoadingLiveCmabAnalysis || isLoadingHistory;

  if (isLoadingExperiment) {
    return <XSpinner message="Loading experiment details..." />;
  }

  if (experimentError) {
    return <GenericErrorCallout title="Error loading experiment" error={experimentError} />;
  }

  if (!experiment) {
    return <Text>No experiment data found</Text>;
  }
  const { design_spec, assign_summary, decision, impact } = experiment.config;
  const { alpha } = getAlphaAndPower(experiment.config); // undefined for non-frequentist experiments
  const { experiment_name, description, start_date, end_date, arms, design_url } = design_spec;
  const isFrequentistExperiment = isFrequentistSpec(design_spec);
  const contexts = isBanditSpec(design_spec) ? (design_spec.contexts ?? []) : [];

  const metricPowerAnalysis = experiment.config.power_analyses?.analyses?.find(
    (analysis) => analysis.metric_spec.field_name === selectedMetricAnalysis?.metric?.field_name,
  );

  const targetMdePct =
    selectedMetricAnalysis?.metric?.metric_pct_change != null
      ? (selectedMetricAnalysis.metric.metric_pct_change * 100).toFixed(1)
      : null;

  const estimatedMdePct =
    metricPowerAnalysis?.pct_change_with_desired_n != null
      ? (metricPowerAnalysis.pct_change_with_desired_n * 100).toFixed(1)
      : null;

  const mdePct = estimatedMdePct ?? targetMdePct;

  const { timeseriesData, armMetadata, minDate, maxDate } = transformAnalysisForForestTimeseriesPlot(
    analysisHistory,
    activeMetricName,
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
          {isFrequentistSpec(design_spec) && (
            <>
              <TableNameBadge tableName={design_spec.table_name} />
              <Separator orientation="vertical" />
            </>
          )}
          <>
            <TargetingDialog designSpec={design_spec} webhookIds={experiment.config.webhooks ?? []} />
            <Separator orientation="vertical" />
          </>
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
                <DownloadAssignmentsCsvButton
                  datasourceId={experiment.config.datasource_id}
                  experimentId={experimentId}
                />
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
                          value={activeMetricName ?? undefined}
                          onValueChange={(metricName) => {
                            setSelectedMetricName(metricName);
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
                        <Text>{activeMetricName ?? 'Unknown Metric'}</Text>
                      )}
                    </Flex>
                  </Badge>
                  <MdeBadge value={mdePct} kind={estimatedMdePct != null ? 'estimated' : 'target'} />
                  <DesignDetailsDialog
                    designSpec={design_spec}
                    experimentSchema={experiment.experiment_schema}
                    assignSummary={assign_summary}
                    powerAnalyses={experiment.config.power_analyses?.analyses}
                  />
                </Flex>
              ) : isBanditAnalysis(selectedAnalysisState.data) &&
                selectedAnalysisState.banditEffects &&
                selectedAnalysisState.banditEffects.length > 1 ? (
                <>
                  <Badge size="2">
                    <Flex gap="2" align="center">
                      <Heading size="2"> Prior Type:</Heading>
                      <Text>{(experiment.config.design_spec as MABExperimentSpecOutput).prior_type}</Text>
                    </Flex>
                  </Badge>
                  <Badge size="2">
                    <Flex gap="2" align="center">
                      <Heading size="2">Reward Type:</Heading>
                      <Text>{(experiment.config.design_spec as MABExperimentSpecOutput).reward_type}</Text>
                    </Flex>
                  </Badge>
                  {cmabContextInputs.length > 0 && (
                    <ContextConfigBox
                      analysisKey={selectedAnalysisState.key}
                      contexts={(experiment.config.design_spec as CMABExperimentSpecOutput).contexts || []}
                      contextValues={cmabContextInputs}
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
                        <Select.Root size="1" value={activeAnalysisKey} onValueChange={handleSelectAnalysis}>
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
              {!isFrequentistExperiment && (
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
                {showLoadingAnalysisSpinner && (
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
                        effectSizes={activeMetricEffectSizes}
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
