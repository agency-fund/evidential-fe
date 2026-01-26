'use client';

import { Flex, Grid } from '@radix-ui/themes';
import { ListSelectedWebhooksCard } from '@/components/features/experiments/list-selected-webhooks-card';
import {
  CreateExperimentResponse,
  DataType,
  FilterOutput,
  OnlineFrequentistExperimentSpecOutput,
  PreassignedFrequentistExperimentSpecOutput,
} from '@/api/methods.schemas';
import { MetricDisplay, MetricsSection } from '@/components/features/experiments/sections/metrics-section';
import { BasicInformationSection } from '@/components/features/experiments/sections/basic-information-section';
import { TreatmentArmsSection } from '@/components/features/experiments/sections/treatment-arms-section';
import { ParametersSection } from '@/components/features/experiments/sections/parameters-section';
import { StatisticsSection } from '@/components/features/experiments/sections/statistics-section';
import { FiltersSection } from '@/components/features/experiments/sections/filters-section';
import { StrataSection } from '@/components/features/experiments/sections/strata-section';

// Type guard to check if design spec is frequentist (has alpha, power, filters, strata)
function isFrequentistSpec(
  spec: CreateExperimentResponse['design_spec'],
): spec is OnlineFrequentistExperimentSpecOutput | PreassignedFrequentistExperimentSpecOutput {
  return spec.experiment_type === 'freq_online' || spec.experiment_type === 'freq_preassigned';
}

export interface ExperimentConfirmationDisplayProps {
  response: CreateExperimentResponse;
  // Data not available in response
  metrics?: {
    primary?: MetricDisplay;
    secondary?: MetricDisplay[];
  };
  filterFieldTypes?: Record<string, DataType>; // field_name -> data_type
  chosenN?: number;
  // Optional footer for actions (commit/abandon in old flow, nothing in new flow)
  footer?: React.ReactNode;
}

export function ExperimentConfirmationDisplay({
  response,
  metrics,
  filterFieldTypes,
  chosenN,
  footer,
}: ExperimentConfirmationDisplayProps) {
  const designSpec = response.design_spec;

  // Extract frequentist-specific properties (confidence/power/filters/strata)
  // For non-frequentist experiments, these will be undefined
  let confidence = 95;
  let power = 80;
  let filters: FilterOutput[] = [];
  let strata: string[] | undefined;

  // TODO: verify
  if (isFrequentistSpec(designSpec)) {
    const alpha = designSpec.alpha ?? 0.05;
    confidence = Math.round((1 - alpha) * 100);
    power = Math.round((designSpec.power ?? 0.8) * 100);
    filters = designSpec.filters;
    strata = designSpec.strata?.map((s) => s.field_name);
  }

  // Extract webhook IDs from response (webhooks is string[] directly)
  const webhookIds = response.webhooks ?? [];

  return (
    <Flex direction="column" gap="4">
      <BasicInformationSection response={response} />
      <TreatmentArmsSection response={response} />
      <Grid columns="3" gap="3">
        <MetricsSection metrics={metrics} />
        <ParametersSection confidence={confidence} power={power} chosenN={chosenN} />
        <StatisticsSection assignSummary={response.assign_summary} />
      </Grid>
      <FiltersSection filters={filters} filterFieldTypes={filterFieldTypes} />
      <StrataSection strata={strata} />
      <ListSelectedWebhooksCard webhookIds={webhookIds} />
      {footer}
    </Flex>
  );
}
