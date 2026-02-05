'use client';

import { Flex, Grid } from '@radix-ui/themes';
import {
  CMABExperimentSpecOutput,
  CreateExperimentResponse,
  FilterOutput,
  MABExperimentSpecOutput,
  OnlineFrequentistExperimentSpecOutput,
  PreassignedFrequentistExperimentSpecOutput,
} from '@/api/methods.schemas';
import { MetricDisplay, MetricsSection } from '@/components/features/experiments/sections/metrics-section';
import { ExperimentDescriptionSection } from '@/components/features/experiments/sections/experiment-description-section';
import { TreatmentArmsSection } from '@/components/features/experiments/sections/treatment-arms-section';
import { ContextsSection } from '@/components/features/experiments/sections/contexts-section';
import { DatasourceTargetingSection } from '@/components/features/experiments/sections/datasource-targeting-section';
import { PowerBalanceSection } from '@/components/features/experiments/sections/power-balance-section';
import { OutcomesPriorSection } from '@/components/features/experiments/sections/outcomes-prior-section';

// Type guard to check if design spec is frequentist (has alpha, power, filters, strata)
function isFrequentistSpec(
  spec: CreateExperimentResponse['design_spec'],
): spec is OnlineFrequentistExperimentSpecOutput | PreassignedFrequentistExperimentSpecOutput {
  return spec.experiment_type === 'freq_online' || spec.experiment_type === 'freq_preassigned';
}

// Type guard for MAB experiments
function isMABSpec(spec: CreateExperimentResponse['design_spec']): spec is MABExperimentSpecOutput {
  return spec.experiment_type === 'mab_online';
}

// Type guard for CMAB experiments
function isCMABSpec(spec: CreateExperimentResponse['design_spec']): spec is CMABExperimentSpecOutput {
  return spec.experiment_type === 'cmab_online';
}

// Type guard for any bandit experiment
function isBanditSpec(
  spec: CreateExperimentResponse['design_spec'],
): spec is MABExperimentSpecOutput | CMABExperimentSpecOutput {
  return isMABSpec(spec) || isCMABSpec(spec);
}

export interface ExperimentConfirmationDisplayProps {
  response: CreateExperimentResponse;

  tableName?: string;
  primaryKey?: string;
  // Data not available in response (frequentist-specific)
  metrics?: {
    primary?: MetricDisplay;
    secondary?: MetricDisplay[];
  };
  chosenN?: number;
  onEditMetadata?: () => void;
  onEditTreatmentArms?: () => void;
  onEditDatasource?: () => void;
  onEditFilters?: () => void;
  onEditOutcomesPrior?: () => void;
  onEditContexts?: () => void;
  onEditMetrics?: () => void;
  onEditPowerBalance?: () => void;
  // Optional footer for actions (commit/abandon in old flow, nothing in new flow)
  footer?: React.ReactNode;
}

export function ExperimentConfirmationDisplay({
  response,
  tableName,
  primaryKey,
  metrics,
  chosenN,
  onEditMetadata,
  onEditTreatmentArms,
  onEditDatasource,
  onEditFilters,
  onEditOutcomesPrior,
  onEditContexts,
  onEditMetrics,
  onEditPowerBalance,
  footer,
}: ExperimentConfirmationDisplayProps) {
  const designSpec = response.design_spec;
  const isFreq = isFrequentistSpec(designSpec);
  const isBandit = isBanditSpec(designSpec);
  const isCmab = isCMABSpec(designSpec);

  // Extract frequentist-specific properties (confidence/power/filters/strata)
  // For non-frequentist experiments, these will be undefined
  let confidence = 95;
  let power = 80;
  let filters: FilterOutput[] = [];
  let strata: string[] | undefined;

  if (isFreq) {
    const alpha = designSpec.alpha ?? 0.05;
    confidence = Math.round((1 - alpha) * 100);
    power = Math.round((designSpec.power ?? 0.8) * 100);
    filters = designSpec.filters;
    strata = designSpec.strata?.map((s) => s.field_name);
  }

  // Extract webhook IDs from response (webhooks is string[] directly)
  // Extract bandit-specific properties
  const priorType = isBandit ? designSpec.prior_type : undefined;
  const rewardType = isBandit ? designSpec.reward_type : undefined;
  const contexts = isCmab ? (designSpec.contexts ?? []) : [];

  return (
    <Flex direction="column" gap="4">
      <Grid columns={'2'} gap={'3'}>
        <ExperimentDescriptionSection response={response} onEdit={onEditMetadata} />
        {isFreq && (
          <DatasourceTargetingSection
            tableName={tableName}
            primaryKey={primaryKey}
            filters={filters}
            onEditDatasource={onEditDatasource}
            onEditFilters={onEditFilters}
          />
        )}
        <TreatmentArmsSection response={response} onEdit={onEditTreatmentArms} />
        {isBandit && (
          <OutcomesPriorSection priorType={priorType} rewardType={rewardType} onEdit={onEditOutcomesPrior} />
        )}
        {isCmab && contexts.length > 0 && <ContextsSection contexts={contexts} onEdit={onEditContexts} />}
        {isFreq && (
          <>
            <MetricsSection metrics={metrics} strata={strata} onEdit={onEditMetrics} />
            <PowerBalanceSection
              confidence={confidence}
              power={power}
              chosenN={chosenN}
              assignSummary={response.assign_summary}
              onEdit={onEditPowerBalance}
            />
          </>
        )}
        {footer}
      </Grid>
    </Flex>
  );
}
