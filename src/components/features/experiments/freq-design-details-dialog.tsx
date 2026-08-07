'use client';

import { useState } from 'react';
import { MixerHorizontalIcon } from '@radix-ui/react-icons';
import { Box, Button, Dialog, Flex } from '@radix-ui/themes';
import {
  AnyFrequentistDesignSpec,
  AssignSummary,
  DataType,
  MetricPowerAnalysis,
  ParticipantsSchema,
} from '@/api/methods.schemas';
import { MetricDisplay, MetricsSection } from '@/components/features/experiments/sections/metrics-section';
import { PowerBalanceSection } from '@/components/features/experiments/sections/power-balance-section';
import {
  isChosenSampleSufficient,
  isClusteredPreassignedSpec,
  isFreqPreassignedSpec,
  metricHasMissingValues,
} from '@/services/experiment-utils';

interface DesignDetailsDialogProps {
  designSpec: AnyFrequentistDesignSpec;
  experimentSchema?: ParticipantsSchema | null;
  assignSummary: AssignSummary | null | undefined;
  powerAnalyses?: MetricPowerAnalysis[];
  /** Precomputed metric displays; when omitted, they are derived from the design spec and schema. */
  metrics?: {
    primary?: MetricDisplay;
    secondary?: MetricDisplay[];
  };
}

const toMdePercent = (value: number | null | undefined): string =>
  value === null || value === undefined ? 'unknown' : (value * 100).toFixed(1);

export function FreqDesignDetailsDialog({
  designSpec,
  experimentSchema,
  assignSummary,
  powerAnalyses,
  metrics: metricsOverride,
}: DesignDetailsDialogProps) {
  const [open, setOpen] = useState(false);

  const desiredN = designSpec.desired_n ?? undefined;
  const isPreassigned = isFreqPreassignedSpec(designSpec);
  const isClustered = isClusteredPreassignedSpec(designSpec);
  const clusterKey = isClustered ? (designSpec.cluster_key ?? undefined) : undefined;
  const desiredNClusters = isClustered ? (designSpec.desired_n_clusters ?? undefined) : undefined;

  const fieldTypeByName = new Map((experimentSchema?.fields ?? []).map((field) => [field.field_name, field.data_type]));
  const analysisByField = new Map((powerAnalyses ?? []).map((analysis) => [analysis.metric_spec.field_name, analysis]));
  const toMetricDisplay = (fieldName: string, mdePct: number | null | undefined): MetricDisplay => {
    const analysis = analysisByField.get(fieldName);
    const estimatedRaw = analysis?.pct_change_with_desired_n;
    return {
      field_name: fieldName,
      data_type: fieldTypeByName.get(fieldName) ?? DataType.unknown,
      mde: toMdePercent(mdePct),
      estimatedMde: estimatedRaw != null ? (estimatedRaw * 100).toFixed(1) : null,
      hasMissingValues: analysis !== undefined && metricHasMissingValues(analysis),
      sufficientN: isChosenSampleSufficient(analysis, isClustered, desiredN, desiredNClusters),
    };
  };

  const [primary, ...secondary] = designSpec.metrics;
  const metrics = metricsOverride ?? {
    primary: primary ? toMetricDisplay(primary.field_name, primary.metric_pct_change) : undefined,
    secondary: secondary.map((m) => toMetricDisplay(m.field_name, m.metric_pct_change)),
  };
  const strata = designSpec.strata?.map((s) => s.field_name) ?? [];
  const confidence = Math.round((1 - (designSpec.alpha ?? 0.05)) * 100);
  const power = Math.round((designSpec.power ?? 0.8) * 100);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button variant="ghost" color="blue">
          <MixerHorizontalIcon /> Design Details
        </Button>
      </Dialog.Trigger>
      <Dialog.Content size="4" width="700px">
        <Flex direction="column" gap="3">
          <Dialog.Title>Design Details</Dialog.Title>
          <Box maxHeight="70vh" overflow="auto" pr="1">
            <Flex direction="column" gap="4">
              <MetricsSection metrics={metrics} strata={strata} />
              <PowerBalanceSection
                confidence={confidence}
                power={power}
                desiredN={desiredN}
                assignSummary={assignSummary}
                powerAnalyses={powerAnalyses}
                primaryMetricFieldName={primary?.field_name}
                isClustered={clusterKey !== undefined}
                showPower={isPreassigned}
                showDesiredSampleSize={isPreassigned}
                showActualSampleSize={false}
              />
            </Flex>
          </Box>
          <Flex gap="3" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Close
              </Button>
            </Dialog.Close>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
