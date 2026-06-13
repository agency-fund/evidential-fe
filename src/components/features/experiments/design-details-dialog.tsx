'use client';

import { useState } from 'react';
import { MixerHorizontalIcon } from '@radix-ui/react-icons';
import { Box, Button, Dialog, Flex } from '@radix-ui/themes';
import {
  AssignSummary,
  DataType,
  DesignSpecOutput,
  MetricPowerAnalysisOutput,
  ParticipantsSchemaOutput,
} from '@/api/methods.schemas';
import { isFrequentistSpec } from '@/app/experiments/create/experiment-form/experiment-form-types';
import { MetricDisplay, MetricsSection } from '@/components/features/experiments/sections/metrics-section';
import { PowerBalanceSection } from '@/components/features/experiments/sections/power-balance-section';

interface DesignDetailsDialogProps {
  designSpec: DesignSpecOutput;
  experimentSchema: ParticipantsSchemaOutput | null | undefined;
  assignSummary: AssignSummary | null | undefined;
  powerAnalyses?: MetricPowerAnalysisOutput[];
}

const toMdePercent = (value: number | null | undefined): string =>
  value === null || value === undefined ? 'unknown' : (value * 100).toFixed(1);

export function DesignDetailsDialog({
  designSpec,
  experimentSchema,
  assignSummary,
  powerAnalyses,
}: DesignDetailsDialogProps) {
  const [open, setOpen] = useState(false);

  const fieldTypeByName = new Map((experimentSchema?.fields ?? []).map((field) => [field.field_name, field.data_type]));
  const estimatedMdeByField = new Map(
    (powerAnalyses ?? []).map((analysis) => [analysis.metric_spec.field_name, analysis.pct_change_with_desired_n]),
  );
  const toMetricDisplay = (fieldName: string, mdePct: number | null | undefined): MetricDisplay => {
    const estimatedRaw = estimatedMdeByField.get(fieldName);
    return {
      field_name: fieldName,
      data_type: fieldTypeByName.get(fieldName) ?? DataType.unknown,
      mde: toMdePercent(mdePct),
      estimatedMde: estimatedRaw != null ? (estimatedRaw * 100).toFixed(1) : null,
    };
  };

  let metrics: { primary?: MetricDisplay; secondary?: MetricDisplay[] } | undefined;
  let strata: string[] = [];
  let confidence = 95;
  let power = 80;
  let desiredN: number | undefined;

  if (isFrequentistSpec(designSpec)) {
    const [primary, ...secondary] = designSpec.metrics;
    metrics = {
      primary: primary ? toMetricDisplay(primary.field_name, primary.metric_pct_change) : undefined,
      secondary: secondary.map((m) => toMetricDisplay(m.field_name, m.metric_pct_change)),
    };
    strata = designSpec.strata?.map((s) => s.field_name) ?? [];
    confidence = Math.round((1 - (designSpec.alpha ?? 0.05)) * 100);
    power = Math.round((designSpec.power ?? 0.8) * 100);
    desiredN = designSpec.desired_n ?? undefined;
  }

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
                showActualSampleSize={false}
                showBalanceCheck={false}
                labelInPill={true}
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

export default DesignDetailsDialog;
