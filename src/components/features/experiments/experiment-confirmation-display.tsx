'use client';

import { Flex, Grid } from '@radix-ui/themes';
import { CreateExperimentResponse, Filter } from '@/api/methods.schemas';
import {
  isBanditSpec,
  isClusteredPreassignedSpec,
  isCmabSpec,
  isFrequentistSpec,
  isMabDwhSpec,
} from '@/services/experiment-utils';
import { MetricDisplay, MetricsSection } from '@/components/features/experiments/sections/metrics-section';
import { ExperimentDescriptionSection } from '@/components/features/experiments/sections/experiment-description-section';
import { TreatmentArmsSection } from '@/components/features/experiments/sections/treatment-arms-section';
import { ContextsSection } from '@/components/features/experiments/sections/contexts-section';
import { DatasourceTargetingSection } from '@/components/features/experiments/sections/datasource-targeting-section';
import { FreqDesignDetailsDialog } from '@/components/features/experiments/freq-design-details-dialog';
import { OutcomesPriorSection } from '@/components/features/experiments/sections/outcomes-prior-section';
export interface ExperimentConfirmationDisplayProps {
  response: CreateExperimentResponse;
  // Data not available in response (frequentist-specific)
  metrics?: {
    primary?: MetricDisplay;
    secondary?: MetricDisplay[];
  };
  onEditMetadata?: () => void;
  onEditTreatmentArms?: () => void;
  onEditDatasource?: () => void;
  onEditFilters?: () => void;
  onEditOutcomesPrior?: () => void;
  onEditContexts?: () => void;
  onEditMetrics?: () => void;
  // Optional footer for actions (commit/abandon in old flow, nothing in new flow)
  footer?: React.ReactNode;
}

export function ExperimentConfirmationDisplay({
  response,
  metrics,
  onEditMetadata,
  onEditTreatmentArms,
  onEditDatasource,
  onEditFilters,
  onEditOutcomesPrior,
  onEditContexts,
  onEditMetrics,
  footer,
}: ExperimentConfirmationDisplayProps) {
  const designSpec = response.design_spec;
  const isFreq = isFrequentistSpec(designSpec);
  const isBandit = isBanditSpec(designSpec);
  const isCmab = isCmabSpec(designSpec);
  const isMabDwh = isMabDwhSpec(designSpec);
  const clusterKey = isClusteredPreassignedSpec(designSpec) ? (designSpec.cluster_key ?? undefined) : undefined;

  // Extract frequentist-specific properties (filters/strata)
  // For non-frequentist experiments, these will be undefined
  let filters: Filter[] = [];
  let strata: string[] | undefined;

  if (isFreq) {
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
        <TreatmentArmsSection response={response} onEdit={onEditTreatmentArms} />
        {isFreq && (
          <>
            <DatasourceTargetingSection
              tableName={designSpec.table_name}
              primaryKey={designSpec.primary_key}
              clusterKey={clusterKey}
              filters={filters}
              onEditDatasource={onEditDatasource}
              onEditFilters={onEditFilters}
            />
            <MetricsSection
              metrics={metrics}
              strata={strata}
              onEdit={onEditMetrics}
              headerRight={
                <FreqDesignDetailsDialog
                  designSpec={designSpec}
                  assignSummary={response.assign_summary}
                  powerAnalyses={response.power_analyses?.analyses}
                  showMetrics={false}
                />
              }
            />
          </>
        )}
        {isMabDwh && (
          <DatasourceTargetingSection
            tableName={designSpec.table_name}
            primaryKey={designSpec.primary_key}
            targetField={designSpec.target_field_name}
            onEditDatasource={onEditDatasource}
          />
        )}
        {isBandit && (
          <OutcomesPriorSection
            priorType={priorType}
            rewardType={rewardType}
            autofailEnabled={designSpec.enable_autofail === true}
            autofailWindow={designSpec.autofail_window}
            autofailOutcomeValue={designSpec.autofail_outcome_value}
            onEdit={onEditOutcomesPrior}
          />
        )}
        {isCmab && contexts.length > 0 && <ContextsSection contexts={contexts} onEdit={onEditContexts} />}
        {footer}
      </Grid>
    </Flex>
  );
}
