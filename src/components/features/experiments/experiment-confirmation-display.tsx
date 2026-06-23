'use client';

import { Flex, Grid } from '@radix-ui/themes';
import { CreateExperimentResponse, Filter } from '@/api/methods.schemas';
import { getPowerAnalysis } from '@/app/experiments/create/experiment-form/experiment-form-helpers';
import {
  isBanditSpec,
  isCmabSpec,
  isFreqPreassignedSpec,
  isFrequentistSpec,
} from '@/app/experiments/create/experiment-form/experiment-form-types';
import { MetricDisplay, MetricsSection } from '@/components/features/experiments/sections/metrics-section';
import { ExperimentDescriptionSection } from '@/components/features/experiments/sections/experiment-description-section';
import { TreatmentArmsSection } from '@/components/features/experiments/sections/treatment-arms-section';
import { ContextsSection } from '@/components/features/experiments/sections/contexts-section';
import { DatasourceTargetingSection } from '@/components/features/experiments/sections/datasource-targeting-section';
import { PowerBalanceSection } from '@/components/features/experiments/sections/power-balance-section';
import { OutcomesPriorSection } from '@/components/features/experiments/sections/outcomes-prior-section';
export interface ExperimentConfirmationDisplayProps {
  response: CreateExperimentResponse;

  tableName?: string;
  primaryKey?: string;
  // Data not available in response (frequentist-specific)
  metrics?: {
    primary?: MetricDisplay;
    secondary?: MetricDisplay[];
  };
  desiredN?: number;
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
  desiredN,
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
  const isFreqPreassigned = isFreqPreassignedSpec(designSpec);
  const isBandit = isBanditSpec(designSpec);
  const isCmab = isCmabSpec(designSpec);

  // Extract frequentist-specific properties (confidence/power/filters/strata)
  // For non-frequentist experiments, these will be undefined
  let confidence = 95;
  let power = 80;
  let filters: Filter[] = [];
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
  const primaryPowerAnalysis = isFreqPreassigned
    ? getPowerAnalysis(response.power_analyses, designSpec.metrics[0]?.field_name)
    : undefined;

  return (
    <Flex direction="column" gap="4">
      <Grid columns={'2'} gap={'3'}>
        <ExperimentDescriptionSection response={response} onEdit={onEditMetadata} />
        <TreatmentArmsSection response={response} onEdit={onEditTreatmentArms} />
        {isFreq && (
          <>
            <DatasourceTargetingSection
              tableName={tableName}
              primaryKey={primaryKey}
              filters={filters}
              onEditDatasource={onEditDatasource}
              onEditFilters={onEditFilters}
            />
            <MetricsSection metrics={metrics} strata={strata} onEdit={onEditMetrics} />
            {isFreqPreassigned && (
              <PowerBalanceSection
                confidence={confidence}
                power={power}
                desiredN={desiredN}
                assignSummary={response.assign_summary}
                primaryPowerAnalysis={primaryPowerAnalysis}
                onEdit={onEditPowerBalance}
              />
            )}
          </>
        )}
        {isBandit && (
          <OutcomesPriorSection priorType={priorType} rewardType={rewardType} onEdit={onEditOutcomesPrior} />
        )}
        {isCmab && contexts.length > 0 && <ContextsSection contexts={contexts} onEdit={onEditContexts} />}
        {footer}
      </Grid>
    </Flex>
  );
}
