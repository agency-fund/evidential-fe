'use client';

import { Badge, Flex, RadioCards, Spinner, Text } from '@radix-ui/themes';
import { usePowerCheck } from '@/api/admin';
import { AnyFrequentistDesignSpecInput, PowerResponseOutput } from '@/api/methods.schemas';
import { PowerCheckDesiredNInput } from './power-check-desired-n-input';
import { PowerCheckOption } from './experiment-form-types';
import {
  MetricSampleSizeDisplay,
  estimateClusterN,
  estimateParticipantNFromClusters,
} from './metric-sample-size-display';
import { GenericErrorCallout } from '@/components/ui/generic-error';

/**
 * `sampleSizeOption` is the selected sample size option.
 *
 * `desiredN` is the final sample size selection from the user, regardless of wheather it was
 * derived from the minimum sample size, max available, or other user-entered value.
 * `desiredN` may be set with `response` undefined, signaling an upcoming MDE estimate.
 *
 * `response` if set should always correspond to the `desiredN` in this same message.
 */
export type PowerCheckSampleOptionChange = {
  sampleSizeOption: PowerCheckOption;
  desiredN: number | undefined;
  response: PowerResponseOutput | undefined;
};

/**
 * `designSpec` is the payload sent in the power request that produced the response.
 * Can be used to check for stale responses.
 */
export type PowerCheckResponseChange = PowerCheckSampleOptionChange & {
  designSpec: AnyFrequentistDesignSpecInput;
};

interface PowerCheckSampleSizeSelectorProps {
  datasourceId: string;
  selectedSampleOption: PowerCheckOption;
  primaryMetricFieldName: string;
  isClustered: boolean;
  /** Values for display in sample size mode (USE_POWER_CHECK) */
  powerCheckResponse: PowerResponseOutput;
  targetMde?: string;
  /**
   * Values for display in MDE mode (USE_ALL_NON_NULL_SAMPLES or ENTER_OWN).
   * desiredN should always correspond to the mdePowerCheckResponse if it exists.
   */
  mdePowerCheckResponse?: PowerResponseOutput;
  desiredN?: number;
  /** Used for making MDE estimates. Creates a design spec for the given desired N. */
  makeDesignSpec: (desiredN: number) => AnyFrequentistDesignSpecInput;
  /**
   * Handles the radio button selection immediately.
   */
  onOptionChange: (change: PowerCheckSampleOptionChange) => void;
  /**
   * Called on successful completion of any async MDE estimation request.
   * Parent is responsible for handling potentially stale responses.
   */
  onEstimatedMDEChange: (change: PowerCheckResponseChange) => void;
}

interface EstimatedMdeBadgeProps {
  isSelectedOption: boolean;
  isEstimatingMde: boolean;
  estimatedMdePct: string | undefined;
  error: Error | undefined;
}

function EstimatedMdeBadge({ isSelectedOption, isEstimatingMde, estimatedMdePct, error }: EstimatedMdeBadgeProps) {
  return (
    <Flex align="center" style={{ minHeight: '24px' }}>
      {isSelectedOption &&
        (isEstimatingMde ? (
          <Badge color="purple" variant="soft" size="2">
            Estimated MDE: …
            <Spinner size="1" />
          </Badge>
        ) : estimatedMdePct !== undefined ? (
          <Badge color="purple" variant="soft" size="2">
            Estimated MDE: {estimatedMdePct}%
          </Badge>
        ) : error ? (
          <Badge color="red" variant="soft" size="2">
            MDE Error
          </Badge>
        ) : null)}
    </Flex>
  );
}

/**
 * Handles sample size selection for experiment arms and triggers Minimum Detectable Effect
 * re-estimation when the user chooses an option other than the min sample size.  Estimates are
 * dispatched to the parent, which is responsible for managing and validating latest state.
 */
export function PowerCheckSampleSizeSelector({
  datasourceId,
  selectedSampleOption,
  primaryMetricFieldName,
  isClustered,
  powerCheckResponse,
  targetMde,
  mdePowerCheckResponse,
  desiredN,
  makeDesignSpec,
  onOptionChange,
  onEstimatedMDEChange,
}: PowerCheckSampleSizeSelectorProps) {
  const {
    trigger: triggerEstimateMde,
    isMutating: isEstimatingMde,
    error,
  } = usePowerCheck(datasourceId, {
    swr: { swrKey: `${datasourceId}/power/mde-estimate` },
  });

  const primaryAnalysis = powerCheckResponse.analyses.find((a) => a.metric_spec.field_name === primaryMetricFieldName);
  const targetN = primaryAnalysis?.target_n ?? undefined;
  const nonNullSamples = primaryAnalysis?.metric_spec.available_nonnull_n ?? 0;
  const allSamples = primaryAnalysis?.metric_spec.available_n ?? 0;
  const avgClusterSize = primaryAnalysis?.metric_spec.avg_cluster_size ?? undefined;
  const maxClusters =
    avgClusterSize !== undefined && avgClusterSize > 0 ? Math.floor(allSamples / avgClusterSize) : undefined;
  const clusterInputValue =
    desiredN !== undefined && avgClusterSize !== undefined
      ? String(estimateClusterN(desiredN, avgClusterSize) ?? '')
      : '';

  const mdePrimaryAnalysis = mdePowerCheckResponse?.analyses.find(
    (a) => a.metric_spec.field_name === primaryMetricFieldName,
  );
  const estimatedMdePct =
    mdePrimaryAnalysis === undefined
      ? undefined
      : mdePrimaryAnalysis.pct_change_with_desired_n != null
        ? (mdePrimaryAnalysis.pct_change_with_desired_n * 100).toFixed(1)
        : 'N/A';

  /**
   * Estimates may trigger on option selection or custom desired n entry.
   *
   * We always dispatch a valid response even if stale, letting the parent handle it.
   */
  const estimateMde = (sampleSizeOption: PowerCheckOption, desiredN: number) => {
    const designSpec = makeDesignSpec(desiredN);
    void (async () => {
      const response = await triggerEstimateMde({ design_spec: designSpec });
      if (!response) {
        // Can happen if this request has gone stale and failed, superceded by a more recent request.
        // Stale requests that succeed will be handled by the parent.
        return;
      }
      onEstimatedMDEChange({ sampleSizeOption, desiredN, response, designSpec });
    })();
  };

  /**
   * Handler immediately reports back:
   * - the selected option,
   * - the desiredN if appropriate for the option, and
   * - its current power estimate if it doesn't need updating.
   *
   * If the cached response doesn't match the desiredN, we also trigger a new MDE estimate.
   */
  const handleOptionChange = (option: PowerCheckOption) => {
    let useCachedResponse = false;
    switch (option) {
      case PowerCheckOption.NONE:
        onOptionChange({
          sampleSizeOption: option,
          desiredN: undefined,
          response: powerCheckResponse,
        });
        break;
      case PowerCheckOption.USE_POWER_CHECK:
        onOptionChange({
          sampleSizeOption: option,
          desiredN: targetN,
          response: powerCheckResponse,
        });
        break;
      case PowerCheckOption.USE_ALL_NON_NULL_SAMPLES:
        useCachedResponse = mdePowerCheckResponse !== undefined && desiredN === nonNullSamples;
        onOptionChange({
          sampleSizeOption: option,
          desiredN: nonNullSamples,
          response: useCachedResponse ? mdePowerCheckResponse : undefined,
        });
        if (!useCachedResponse) {
          estimateMde(option, nonNullSamples);
        }
        break;
      case PowerCheckOption.ENTER_OWN:
        // Switching away from ENTER_OWN will either keep desiredN set to nonNullSamples or change
        // it away, so switching back to ENTER_OWN will not reuse a stale custom response with the
        // following restricted reuse check.
        useCachedResponse = mdePowerCheckResponse !== undefined && desiredN === nonNullSamples;
        onOptionChange({
          sampleSizeOption: option,
          desiredN: desiredN,
          response: useCachedResponse ? mdePowerCheckResponse : undefined,
        });
        if (!useCachedResponse && desiredN !== undefined) {
          estimateMde(option, desiredN);
        }
        break;
    }
  };

  const handleInputChange = (newN: number | undefined) => {
    if (newN === undefined || selectedSampleOption !== PowerCheckOption.ENTER_OWN || newN === desiredN) {
      return;
    }
    // Notify parent that we want a new desiredN.
    onOptionChange({ sampleSizeOption: selectedSampleOption, desiredN: newN, response: undefined });
    estimateMde(PowerCheckOption.ENTER_OWN, newN);
  };

  const handleClusterInputChange = (clusterN: number | undefined) => {
    if (clusterN === undefined || avgClusterSize === undefined) {
      return;
    }
    handleInputChange(estimateParticipantNFromClusters(clusterN, avgClusterSize));
  };

  return (
    <Flex direction="column" gap="2" justify="center" width="100%">
      <RadioCards.Root columns="1" value={selectedSampleOption} onValueChange={handleOptionChange}>
        <Flex direction="row" gap="3" justify="center" wrap="wrap">
          <RadioCards.Item
            value={PowerCheckOption.USE_POWER_CHECK}
            disabled={targetN === undefined || targetN === 0 || targetN > allSamples}
          >
            <Flex align="center" direction="column" gap="2">
              <Text size="2">Use the minimum required sample:</Text>
              <Flex height="32px" align="center">
                {primaryAnalysis ? (
                  <MetricSampleSizeDisplay
                    analysis={primaryAnalysis}
                    isClustered={isClustered}
                    variant="required"
                    align="center"
                  />
                ) : (
                  <Text size="2">N/A</Text>
                )}
              </Flex>
              <Flex align="center" style={{ minHeight: '24px' }}>
                {targetMde !== undefined ? (
                  <Badge color="purple" variant="soft" size="2">
                    Target MDE: {targetMde}%
                  </Badge>
                ) : null}
              </Flex>
            </Flex>
          </RadioCards.Item>
          <RadioCards.Item
            value={PowerCheckOption.USE_ALL_NON_NULL_SAMPLES}
            disabled={nonNullSamples === undefined || nonNullSamples === 0}
          >
            <Flex align="center" direction="column" gap="2">
              <Text size="2">Use all non-null samples:</Text>
              <Flex height="32px" align="center">
                {primaryAnalysis ? (
                  <MetricSampleSizeDisplay
                    analysis={primaryAnalysis}
                    isClustered={isClustered}
                    variant="available-nonnull"
                    align="center"
                  />
                ) : (
                  <Text size="2">N/A</Text>
                )}
              </Flex>

              <EstimatedMdeBadge
                isSelectedOption={selectedSampleOption === PowerCheckOption.USE_ALL_NON_NULL_SAMPLES}
                isEstimatingMde={isEstimatingMde}
                estimatedMdePct={estimatedMdePct}
                error={error}
              />
            </Flex>
          </RadioCards.Item>
          <RadioCards.Item value={PowerCheckOption.ENTER_OWN} disabled={allSamples === undefined || allSamples === 0}>
            <Flex align="center" direction="column" gap="2" style={{ pointerEvents: 'auto' }}>
              <Text size="2">Use a custom sample size:</Text>
              {isClustered && avgClusterSize !== undefined && avgClusterSize > 0 ? (
                <Flex direction="column" gap="2" align="center">
                  <PowerCheckDesiredNInput
                    label="Clusters"
                    value={clusterInputValue}
                    onChange={handleClusterInputChange}
                    max={maxClusters}
                    placeholder="# of clusters"
                  />
                </Flex>
              ) : null}
              <PowerCheckDesiredNInput
                label={isClustered ? 'Participants' : undefined}
                value={String(desiredN ?? '')}
                onChange={handleInputChange}
                max={allSamples ?? undefined}
                placeholder="# of participants"
              />
              <EstimatedMdeBadge
                isSelectedOption={selectedSampleOption === PowerCheckOption.ENTER_OWN}
                isEstimatingMde={isEstimatingMde}
                estimatedMdePct={estimatedMdePct}
                error={error}
              />
            </Flex>
          </RadioCards.Item>
        </Flex>
      </RadioCards.Root>
      {error && <GenericErrorCallout title={'MDE estimate failed'} error={error} />}
    </Flex>
  );
}
