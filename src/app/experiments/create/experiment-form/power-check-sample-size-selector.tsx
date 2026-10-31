'use client';

import { Badge, Flex, RadioCards, Spinner, Text, TextField } from '@radix-ui/themes';
import { AnyFrequentistDesignSpec, MetricPowerAnalysis, PowerResponse } from '@/api/methods.schemas';
import { PowerCheckDesiredNInput } from './power-check-desired-n-input';
import { PowerCheckOption } from './experiment-form-types';
import {
  MetricSampleSizeDisplay,
  estimateParticipantNFromClusters,
} from '@/components/features/experiments/metric-sample-size-display';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { getPowerAnalysis } from '@/services/experiment-utils';

/**
 * `sampleSizeOption` is the selected sample size option.
 *
 * `desiredN` is the final sample size selection from the user, regardless of wheather it was
 * derived from the minimum sample size, max available, or other user-entered value.
 * `desiredN` may be set with `response` undefined, signaling an upcoming MDE estimate.
 * `desiredNClusters` is the selected cluster count for cluster-randomized experiments.
 *
 * `response` if set should always correspond to the `desiredN`/`desiredNClusters` in this same message.
 */
export type PowerCheckSampleOptionChange = {
  sampleSizeOption: PowerCheckOption;
  desiredN: number | undefined;
  desiredNClusters?: number;
  response: PowerResponse | undefined;
};

/**
 * `designSpec` is the payload sent in the power request that produced the response.
 * Can be used to check for stale responses.
 */
export type PowerCheckResponseChange = PowerCheckSampleOptionChange & {
  designSpec: AnyFrequentistDesignSpec;
};

/**
 * The sample sizes the cards offer, taken from the primary metric's power analysis: the required
 * minimum (participants and, for cluster designs, clusters) and the available population.
 */
export function getSampleSizeLandmarks(primaryAnalysis: MetricPowerAnalysis | undefined) {
  const targetN = primaryAnalysis?.target_n ?? undefined;
  const targetNClusters = primaryAnalysis?.num_clusters_total ?? undefined;
  const allSamples = primaryAnalysis?.metric_spec.available_n ?? 0;
  const avgClusterSize = primaryAnalysis?.metric_spec.avg_cluster_size ?? undefined;
  const maxClusters =
    avgClusterSize !== undefined && avgClusterSize > 0 ? Math.floor(allSamples / avgClusterSize) : undefined;
  // The minimum cannot be chosen when it is unknown or exceeds the available population.
  const isMinOptionDisabled = targetN === undefined || targetN === 0 || targetN > allSamples;
  return { targetN, targetNClusters, allSamples, avgClusterSize, maxClusters, isMinOptionDisabled };
}

interface PowerCheckSampleSizeSelectorProps {
  selectedSampleOption: PowerCheckOption;
  primaryMetricFieldName: string;
  isClustered: boolean;
  /** Values for display in sample size mode (USE_POWER_CHECK) */
  powerCheckResponse: PowerResponse;
  targetMde?: string;
  /**
   * Values for display in MDE mode (USE_ALL_NON_NULL_SAMPLES or ENTER_OWN).
   * desiredN should always correspond to the mdePowerCheckResponse if it exists.
   */
  mdePowerCheckResponse?: PowerResponse;
  desiredN?: number;
  desiredNClusters?: number;
  /** True while an MDE estimate for the current selection is being requested. */
  isEstimatingMde: boolean;
  /** The error of the latest MDE estimate request, if it failed. */
  mdeEstimateError: Error | undefined;
  /** Called immediately when the user picks a card. */
  onOptionSelect: (option: PowerCheckOption) => void;
  /**
   * Called when the user has typed a custom size: participants, plus the cluster count for
   * cluster designs; `undefined` for an empty or invalid entry.
   */
  onCustomSizeChange: (desiredN: number | undefined, desiredNClusters?: number) => void;
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
          <Badge variant="soft" size="2">
            Estimated MDE: …
            <Spinner size="1" />
          </Badge>
        ) : estimatedMdePct !== undefined ? (
          <Badge variant="soft" size="2">
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
 * The three sample size cards (required minimum, available population, custom entry). Purely
 * presentational: card picks and typed sizes are reported to the parent, which owns the
 * selection logic and the Minimum Detectable Effect re-estimation.
 */
export function PowerCheckSampleSizeSelector({
  selectedSampleOption,
  primaryMetricFieldName,
  isClustered,
  powerCheckResponse,
  targetMde,
  mdePowerCheckResponse,
  desiredN,
  desiredNClusters,
  isEstimatingMde,
  mdeEstimateError,
  onOptionSelect,
  onCustomSizeChange,
}: PowerCheckSampleSizeSelectorProps) {
  const primaryAnalysis = getPowerAnalysis(powerCheckResponse, primaryMetricFieldName);
  const { allSamples, avgClusterSize, maxClusters, isMinOptionDisabled } = getSampleSizeLandmarks(primaryAnalysis);
  const clusterInputValue = desiredNClusters !== undefined ? String(desiredNClusters) : '';
  const showClusteredCustomInput = isClustered && avgClusterSize !== undefined && avgClusterSize > 0;

  const mdePrimaryAnalysis = getPowerAnalysis(mdePowerCheckResponse, primaryMetricFieldName);
  const estimatedMdePct =
    mdePrimaryAnalysis === undefined
      ? undefined
      : mdePrimaryAnalysis.pct_change_with_desired_n != null
        ? (mdePrimaryAnalysis.pct_change_with_desired_n * 100).toFixed(1)
        : 'N/A';

  const handleClusterInputChange = (clusterN: number | undefined) => {
    if (avgClusterSize === undefined) {
      return;
    }
    if (clusterN === undefined) {
      onCustomSizeChange(undefined);
      return;
    }
    onCustomSizeChange(estimateParticipantNFromClusters(clusterN, avgClusterSize), clusterN);
  };

  return (
    <Flex direction="column" gap="2" justify="center" width="100%">
      <RadioCards.Root columns="1" value={selectedSampleOption} onValueChange={onOptionSelect}>
        <Flex direction="row" gap="3" justify="center" wrap="wrap">
          <RadioCards.Item value={PowerCheckOption.USE_POWER_CHECK} disabled={isMinOptionDisabled}>
            <Flex align="center" direction="column" gap="2">
              <Text size="2">Use the minimum required sample size:</Text>
              <Flex minHeight="32px" align="center">
                <MetricSampleSizeDisplay
                  analysis={primaryAnalysis}
                  isClustered={isClustered}
                  variant="required"
                  align="center"
                />
              </Flex>
              <Flex align="center" style={{ minHeight: '24px' }}>
                {targetMde !== undefined ? (
                  <Badge variant="soft" size="2">
                    Target MDE: {targetMde}%
                  </Badge>
                ) : null}
              </Flex>
            </Flex>
          </RadioCards.Item>
          <RadioCards.Item
            value={PowerCheckOption.USE_ALL_NON_NULL_SAMPLES}
            disabled={allSamples === undefined || allSamples === 0}
          >
            <Flex align="center" direction="column" gap="2">
              <Text size="2">Use the maximum available sample size:</Text>
              <Flex minHeight="32px" align="center">
                <MetricSampleSizeDisplay
                  analysis={primaryAnalysis}
                  isClustered={isClustered}
                  variant="available"
                  align="center"
                />
              </Flex>

              <EstimatedMdeBadge
                isSelectedOption={selectedSampleOption === PowerCheckOption.USE_ALL_NON_NULL_SAMPLES}
                isEstimatingMde={isEstimatingMde}
                estimatedMdePct={estimatedMdePct}
                error={mdeEstimateError}
              />
            </Flex>
          </RadioCards.Item>
          <RadioCards.Item value={PowerCheckOption.ENTER_OWN} disabled={allSamples === undefined || allSamples === 0}>
            <Flex align="center" direction="column" gap="2" style={{ pointerEvents: 'auto' }}>
              <Text size="2">Use a custom sample size:</Text>
              {showClusteredCustomInput ? (
                <Flex direction="column" gap="2" align="center">
                  <PowerCheckDesiredNInput
                    label="Clusters"
                    value={clusterInputValue}
                    onChange={handleClusterInputChange}
                    max={maxClusters}
                    placeholder="# of clusters"
                  />
                  <Flex direction="column" gap="1" align="start">
                    <Text as="label" size="1" weight="medium">
                      Estimated Participants
                    </Text>
                    <TextField.Root
                      readOnly
                      style={{ width: '150px' }}
                      size="2"
                      value={desiredN !== undefined ? String(desiredN) : ''}
                      placeholder="—"
                    />
                  </Flex>
                </Flex>
              ) : (
                <PowerCheckDesiredNInput
                  value={String(desiredN ?? '')}
                  onChange={onCustomSizeChange}
                  max={allSamples ?? undefined}
                  placeholder="# of participants"
                />
              )}
              <EstimatedMdeBadge
                isSelectedOption={selectedSampleOption === PowerCheckOption.ENTER_OWN}
                isEstimatingMde={isEstimatingMde}
                estimatedMdePct={estimatedMdePct}
                error={mdeEstimateError}
              />
            </Flex>
          </RadioCards.Item>
        </Flex>
      </RadioCards.Root>
      {mdeEstimateError && <GenericErrorCallout title={'MDE estimate failed'} error={mdeEstimateError} />}
    </Flex>
  );
}
