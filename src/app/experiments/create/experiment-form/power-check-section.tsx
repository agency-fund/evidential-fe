'use client';

import {
  Button,
  Callout,
  Card,
  DataList,
  Flex,
  Grid,
  Heading,
  Spinner,
  Switch,
  Table,
  Text,
  TextField,
  Tooltip,
} from '@radix-ui/themes';
import {
  PowerCheckResponseChange,
  PowerCheckSampleOptionChange,
  PowerCheckSampleSizeSelector,
} from './power-check-sample-size-selector';
import { CheckCircledIcon, CrossCircledIcon, ExclamationTriangleIcon, LightningBoltIcon } from '@radix-ui/react-icons';
import { ExperimentFormData, isClusteredExperimentFormData, PowerCheckOption } from './experiment-form-types';
import { usePowerCheck } from '@/api/admin';
import {
  AnyFrequentistDesignSpec,
  PowerResponse,
  PreassignedFrequentistExperimentSpecExperimentType,
} from '@/api/methods.schemas';
import {
  convertToFrequentistDesignSpec,
  toPowerRequest,
  getClusterStatsFromPowerCheckResponse,
  powerCurveSizes,
  withEchoedBaselineStats,
} from './experiment-form-helpers';
import { getAssignableN, getPowerAnalysis, metricHasMissingValues } from '@/services/experiment-utils';
import { MetricSampleSizeDisplay } from '@/components/features/experiments/metric-sample-size-display';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { InfoBadge } from '@/components/ui/info-badge';
import { ZodError } from 'zod';
import { useState } from 'react';
import { SectionCard } from '@/components/ui/cards/section-card';
import { ClusterStatisticsSection, ClusterStatisticsSectionAction } from './cluster-statistics-section';
import { PowerCurveChart } from './power-curve-chart';

export type PowerCheckSectionAction =
  | { type: 'set-confidence'; value: string }
  | { type: 'set-power'; value: string }
  | { type: 'set-one-time-metric'; enabled: boolean }
  | ({ type: 'set-chosen-n' } & PowerCheckSampleOptionChange)
  | ({ type: 'set-power-check-response' } & PowerCheckResponseChange)
  | {
      type: 'set-power-curve-response';
      response: PowerResponse | undefined;
      designSpec: AnyFrequentistDesignSpec;
    };

interface PowerCheckSectionProps {
  data: ExperimentFormData;
  dispatch: (action: PowerCheckSectionAction | ClusterStatisticsSectionAction) => void;
}

const availableSampleSufficientBadge = (
  <InfoBadge
    label="Sufficient"
    color="green"
    tooltip="There are enough participants available to sample to detect this metric's target MDE."
  />
);

const availableSampleInsufficientBadge = (
  <InfoBadge
    label="Insufficient"
    color="red"
    tooltip="There are not enough participants available to sample to detect this metric's target MDE."
  />
);

const isPowerCheckButtonEnabled = (isMutating: boolean, data: ExperimentFormData) => {
  const reasons = [];
  if (isMutating) {
    reasons.push('Running power check');
  }
  if (data.primaryKey === undefined) {
    reasons.push('Please select a unique ID field.');
  }
  if (data.primaryMetric === undefined) {
    reasons.push('Please select a primary metric.');
  }
  return { enabled: !reasons.length, reason: reasons.join('\n') };
};

interface PowerCheckButtonProps {
  enabled: boolean;
  onClick: () => Promise<void>;
  loading: boolean;
  disabledReason?: string;
}

function RunPowerCheckButton({ enabled, onClick, loading, disabledReason }: PowerCheckButtonProps) {
  const button = (
    <Button type="button" disabled={!enabled} onClick={onClick} style={{ minWidth: '25%' }}>
      <Spinner loading={loading}>
        <LightningBoltIcon />
      </Spinner>
      Estimate Sample Size
    </Button>
  );

  const tooltipContent = !enabled
    ? disabledReason
    : "Calculates the minimum number of participants needed to be able to detect your primary metric's minimum effect.";

  return (
    <Tooltip content={tooltipContent} side="top" align="center">
      {button}
    </Tooltip>
  );
}

export function PowerCheckSection({ data, dispatch }: PowerCheckSectionProps) {
  const [validationError, setValidationError] = useState<ZodError | null>(null);
  const [validationErrorMessage, setValidationErrorMessage] = useState<string | null>(null);
  const {
    trigger: triggerEstimateSampleSize,
    isMutating: isEstimatingSampleSize,
    error,
  } = usePowerCheck(data.datasourceId!);
  const { trigger: triggerPowerCurve, isMutating: isFetchingPowerCurve } = usePowerCheck(data.datasourceId!, {
    swr: { swrKey: `${data.datasourceId}/power/curve` },
  });
  const { enabled, reason } = isPowerCheckButtonEnabled(isEstimatingSampleSize, data);

  /**
   * One-time mode changes the power check itself: the backend checks sufficiency, and solves for the MDE, against
   * only the participants with no value for the metric. So store the choice and re-run the check with it. If the
   * re-run fails, flip the switch back so it matches the response still on screen.
   */
  const handleOneTimeMetricChange = async (enabled: boolean) => {
    dispatch({ type: 'set-one-time-metric', enabled });
    const succeeded = await handlePowerCheck({ ...data, useOneTimeMetric: enabled });
    if (!succeeded) {
      dispatch({ type: 'set-one-time-metric', enabled: !enabled });
    }
  };

  /**
   * Fires the follow-up MDE-curve request for a just-received power check response. Best-effort:
   * the response's stats are echoed back so the server computes every point without re-querying
   * the data warehouse. Keep the previous curve until its replacement arrives, and clear it if the request fails.
   *
   * `formData` is the form as it will be once the response is stored; see handlePowerCheck.
   */
  const fetchPowerCurve = async (response: PowerResponse, formData: ExperimentFormData) => {
    if (!formData.primaryMetric) {
      return;
    }
    const primary = getPowerAnalysis(response, formData.primaryMetric.metric.field_name);
    if (!primary) {
      return;
    }
    // Build the spec as the form will look after the reducer stores this response: for cluster
    // designs that back-fills the derived cluster stats, and the reducer's staleness check for
    // the curve response compares against exactly that. Without this, the cluster back-fill
    // would make the curve response look stale and it would be dropped.
    const clusterStats = getClusterStatsFromPowerCheckResponse(formData, response);
    let designSpec: AnyFrequentistDesignSpec;
    try {
      designSpec = convertToFrequentistDesignSpec({
        ...formData,
        ...clusterStats,
        useOneTimeMetric: primary.metric_spec.use_one_time_metric === true,
        desiredN: undefined,
        desiredNClusters: undefined,
      });
    } catch {
      // The curve is enrichment: a spec that no longer converts just means no chart.
      return;
    }
    const setCurveResponse = (response: PowerResponse | undefined) => {
      dispatch({ type: 'set-power-curve-response', response, designSpec });
    };
    // One-time mode can only assign the rows with no value, so the curve stops at that count. The backend
    // reports an error for any size past it.
    const availableN = getAssignableN(primary) ?? 0;
    const avgClusterSize = primary.metric_spec.avg_cluster_size ?? 0;
    const echoedSpec = withEchoedBaselineStats(designSpec, response);

    let curveSpec: AnyFrequentistDesignSpec;
    if (
      isClusteredExperimentFormData(formData) &&
      avgClusterSize > 0 &&
      echoedSpec.experiment_type === PreassignedFrequentistExperimentSpecExperimentType.freq_preassigned
    ) {
      const maxClusters = Math.floor(availableN / avgClusterSize);
      const sizes = powerCurveSizes(primary.num_clusters_total ?? undefined, maxClusters);
      if (!sizes.length) {
        setCurveResponse(undefined);
        return;
      }
      curveSpec = { ...echoedSpec, desired_ns_clusters: sizes };
    } else {
      const sizes = powerCurveSizes(primary.target_n ?? undefined, availableN);
      if (!sizes.length) {
        setCurveResponse(undefined);
        return;
      }
      curveSpec = { ...echoedSpec, desired_ns: sizes };
    }

    try {
      const curveResponse = await triggerPowerCurve(toPowerRequest(curveSpec));
      // SWR returns undefined for a superseded request; let its replacement manage the displayed curve.
      if (curveResponse) {
        setCurveResponse(curveResponse);
      }
    } catch {
      setCurveResponse(undefined);
    }
  };

  /**
   * Runs the power check. `formData` defaults to the current form; the one-time switch passes the form with its new
   * value, since `data` won't reflect the dispatch until the next render. Resolves to whether a response was stored.
   */
  const handlePowerCheck = async (formData: ExperimentFormData = data): Promise<boolean> => {
    setValidationError(null);
    setValidationErrorMessage(null);

    if (!formData.tableName || !formData.primaryKey || !formData.primaryMetric) {
      return false;
    }

    try {
      // We always estimate the minimum sample size with this handler, so clear out selected sample size fields.
      const designSpec = convertToFrequentistDesignSpec({
        ...formData,
        desiredN: undefined,
        desiredNClusters: undefined,
      });
      const response = await triggerEstimateSampleSize(toPowerRequest(designSpec));

      const primary = getPowerAnalysis(response, formData.primaryMetric.metric.field_name);
      const desiredN = primary?.sufficient_n ? (primary.target_n ?? undefined) : undefined;
      const sampleSizeOption = desiredN === undefined ? PowerCheckOption.NONE : PowerCheckOption.USE_POWER_CHECK;
      dispatch({
        type: 'set-power-check-response',
        response,
        desiredN,
        desiredNClusters: isClusteredExperimentFormData(formData)
          ? (primary?.num_clusters_total ?? undefined)
          : undefined,
        sampleSizeOption,
        designSpec,
      });
      void fetchPowerCurve(response, formData);
      return true;
    } catch (err) {
      if (err instanceof ZodError) {
        setValidationError(err);
        return false;
      }
      if (err instanceof Error) {
        setValidationErrorMessage(err.message);
        return false;
      }
      throw err;
    }
  };

  const handleEstimatedMDEChange = ({
    sampleSizeOption,
    desiredN,
    desiredNClusters,
    response,
    designSpec,
  }: PowerCheckResponseChange) => {
    dispatch({ type: 'set-power-check-response', sampleSizeOption, desiredN, desiredNClusters, response, designSpec });
  };

  const handleSampleOptionChange = ({
    sampleSizeOption,
    desiredN,
    desiredNClusters,
    response,
  }: PowerCheckSampleOptionChange) => {
    dispatch({ type: 'set-chosen-n', sampleSizeOption, desiredN, desiredNClusters, response });
  };

  const primaryMetricFieldName = data.primaryMetric?.metric.field_name ?? '';
  const isClustered = isClusteredExperimentFormData(data);
  // A failed refresh doesn't invalidate the last successful analysis; design edits clear it in the reducer.
  const primaryPower = getPowerAnalysis(data.powerCheckResponse, primaryMetricFieldName);
  const restPowerAnalyses = data.powerCheckResponse?.analyses.filter(
    (a) => a.metric_spec.field_name !== primaryMetricFieldName,
  );
  const restPower = restPowerAnalyses !== undefined && restPowerAnalyses.length > 0 ? restPowerAnalyses : undefined;
  const primaryPowerClusterSizeCv = primaryPower?.msg?.values?.cluster_size_cv ?? primaryPower?.metric_spec.cv;
  const primaryHasMissingValues = primaryPower != null && metricHasMissingValues(primaryPower);
  const secondaryHasMissingValues = (restPower ?? []).some(metricHasMissingValues);
  const metricsWithMissingValues = [
    ...(primaryPower != null && primaryHasMissingValues ? [`${primaryPower.metric_spec.field_name} (primary)`] : []),
    ...(restPower ?? []).filter(metricHasMissingValues).map((analysis) => analysis.metric_spec.field_name),
  ];

  // Power curve chart inputs, all in the chart's x unit (clusters for cluster designs).
  const curveAnalysis = getPowerAnalysis(data.powerCurveResponse, primaryMetricFieldName);
  // The one-time banner follows the latest sample-size response, independently of the curve being refreshed.
  const oneTimeAvailableN = primaryPower?.metric_spec.use_one_time_metric ? getAssignableN(primaryPower) : undefined;
  // While the replacement is loading, keep reference markers tied to the curve still on screen.
  const curveAvailableN = getAssignableN(curveAnalysis);
  const curveAvgClusterSize = curveAnalysis?.metric_spec.avg_cluster_size ?? undefined;
  const curveAvailableSize = isClustered
    ? curveAvailableN !== undefined && curveAvgClusterSize
      ? Math.floor(curveAvailableN / curveAvgClusterSize)
      : undefined
    : curveAvailableN;
  const curveMinSize = isClustered
    ? (curveAnalysis?.num_clusters_total ?? undefined)
    : (curveAnalysis?.target_n ?? undefined);
  const curveMatchesOneTimeMode =
    (curveAnalysis?.metric_spec.use_one_time_metric === true) ===
    (primaryPower?.metric_spec.use_one_time_metric === true);
  const targetMdePct = data.primaryMetric?.mde !== undefined ? Number(data.primaryMetric.mde) : undefined;
  const mdeAnalysisForDot = getPowerAnalysis(data.mdePowerCheckResponse, primaryMetricFieldName);
  const selectedMdePct =
    data.sampleSizeOption === PowerCheckOption.USE_POWER_CHECK
      ? targetMdePct
      : mdeAnalysisForDot?.pct_change_with_desired_n != null
        ? // Magnitude: binary metrics may report the detectable change with a negative sign.
          Math.abs(mdeAnalysisForDot.pct_change_with_desired_n) * 100
        : undefined;
  const selectedSize = isClustered ? data.desiredNClusters : data.desiredN;

  return (
    <Flex direction="column" gap={'3'}>
      <Flex direction="row" gap="4">
        <Flex direction="column" gap="1" flexGrow="1">
          <Text as="label" size="2" weight="medium">
            Confidence (%)
          </Text>
          <TextField.Root
            type="number"
            min={50}
            max={99}
            value={data.confidence ?? '95'}
            onChange={(e) => dispatch({ type: 'set-confidence', value: e.target.value })}
            placeholder="95"
          />
        </Flex>
        <Flex direction="column" gap="1" flexGrow="1">
          <Text as="label" size="2" weight="medium">
            Power (%)
          </Text>
          <TextField.Root
            type="number"
            min={50}
            max={99}
            value={data.power ?? '80'}
            onChange={(e) => dispatch({ type: 'set-power', value: e.target.value })}
            placeholder="80"
          />
        </Flex>
      </Flex>

      {data.clusterKey && (
        <SectionCard title="Cluster Statistics">
          <ClusterStatisticsSection data={data} dispatch={dispatch} />
        </SectionCard>
      )}

      <SectionCard title="Analysis">
        <Flex direction="column" gap="3" align="center">
          <RunPowerCheckButton
            enabled={enabled}
            onClick={async () => {
              await handlePowerCheck();
            }}
            loading={isEstimatingSampleSize}
            disabledReason={reason}
          />

          {error && (
            <Flex align="center" gap="2">
              <GenericErrorCallout title={'Power check failed'} error={error} />
            </Flex>
          )}

          {validationError && (
            <Flex align="center" gap="2">
              <GenericErrorCallout
                title={'Validation failed'}
                message={validationError.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n')}
              />
            </Flex>
          )}

          {validationErrorMessage && (
            <Flex align="center" gap="2">
              <GenericErrorCallout title={'Validation failed'} message={validationErrorMessage} />
            </Flex>
          )}

          {primaryPower && (
            <Callout.Root color={primaryPower.sufficient_n ? 'green' : 'red'}>
              <Callout.Icon>{primaryPower.sufficient_n ? <CheckCircledIcon /> : <CrossCircledIcon />}</Callout.Icon>
              <Flex direction="column" gap="2">
                <Callout.Text>
                  {primaryPower.msg?.msg ||
                    (primaryPower.sufficient_n
                      ? 'The experiment has sufficient power.'
                      : 'The experiment does not have sufficient power.')}
                </Callout.Text>
                {primaryPower.msg?.high_cluster_variation && primaryPowerClusterSizeCv != null && (
                  <Callout.Root color="amber" variant="surface" size="1">
                    <Callout.Icon>
                      <ExclamationTriangleIcon />
                    </Callout.Icon>
                    <Callout.Text>
                      Because your cluster sizes vary so widely, your experiment is sensitive to enrolling fewer
                      participants or clusters. Consider adding filters to exclude extreme cluster sizes or adding more
                      clusters to be safer.
                    </Callout.Text>
                  </Callout.Root>
                )}
                {metricsWithMissingValues.length > 0 ? (
                  <Callout.Root color="amber" variant="surface" size="1">
                    <Callout.Icon>
                      <ExclamationTriangleIcon />
                    </Callout.Icon>
                    <Callout.Text>
                      Some participants are missing a value for: {metricsWithMissingValues.join(', ')}. Estimates assume
                      that these participants will receive a value during the experiment. If you&apos;re unsure, add a
                      filter to exclude these participants.
                    </Callout.Text>
                  </Callout.Root>
                ) : null}
              </Flex>
            </Callout.Root>
          )}

          <Grid rows={'1'} columns={restPower ? '2' : '1'} gap={'3'}>
            {primaryPower && (
              <>
                <Card>
                  <Flex direction="column" gap={'3'}>
                    <Heading size={'3'}>Primary Metric: {primaryPower.metric_spec.field_name}</Heading>
                    <DataList.Root>
                      <DataList.Item>
                        <DataList.Label>Status</DataList.Label>
                        <DataList.Value>
                          {primaryPower.sufficient_n
                            ? availableSampleSufficientBadge
                            : availableSampleInsufficientBadge}
                        </DataList.Value>
                      </DataList.Item>
                      <DataList.Item>
                        <DataList.Label>Required</DataList.Label>
                        <DataList.Value>
                          <MetricSampleSizeDisplay
                            analysis={primaryPower}
                            isClustered={isClustered}
                            variant="required"
                          />
                        </DataList.Value>
                      </DataList.Item>
                      <DataList.Item>
                        <DataList.Label>{primaryHasMissingValues ? 'All available' : 'Available'}</DataList.Label>
                        <DataList.Value>
                          <MetricSampleSizeDisplay
                            analysis={primaryPower}
                            isClustered={isClustered}
                            variant="available"
                          />
                        </DataList.Value>
                      </DataList.Item>
                      {primaryHasMissingValues ? (
                        <DataList.Item>
                          <DataList.Label>Available with values</DataList.Label>
                          <DataList.Value>
                            <MetricSampleSizeDisplay
                              analysis={primaryPower}
                              isClustered={isClustered}
                              variant="available-nonnull"
                            />
                          </DataList.Value>
                        </DataList.Item>
                      ) : null}
                      {primaryPower.metric_spec.use_one_time_metric ? (
                        // One-time mode can only assign these, so this is the number to compare with Required.
                        <DataList.Item>
                          <DataList.Label>Available without values</DataList.Label>
                          <DataList.Value>
                            <MetricSampleSizeDisplay
                              analysis={primaryPower}
                              isClustered={isClustered}
                              variant="assignable"
                            />
                          </DataList.Value>
                        </DataList.Item>
                      ) : null}
                      {/* The backend decides eligibility; we only show the switch when it says yes. */}
                      {primaryPower.metric_spec.is_one_time_eligible ? (
                        <DataList.Item>
                          <DataList.Label>One-time metric</DataList.Label>
                          <DataList.Value>
                            <Text as="label" size="2">
                              <Flex gap="2" align="center">
                                <Switch
                                  size="1"
                                  checked={data.useOneTimeMetric ?? false}
                                  disabled={isEstimatingSampleSize}
                                  onCheckedChange={(enabled) => void handleOneTimeMetricChange(enabled)}
                                />
                                Assign only participants without a value
                              </Flex>
                            </Text>
                          </DataList.Value>
                        </DataList.Item>
                      ) : null}
                      {primaryPower.pct_change_possible !== null && primaryPower.pct_change_possible !== undefined && (
                        <DataList.Item>
                          <DataList.Label>MDE</DataList.Label>
                          <DataList.Value>{(primaryPower.pct_change_possible * 100).toFixed(4)}%</DataList.Value>
                        </DataList.Item>
                      )}
                    </DataList.Root>
                  </Flex>
                </Card>
              </>
            )}
            {restPower ? (
              <Card key={'secondary'}>
                <Flex direction="column" gap={'3'}>
                  <Heading size={'3'}>Secondary Metrics</Heading>
                  <Table.Root>
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeaderCell>Metric</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Required</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>
                          {secondaryHasMissingValues ? 'All available' : 'Available'}
                        </Table.ColumnHeaderCell>
                        {secondaryHasMissingValues ? (
                          <Table.ColumnHeaderCell>Available with values</Table.ColumnHeaderCell>
                        ) : null}
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {restPower.map((metricAnalysis, i) => (
                        <Table.Row key={`rest${i}`}>
                          <Table.Cell>{metricAnalysis.metric_spec.field_name}</Table.Cell>
                          <Table.Cell>
                            {metricAnalysis.sufficient_n
                              ? availableSampleSufficientBadge
                              : availableSampleInsufficientBadge}
                          </Table.Cell>
                          <Table.Cell align={'right'}>
                            <MetricSampleSizeDisplay
                              analysis={metricAnalysis}
                              isClustered={isClustered}
                              variant="required"
                            />
                          </Table.Cell>
                          <Table.Cell align={'right'}>
                            <MetricSampleSizeDisplay
                              analysis={metricAnalysis}
                              isClustered={isClustered}
                              variant="available"
                            />
                          </Table.Cell>
                          {secondaryHasMissingValues ? (
                            <Table.Cell align={'right'}>
                              <MetricSampleSizeDisplay
                                analysis={metricAnalysis}
                                isClustered={isClustered}
                                variant="available-nonnull"
                              />
                            </Table.Cell>
                          ) : null}
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Flex>
              </Card>
            ) : null}
          </Grid>
        </Flex>
      </SectionCard>

      {data.powerCheckResponse !== undefined && (
        <SectionCard
          headerLeft={
            <Flex align="center" gap="2">
              <Heading size="3">Select Target Sample Size</Heading>
              <Spinner
                loading={isEstimatingSampleSize || isFetchingPowerCurve}
                aria-label="Updating sample size analysis"
              />
            </Flex>
          }
        >
          <Flex direction="column" gap="3" align="start" width="100%">
            {curveAnalysis ? (
              <PowerCurveChart
                curveAnalysis={curveAnalysis}
                isClustered={isClustered}
                minSize={curveMinSize}
                availableSize={curveAvailableSize}
                targetMdePct={targetMdePct}
                selectedSize={curveMatchesOneTimeMode ? selectedSize : undefined}
                selectedMdePct={curveMatchesOneTimeMode ? selectedMdePct : undefined}
              />
            ) : null}
            <Text>Choose the total number of participants to distribute across all arms:</Text>
            <Flex direction="column" gap="2" align="center" width="100%">
              {!data.powerCheckResponse.analyses.map((a) => a.sufficient_n).every((sufficient) => sufficient) && (
                <Callout.Root color="orange">
                  <Callout.Icon>
                    <CrossCircledIcon />
                  </Callout.Icon>
                  <Callout.Text>
                    {oneTimeAvailableN !== undefined ? (
                      <>
                        Only {oneTimeAvailableN.toLocaleString()} participants have no value for the primary metric,
                        which is not enough for one or more metrics. You can still proceed with a custom sample size of
                        up to {oneTimeAvailableN.toLocaleString()}, or turn off one-time mode to include all
                        participants.
                      </>
                    ) : (
                      <>
                        You don&apos;t have a sufficient sample size for one or more metrics. You can still proceed with
                        a custom sample size, but consider adjusting your experiment design.
                      </>
                    )}
                  </Callout.Text>
                </Callout.Root>
              )}
              <PowerCheckSampleSizeSelector
                datasourceId={data.datasourceId!}
                isClustered={isClustered}
                powerCheckResponse={data.powerCheckResponse}
                primaryMetricFieldName={primaryMetricFieldName}
                targetMde={data.primaryMetric?.mde}
                selectedSampleOption={data.sampleSizeOption ?? PowerCheckOption.USE_POWER_CHECK}
                desiredN={data.desiredN}
                desiredNClusters={data.desiredNClusters}
                mdePowerCheckResponse={data.mdePowerCheckResponse}
                makeDesignSpec={(desiredN, desiredNClusters) => {
                  const spec = convertToFrequentistDesignSpec({ ...data, desiredN, desiredNClusters });
                  // Echo the stats from the current power check so the server skips the dwh. Any
                  // design edit wipes powerCheckResponse, so a present response matches the design.
                  return data.powerCheckResponse !== undefined
                    ? withEchoedBaselineStats(spec, data.powerCheckResponse)
                    : spec;
                }}
                onOptionChange={handleSampleOptionChange}
                onEstimatedMDEChange={handleEstimatedMDEChange}
                disabled={isEstimatingSampleSize}
              />
            </Flex>
          </Flex>
        </SectionCard>
      )}
    </Flex>
  );
}
