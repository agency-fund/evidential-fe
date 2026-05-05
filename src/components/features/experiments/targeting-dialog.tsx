'use client';

import { useState } from 'react';
import { Box, Button, Dialog, Flex } from '@radix-ui/themes';
import {
  BayesABExperimentSpecOutput,
  CMABExperimentSpecOutput,
  DataType,
  DesignSpecOutput,
  MABExperimentSpecOutput,
  OnlineFrequentistExperimentSpecOutput,
  ParticipantsDef,
  PreassignedFrequentistExperimentSpecOutput,
} from '@/api/methods.schemas';
import { MetricDisplay, MetricsSection } from '@/components/features/experiments/sections/metrics-section';
import { DatasourceTargetingSection } from '@/components/features/experiments/sections/datasource-targeting-section';
import { ContextsSection } from '@/components/features/experiments/sections/contexts-section';
import { OutcomesPriorSection } from '@/components/features/experiments/sections/outcomes-prior-section';
import { WebhooksSection } from '@/components/features/experiments/sections/webhooks-section';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';

interface TargetingDialogProps {
  designSpec: DesignSpecOutput;
  participantType: ParticipantsDef | null | undefined;
  webhookIds: string[];
}

const isFrequentistSpec = (
  spec: DesignSpecOutput,
): spec is OnlineFrequentistExperimentSpecOutput | PreassignedFrequentistExperimentSpecOutput =>
  spec.experiment_type === 'freq_online' || spec.experiment_type === 'freq_preassigned';

const isBanditSpec = (
  spec: DesignSpecOutput,
): spec is MABExperimentSpecOutput | CMABExperimentSpecOutput | BayesABExperimentSpecOutput =>
  spec.experiment_type === 'mab_online' ||
  spec.experiment_type === 'cmab_online' ||
  spec.experiment_type === 'bayes_ab_online';

const isCmabSpec = (spec: DesignSpecOutput): spec is CMABExperimentSpecOutput => spec.experiment_type === 'cmab_online';

const toMdePercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return 'unknown';
  }
  return (value * 100).toFixed(1);
};

export function TargetingDialog({ designSpec, participantType, webhookIds }: TargetingDialogProps) {
  const [open, setOpen] = useState(false);

  const fieldTypeByName = new Map(
    (participantType?.fields ?? []).map((field) => {
      return [field.field_name, field.data_type];
    }),
  );

  const primaryKey = participantType?.fields.find((field) => field.is_unique_id)?.field_name;

  const toMetricDisplay = (fieldName: string, mdePct: number | null | undefined): MetricDisplay => {
    const dataType = fieldTypeByName.get(fieldName) ?? DataType.unknown;
    return {
      field_name: fieldName,
      data_type: dataType,
      mde: toMdePercent(mdePct),
    };
  };

  let frequentistMetrics: { primary?: MetricDisplay; secondary?: MetricDisplay[] } | undefined = undefined;
  if (isFrequentistSpec(designSpec)) {
    const [primaryMetric, ...secondaryMetrics] = designSpec.metrics;
    frequentistMetrics = {
      primary: primaryMetric ? toMetricDisplay(primaryMetric.field_name, primaryMetric.metric_pct_change) : undefined,
      secondary: secondaryMetrics.map((metric) => toMetricDisplay(metric.field_name, metric.metric_pct_change)),
    };
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button variant="ghost" color="blue">
          <MagnifyingGlassIcon /> Targeting
        </Button>
      </Dialog.Trigger>
      <Dialog.Content size="4" width="900px">
        <Flex direction="column" gap="3">
          <Dialog.Title>Targeting and Design</Dialog.Title>
          <Box maxHeight="70vh" overflow="auto" pr="1">
            <Flex direction="column" gap="3">
              {isFrequentistSpec(designSpec) && (
                <>
                  <DatasourceTargetingSection
                    tableName={participantType?.table_name}
                    primaryKey={primaryKey}
                    filters={designSpec.filters}
                  />
                  <MetricsSection
                    metrics={frequentistMetrics}
                    strata={designSpec.strata?.map((stratum) => stratum.field_name) ?? []}
                  />
                </>
              )}
              {isBanditSpec(designSpec) && (
                <OutcomesPriorSection priorType={designSpec.prior_type} rewardType={designSpec.reward_type} />
              )}
              {isCmabSpec(designSpec) && <ContextsSection contexts={designSpec.contexts ?? []} />}
              {webhookIds.length > 0 && <WebhooksSection webhookIds={webhookIds} />}
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
