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
  getSampleSizeLandmarks,
  PowerCheckResponseChange,
  PowerCheckSampleOptionChange,
  PowerCheckSampleSizeSelector,
} from './power-check-sample-size-selector';
import {
  CheckCircledIcon,
  CrossCircledIcon,
  ExclamationTriangleIcon,
  InfoCircledIcon,
  LightningBoltIcon,
} from '@radix-ui/react-icons';
import { ExperimentFormData, isClusteredExperimentFormData, PowerCheckOption } from './experiment-form-types';
import { usePowerCheck } from '@/api/admin';
import {
  AnyFrequentistDesignSpec,
  MetricPowerAnalysis,
  PowerRequest,
  PowerResponse,
  PreassignedFrequentistExperimentSpecExperimentType,
} from '@/api/methods.schemas';
import {
  convertToFrequentistDesignSpec,
  describeDesignSpecError,
  describeOneTimeMetricRejection,
  isOneTimeMetricRejection,
  toPowerRequest,
  getClusterStatsFromPowerCheckResponse,
  powerCurveSizes,
  withEchoedBaselineStats,
} from './experiment-form-helpers';
import {
  getAssignableN,
  getPowerAnalysis,
  isPowerAnalysisForOtherOneTimeMode,
  metricHasMissingValues,
  metricHasNoObservedOutcomes,
} from '@/services/experiment-utils';
import {
  MetricSampleSizeDisplay,
  estimateParticipantNFromClusters,
} from '@/components/features/experiments/metric-sample-size-display';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { InfoBadge } from '@/components/ui/info-badge';
import { useState } from 'react';
import { SectionCard } from '@/components/ui/cards/section-card';
import { ClusterStatisticsSection, ClusterStatisticsSectionAction } from './cluster-statistics-section';
import { PowerCurveChart } from './power-curve-chart';

/** How a power check run ended: a response was stored, the backend refused one-time metric, or anything else failed. */
type PowerCheckOutcome = 'stored' | 'one-time-rejected' | 'failed';

export type PowerCheckSectionAction =
  | { type: 'set-confidence'; value: string }
  | { type: 'set-power'; value: string }
  | { type: 'set-one-time-metric'; enabled: boolean }
  | { type: 'restore-one-time-metric' }
  | { type: 'one-time-metric-rejected' }
  | ({ type: 'set-chosen-n' } & PowerCheckSampleOptionChange)
  | ({ type: 'set-power-check-response' } & PowerCheckResponseChange)
  | { type: 'set-power-curve-response'; response: PowerResponse; designSpec: AnyFrequentistDesignSpec };

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

const waitingForOutcomesBadge = (
  <InfoBadge
    label="Waiting for outcomes"
    color="gray"
    tooltip="Participants can enroll now. Power and sample size estimates need observed outcomes."
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
  const clusterStats = [data.clusterIcc, data.clusterCv, data.clusterAvgClusterSize];
  const enteredClusterStatCount = clusterStats.filter((stat) => stat !== undefined).length;
  if (data.clusterKey && enteredClusterStatCount > 0 && enteredClusterStatCount < clusterStats.length) {
    reasons.push('Please set all three cluster statistics, or reset them.');
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
  const [validationError, setValidationError] = useState<string | null>(null);
  const [mdeValidationError, setMdeValidationError] = useState<string | null>(null);
  // Why the backend refused one-time metric and it was turned off; null when there's nothing to explain.
  const [oneTimeRejection, setOneTimeRejection] = useState<string | null>(null);
  const {
    trigger: triggerEstimateSampleSize,
    isMutating,
    error,
    reset: clearRequestError,
  } = usePowerCheck(data.datasourceId!);
  const { trigger: triggerPowerCurve, isMutating: isPowerCurveMutating } = usePowerCheck(data.datasourceId!, {
    swr: { swrKey: `${data.datasourceId}/power/curve` },
  });
  const {
    trigger: triggerEstimateMde,
    isMutating: isEstimatingMde,
    error: mdeEstimateError,
    reset: clearMdeRequestError,
  } = usePowerCheck(data.datasourceId!, {
    swr: { swrKey: `${data.datasourceId}/power/mde-estimate` },
  });
  const { enabled, reason } = isPowerCheckButtonEnabled(isMutating, data);

  /**
   * One-time metric changes the power check itself: the backend checks sufficiency, and solves for the MDE, against
   * only the participants with no value for the metric. So store the choice and re-run the check with it. If the
   * re-run fails, put the switch back to match the response still on screen. The reducer does that from the form as
   * it is when the failure arrives, so an edit made in the meantime (like a filter change turning it off) wins.
   */
  const handleOneTimeMetricChange = async (enabled: boolean) => {
    dispatch({ type: 'set-one-time-metric', enabled });
    const outcome = await handlePowerCheck({ ...data, useOneTimeMetric: enabled });
    if (outcome === 'one-time-rejected') {
      dispatch({ type: 'one-time-metric-rejected' });
    } else if (outcome === 'failed') {
      dispatch({ type: 'restore-one-time-metric' });
    }
  };

  /** The Run button. If the backend refuses one-time metric, turn it off so the next run can succeed. */
  const handleRunPowerCheck = async () => {
    const outcome = await handlePowerCheck();
    if (outcome === 'one-time-rejected') {
      dispatch({ type: 'one-time-metric-rejected' });
    }
  };

  /**
   * Fires the follow-up MDE-curve request for a just-received power check response. Best-effort:
   * the response's stats are echoed back so the server computes every point without re-querying
   * the data warehouse, and any failure just leaves the chart unrendered.
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
    // would make the curve response look stale and it would be dropped. Likewise the reducer sets
    // the one-time switch to what the response used, which the backend may have turned off.
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
    const avgClusterSize = primary.metric_spec.avg_cluster_size ?? 0;
    const echoedSpec = withEchoedBaselineStats(designSpec, response);

    let curveSpec: AnyFrequentistDesignSpec;
    if (
      isClusteredExperimentFormData(formData) &&
      avgClusterSize > 0 &&
      echoedSpec.experiment_type === PreassignedFrequentistExperimentSpecExperimentType.freq_preassigned
    ) {
      const maxClusters = primary.metric_spec.available_n_clusters ?? 0;
      const sizes = powerCurveSizes(primary.num_clusters_total ?? undefined, maxClusters);
      if (!sizes.length) {
        return;
      }
      curveSpec = { ...echoedSpec, desired_ns_clusters: sizes };
    } else {
      // One-time metric can only assign the rows with no value, so the curve stops at that count. The backend
      // reports an error for any size past it.
      const maxN = getAssignableN(primary) ?? 0;
      const sizes = powerCurveSizes(primary.target_n ?? undefined, maxN);
      if (!sizes.length) {
        return;
      }
      curveSpec = { ...echoedSpec, desired_ns: sizes };
    }

    const curveResponse = await triggerPowerCurve(toPowerRequest(curveSpec), { throwOnError: false });
    if (!curveResponse) {
      return;
    }
    dispatch({ type: 'set-power-curve-response', response: curveResponse, designSpec });
  };

  /**
   * Runs the power check. `formData` defaults to the current form; the one-time switch passes the form with its new
   * value, since `data` won't reflect the dispatch until the next render.
   *
   * It never changes the one-time switch itself; callers decide what to do with the outcome. When the backend refuses
   * one-time metric, the generic request error is replaced by an explanation of why.
   */
  const handlePowerCheck = async (formData: ExperimentFormData = data): Promise<PowerCheckOutcome> => {
    setValidationError(null);
    setOneTimeRejection(null);
    clearRequestError();

    if (!formData.tableName || !formData.primaryKey || !formData.primaryMetric) {
      return 'failed';
    }

    let designSpec: AnyFrequentistDesignSpec;
    let powerRequest: PowerRequest;
    try {
      // We always estimate the minimum sample size with this handler, so clear out selected sample size fields.
      designSpec = convertToFrequentistDesignSpec({
        ...formData,
        desiredN: undefined,
        desiredNClusters: undefined,
      });
      powerRequest = toPowerRequest(designSpec);
    } catch (err) {
      setValidationError(describeDesignSpecError(err));
      return 'failed';
    }

    let response: PowerResponse | undefined;
    try {
      response = await triggerEstimateSampleSize(powerRequest);
    } catch (requestError) {
      if (formData.useOneTimeMetric && isOneTimeMetricRejection(requestError)) {
        clearRequestError();
        setOneTimeRejection(describeOneTimeMetricRejection(formData));
        return 'one-time-rejected';
      }
      return 'failed';
    }
    if (!response) {
      return 'failed';
    }
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
    return 'stored';
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
  const hasValidationError = validationError !== null;
  const primaryPower =
    data.powerCheckResponse !== undefined && !hasValidationError
      ? getPowerAnalysis(data.powerCheckResponse, primaryMetricFieldName)
      : undefined;
  const restPowerAnalyses =
    data.powerCheckResponse !== undefined && !hasValidationError
      ? data.powerCheckResponse.analyses.filter((a) => a.metric_spec.field_name !== primaryMetricFieldName)
      : undefined;
  const restPower = restPowerAnalyses !== undefined && restPowerAnalyses.length > 0 ? restPowerAnalyses : undefined;
  const primaryPowerClusterSizeCv = primaryPower?.msg?.values?.cluster_size_cv ?? primaryPower?.metric_spec.cv;
  const primaryHasMissingValues = primaryPower != null && metricHasMissingValues(primaryPower);
  const secondaryHasMissingValues = (restPower ?? []).some(metricHasMissingValues);
  const primaryWaitingForOutcomes = primaryPower != null && metricHasNoObservedOutcomes(primaryPower);
  const analyses = [...(primaryPower ? [primaryPower] : []), ...(restPower ?? [])];
  const metricsWaitingForOutcomes = analyses
    .filter(metricHasNoObservedOutcomes)
    .map((analysis) => analysis.metric_spec.field_name);
  const metricsWithMissingValues = analyses
    .filter((analysis) => metricHasMissingValues(analysis) && !metricHasNoObservedOutcomes(analysis))
    .map((analysis) =>
      analysis.metric_spec.field_name === primaryMetricFieldName
        ? `${analysis.metric_spec.field_name} (primary)`
        : analysis.metric_spec.field_name,
    );
  const hasInsufficientSample = analyses.some(
    (analysis) => !analysis.sufficient_n && !metricHasNoObservedOutcomes(analysis),
  );
  const getSampleStatusBadge = (analysis: MetricPowerAnalysis) =>
    metricHasNoObservedOutcomes(analysis)
      ? waitingForOutcomesBadge
      : analysis.sufficient_n
        ? availableSampleSufficientBadge
        : availableSampleInsufficientBadge;

  const { targetN, targetNClusters, allSamples, avgClusterSize, maxClusters, isMinOptionDisabled } =
    getSampleSizeLandmarks(primaryPower);
  const selectedSampleOption = data.sampleSizeOption ?? PowerCheckOption.USE_POWER_CHECK;

  const responseUsesOneTimeMetric = primaryPower?.metric_spec.use_one_time_metric === true;
  const isPowerCheckForOtherOneTimeMode = isPowerAnalysisForOtherOneTimeMode(primaryPower, data.useOneTimeMetric);
  const isTargetSampleSizeLoading = isMutating || isPowerCurveMutating;

  // Power curve chart inputs, all in the chart's x unit (clusters for cluster designs).
  const curveAnalysis =
    data.powerCurveResponse !== undefined && !hasValidationError && !isPowerCheckForOtherOneTimeMode
      ? getPowerAnalysis(data.powerCurveResponse, primaryMetricFieldName)
      : undefined;
  // The chart's "available" marker. In one-time mode only participants with no value for the primary metric can be
  // assigned, so it stops at that count, matching the sizes fetchPowerCurve requests.
  const primaryAvailableN = getAssignableN(primaryPower);
  const availableWithoutValuesN =
    primaryPower?.metric_spec.available_n != null && primaryPower?.metric_spec.available_nonnull_n != null
      ? primaryPower.metric_spec.available_n - primaryPower.metric_spec.available_nonnull_n
      : undefined;
  // One-time metric isn't supported for cluster designs, so the cluster count is the backend's available_n_clusters.
  const curveAvailableSize = isClustered ? maxClusters : primaryAvailableN;
  const curveMinSize = isClustered ? targetNClusters : targetN;
  const targetMdePct = data.primaryMetric?.mde !== undefined ? Number(data.primaryMetric.mde) : undefined;
  const mdeAnalysisForDot = !isPowerCheckForOtherOneTimeMode
    ? getPowerAnalysis(data.mdePowerCheckResponse, primaryMetricFieldName)
    : undefined;
  const selectedMdePct =
    data.sampleSizeOption === PowerCheckOption.USE_POWER_CHECK
      ? targetMdePct
      : mdeAnalysisForDot?.pct_change_with_desired_n != null
        ? // Magnitude: binary metrics may report the detectable change with a negative sign.
          Math.abs(mdeAnalysisForDot.pct_change_with_desired_n) * 100
        : undefined;
  const selectedSize = isClustered ? data.desiredNClusters : data.desiredN;

  const makeDesignSpec = (desiredN: number, desiredNClusters?: number): AnyFrequentistDesignSpec => {
    const spec = convertToFrequentistDesignSpec({ ...data, desiredN, desiredNClusters });
    // Echo the stats from the current power check so the server skips the dwh. Any design edit
    // wipes powerCheckResponse, so a present response matches the design.
    return data.powerCheckResponse !== undefined ? withEchoedBaselineStats(spec, data.powerCheckResponse) : spec;
  };

  /**
   * Requests the MDE estimate for a chosen size. The response is dispatched even if stale: the
   * reducer compares its design spec against the current form and drops it if they differ.
   */
  const estimateMde = (sampleSizeOption: PowerCheckOption, desiredN: number, desiredNClusters?: number) => {
    setMdeValidationError(null);
    clearMdeRequestError();
    let designSpec: AnyFrequentistDesignSpec;
    let powerRequest: PowerRequest;
    try {
      designSpec = makeDesignSpec(desiredN, desiredNClusters);
      powerRequest = toPowerRequest(designSpec);
    } catch (err) {
      setMdeValidationError(describeDesignSpecError(err));
      return;
    }
    void (async () => {
      const response = await triggerEstimateMde(powerRequest, { throwOnError: false });
      if (!response) {
        return;
      }
      handleEstimatedMDEChange({ sampleSizeOption, desiredN, desiredNClusters, response, designSpec });
    })();
  };

  /**
   * Records a card pick immediately, with the sizes that card stands for and its MDE response
   * when already known (the power check's for the minimum, the last estimate when it was for
   * the same size); otherwise a new estimate is requested.
   */
  const handleOptionSelect = (option: PowerCheckOption) => {
    const lastEstimateMatches = (n: number | undefined, nClusters: number | undefined) =>
      data.mdePowerCheckResponse !== undefined &&
      data.desiredN === n &&
      (!isClustered || data.desiredNClusters === nClusters);
    switch (option) {
      case PowerCheckOption.NONE:
        handleSampleOptionChange({
          sampleSizeOption: option,
          desiredN: undefined,
          desiredNClusters: undefined,
          response: data.powerCheckResponse,
        });
        break;
      case PowerCheckOption.USE_POWER_CHECK:
        handleSampleOptionChange({
          sampleSizeOption: option,
          desiredN: targetN,
          desiredNClusters: isClustered ? targetNClusters : undefined,
          response: data.powerCheckResponse,
        });
        break;
      case PowerCheckOption.USE_ALL_NON_NULL_SAMPLES: {
        const useCachedResponse = lastEstimateMatches(allSamples, maxClusters);
        handleSampleOptionChange({
          sampleSizeOption: option,
          desiredN: allSamples,
          desiredNClusters: isClustered ? maxClusters : undefined,
          response: useCachedResponse ? data.mdePowerCheckResponse : undefined,
        });
        if (!useCachedResponse) {
          estimateMde(option, allSamples, isClustered ? maxClusters : undefined);
        }
        break;
      }
      case PowerCheckOption.ENTER_OWN: {
        // Switching away from ENTER_OWN either keeps desiredN at allSamples or changes it, so
        // switching back only ever reuses the all-samples estimate, never a stale custom one.
        const useCachedResponse = lastEstimateMatches(allSamples, maxClusters);
        handleSampleOptionChange({
          sampleSizeOption: option,
          desiredN: data.desiredN,
          desiredNClusters: isClustered ? data.desiredNClusters : undefined,
          response: useCachedResponse ? data.mdePowerCheckResponse : undefined,
        });
        if (!useCachedResponse && data.desiredN !== undefined) {
          estimateMde(option, data.desiredN, isClustered ? data.desiredNClusters : undefined);
        }
        break;
      }
    }
  };

  /** Makes a custom size the selection and requests its MDE estimate. */
  const selectCustomSize = (newN: number, newNClusters?: number) => {
    // Record the size right away, wiping the old response, which is now stale.
    handleSampleOptionChange({
      sampleSizeOption: PowerCheckOption.ENTER_OWN,
      desiredN: newN,
      desiredNClusters: newNClusters,
      response: undefined,
    });
    // But only estimate MDE for a valid value.
    if (newN > 1 || (newNClusters && newNClusters > 1)) {
      estimateMde(PowerCheckOption.ENTER_OWN, newN, newNClusters);
    }
  };

  const handleCustomSizeChange = (newN: number | undefined, newNClusters?: number) => {
    if (
      selectedSampleOption !== PowerCheckOption.ENTER_OWN ||
      (newN === data.desiredN && (!isClustered || newNClusters === data.desiredNClusters))
    ) {
      // User either switched selection or entered the same stored value, so nothing to change.
      return;
    }
    if (newN === undefined) {
      // Wipe the form data if the user entered an invalid newN.
      handleSampleOptionChange({
        sampleSizeOption: selectedSampleOption,
        desiredN: undefined,
        desiredNClusters: undefined,
        response: undefined,
      });
      return;
    }
    selectCustomSize(newN, newNClusters);
  };

  /**
   * A click on a curve point selects that size the way the cards would: the required minimum
   * and the available population pick their own cards (the minimum only while that card is
   * enabled), any other size goes into the custom card.
   */
  const handleCurveSelectSize = (size: number) => {
    if (size === selectedSize) {
      return;
    }
    if (size === curveMinSize && !isMinOptionDisabled) {
      handleOptionSelect(PowerCheckOption.USE_POWER_CHECK);
      return;
    }
    if (size === curveAvailableSize) {
      handleOptionSelect(PowerCheckOption.USE_ALL_NON_NULL_SAMPLES);
      return;
    }
    if (!isClustered) {
      selectCustomSize(size);
      return;
    }
    if (avgClusterSize !== undefined) {
      selectCustomSize(estimateParticipantNFromClusters(size, avgClusterSize), size);
    }
  };

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
            onClick={handleRunPowerCheck}
            loading={isMutating}
            disabledReason={reason}
          />

          {error && (
            <Flex align="center" gap="2">
              <GenericErrorCallout title={'Power check failed'} error={error} datasourceId={data.datasourceId} />
            </Flex>
          )}

          {oneTimeRejection && (
            <Callout.Root color="orange">
              <Callout.Icon>
                <ExclamationTriangleIcon />
              </Callout.Icon>
              <Callout.Text>{oneTimeRejection}</Callout.Text>
            </Callout.Root>
          )}

          {validationError && (
            <Flex align="center" gap="2">
              <GenericErrorCallout title={'Validation failed'} message={validationError} />
            </Flex>
          )}

          {metricsWaitingForOutcomes.length > 0 && (
            <Callout.Root color="blue">
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                No outcomes yet for: {metricsWaitingForOutcomes.join(', ')}. Enrollment can proceed, but sample size and
                effect estimates need observed values. Blank cells are missing, not zero.
                {primaryWaitingForOutcomes && ' Choose the maximum available or a custom sample size below.'}
              </Callout.Text>
            </Callout.Root>
          )}

          {primaryPower && !primaryWaitingForOutcomes && (
            <Callout.Root color={primaryPower.sufficient_n ? 'green' : 'red'}>
              <Callout.Icon>{primaryPower.sufficient_n ? <CheckCircledIcon /> : <CrossCircledIcon />}</Callout.Icon>
              <Callout.Text>
                {primaryPower.msg?.msg ||
                  (primaryPower.sufficient_n
                    ? 'The experiment has sufficient power.'
                    : 'The experiment does not have sufficient power.')}
              </Callout.Text>
            </Callout.Root>
          )}

          {primaryPower?.msg?.high_cluster_variation && primaryPowerClusterSizeCv != null && (
            <Callout.Root color="amber" variant="surface" size="1">
              <Callout.Icon>
                <ExclamationTriangleIcon />
              </Callout.Icon>
              <Callout.Text>
                Because your cluster sizes vary so widely, your experiment is sensitive to enrolling fewer participants
                or clusters. Consider adding filters to exclude extreme cluster sizes or adding more clusters to be
                safer.
              </Callout.Text>
            </Callout.Root>
          )}

          {metricsWithMissingValues.length > 0 && (
            <Callout.Root color="amber" variant="surface" size="1">
              <Callout.Icon>
                <ExclamationTriangleIcon />
              </Callout.Icon>
              <Callout.Text>
                Some participants are missing a value for: {metricsWithMissingValues.join(', ')}. Estimates assume that
                these participants will receive a value during the experiment. If you&apos;re unsure, add a filter to
                exclude these participants.
              </Callout.Text>
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
                        <DataList.Value>{getSampleStatusBadge(primaryPower)}</DataList.Value>
                      </DataList.Item>
                      <DataList.Item>
                        <DataList.Label>Required</DataList.Label>
                        <DataList.Value>
                          <MetricSampleSizeDisplay
                            analysis={primaryPower}
                            isClustered={isClustered}
                            variant="required"
                            align="start"
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
                            align="start"
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
                              align="start"
                            />
                          </DataList.Value>
                        </DataList.Item>
                      ) : null}
                      {primaryPower.metric_spec.is_one_time_eligible ? (
                        // Participants who have no value for this metric (available_n - available_nonnull_n).
                        <DataList.Item>
                          <DataList.Label>Available without values</DataList.Label>
                          <DataList.Value>
                            {availableWithoutValuesN !== undefined ? availableWithoutValuesN.toLocaleString() : '—'}
                          </DataList.Value>
                        </DataList.Item>
                      ) : null}
                      {/* The backend decides eligibility; we only show the switch when it says yes. It doesn't
                          support one-time metric for cluster designs, so hide it there too, unless it's on and
                          needs turning off. */}
                      {(primaryPower.metric_spec.is_one_time_eligible && !isClustered) ||
                      data.useOneTimeMetric === true ? (
                        <DataList.Item>
                          <DataList.Label>One-time metric</DataList.Label>
                          <DataList.Value>
                            <Text as="label" size="2">
                              <Flex gap="2" align="center">
                                <Switch
                                  size="1"
                                  checked={data.useOneTimeMetric ?? false}
                                  // Also wait for an in-flight MDE estimate, so it can't land after the switch changes the population.
                                  disabled={isMutating || isPowerCurveMutating || isEstimatingMde}
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
                          <Table.Cell>
                            <Flex gap="2" wrap="wrap">
                              <Text>{metricAnalysis.metric_spec.field_name}</Text>
                              {getSampleStatusBadge(metricAnalysis)}
                            </Flex>
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

      {data.powerCheckResponse !== undefined && !hasValidationError && (
        <SectionCard
          headerLeft={
            <Flex align="center" gap="2">
              <Heading size="3" wrap="nowrap">
                Select Target Sample Size
              </Heading>
              {isTargetSampleSizeLoading ? <Spinner size="2" /> : null}
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
                selectedSize={selectedSize}
                selectedMdePct={selectedMdePct}
                onSelectSize={handleCurveSelectSize}
              />
            ) : null}
            <Text>Choose the total number of participants to distribute across all arms:</Text>
            <Flex direction="column" gap="2" align="center" width="100%">
              {hasInsufficientSample && (
                <Callout.Root color="orange">
                  <Callout.Icon>
                    <CrossCircledIcon />
                  </Callout.Icon>
                  <Callout.Text>
                    {responseUsesOneTimeMetric && primaryAvailableN !== undefined ? (
                      <>
                        Only {primaryAvailableN.toLocaleString()} participants are assignable for the primary metric,
                        which is not enough for one or more metrics. You can still proceed with a custom sample size of
                        up to {primaryAvailableN.toLocaleString()}, or turn off one-time metric to include all
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
                datasourceId={data.datasourceId}
                isClustered={isClustered}
                powerCheckResponse={data.powerCheckResponse}
                primaryMetricFieldName={primaryMetricFieldName}
                targetMde={data.primaryMetric?.mde}
                selectedSampleOption={selectedSampleOption}
                desiredN={data.desiredN}
                desiredNClusters={data.desiredNClusters}
                mdePowerCheckResponse={data.mdePowerCheckResponse}
                isEstimatingMde={isEstimatingMde}
                mdeEstimateError={mdeEstimateError}
                mdeValidationError={mdeValidationError}
                onOptionSelect={handleOptionSelect}
                onCustomSizeChange={handleCustomSizeChange}
                // While a re-run is in flight, and especially after the one-time switch flips, the response on
                // screen describes the old population: picking a size now would estimate an MDE that mixes the two.
                disabled={isMutating || isPowerCheckForOtherOneTimeMode}
              />
            </Flex>
          </Flex>
        </SectionCard>
      )}
    </Flex>
  );
}
