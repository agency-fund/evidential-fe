'use client';
import { useState } from 'react';
import { useLocalStorage } from '@/providers/use-local-storage';
import { Flex, Grid, Heading, IconButton, TextField, Tooltip } from '@radix-ui/themes';
import { DashboardIcon, GearIcon, ListBulletIcon, MagnifyingGlassIcon, ReloadIcon } from '@radix-ui/react-icons';
import { useListOrganizationDatasources, useListOrganizationExperiments } from '@/api/admin';
import { XSpinner } from '@/components/ui/x-spinner';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { EmptyStateCard } from '@/components/ui/cards/empty-state-card';
import { useRouter } from 'next/navigation';
import { NO_DWH_DRIVER, PRODUCT_NAME } from '@/services/constants';
import { CreateExperimentButton } from '@/components/features/experiments/create-experiment-button';
import { ExperimentCard } from '@/components/features/experiments/experiment-card';
import { ExperimentsTable } from '@/components/features/experiments/experiments-table';
import { ExperimentStatusFilter } from '@/components/features/experiments/experiment-status-filter';
import { ExperimentImpactFilter } from '@/components/features/experiments/experiment-impact-filter';
import { ExperimentFieldFilter } from '@/components/features/experiments/experiment-field-filter';
import type { ExperimentStatus, ExperimentWithStatus } from '@/components/features/experiments/types';
import { getExperimentStatus } from '@/services/experiment-utils';
import { isFrequentistSpec } from '@/services/experiment-utils';
import type { ExperimentConfig } from '@/api/methods.schemas';

// Returns the data warehouse field names an experiment references via its filters, metrics, or
// strata.
const getExperimentFieldNames = (experiment: ExperimentConfig): Set<string> => {
  const spec = experiment.design_spec;
  if (!isFrequentistSpec(spec)) return new Set();
  return new Set([
    ...spec.filters.map((filter) => filter.field_name),
    ...spec.metrics.map((metric) => metric.field_name),
    ...spec.strata.map((stratum) => stratum.field_name),
  ]);
};

// Returns the sorted list of options to present in the Fields dropdown.
function getFieldOptions(filteredExperiments: ExperimentConfig[], selectedFields: string[]) {
  const fieldCounts = filteredExperiments
    .flatMap((experiment) => [...getExperimentFieldNames(experiment)])
    .reduce(
      (counts, field) => counts.set(field, (counts.get(field) ?? 0) + 1),
      new Map<string, number>(selectedFields.map((field) => [field, 0])),
    );

  return Array.from(fieldCounts, ([field, count]) => ({ field, count })).sort((a, b) => a.field.localeCompare(b.field));
}

export default function Page() {
  const router = useRouter();
  const orgContext = useCurrentOrganization();
  const currentOrgId = orgContext!.current.id;
  const [selectedStatuses, setSelectedStatuses] = useState<ExperimentStatus[]>([]);
  const [selectedImpacts, setSelectedImpacts] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useLocalStorage<'card' | 'table'>('exp-view-mode');

  const isCardView = viewMode === null || viewMode === 'card';

  const { data: datasourcesData, error: datasourcesError } = useListOrganizationDatasources(currentOrgId, {
    swr: {
      enabled: !!currentOrgId,
    },
  });

  const {
    data: experimentsData,
    isLoading: experimentsIsLoading,
    error: experimentsError,
  } = useListOrganizationExperiments(currentOrgId, {
    swr: { enabled: !!currentOrgId },
  });

  const committedExperiments = experimentsData?.items.filter((experiment) => experiment.state === 'committed') || [];

  const experimentsWithStatus = committedExperiments.map((experiment) => ({
    ...experiment,
    status: getExperimentStatus(experiment.design_spec.start_date, experiment.design_spec.end_date),
  }));

  const matchesStatusFilter = (experiment: ExperimentWithStatus): boolean => {
    if (selectedStatuses.length === 0) return true;
    return selectedStatuses.includes(experiment.status);
  };

  const matchesImpactFilter = (experiment: ExperimentWithStatus): boolean => {
    if (selectedImpacts.length === 0) return true;
    const normalizedImpact = experiment.impact ?? '';
    return selectedImpacts.includes(normalizedImpact);
  };

  const matchesSearchQuery = (experiment: ExperimentWithStatus): boolean => {
    if (searchQuery === '') return true;
    const query = searchQuery.toLowerCase();
    return (
      experiment.design_spec.experiment_name.toLowerCase().includes(query) ||
      experiment.design_spec.description.toLowerCase().includes(query)
    );
  };

  const matchesFieldFilter = (experiment: ExperimentWithStatus): boolean => {
    if (selectedFields.length === 0) return true;
    const fields = getExperimentFieldNames(experiment);
    return selectedFields.every((field) => fields.has(field));
  };

  const resetFilters = () => {
    setSelectedStatuses([]);
    setSelectedImpacts([]);
    setSelectedFields([]);
    setSearchQuery('');
  };

  const filteredExperiments = experimentsWithStatus.filter(
    (experiment) =>
      matchesStatusFilter(experiment) &&
      matchesImpactFilter(experiment) &&
      matchesSearchQuery(experiment) &&
      matchesFieldFilter(experiment),
  );

  const fieldOptions = getFieldOptions(filteredExperiments, selectedFields);

  const filtersActive =
    selectedStatuses.length > 0 || selectedImpacts.length > 0 || selectedFields.length > 0 || searchQuery !== '';

  if (datasourcesError) {
    return <GenericErrorCallout title={'Error with experiments list'} error={datasourcesError} />;
  }

  if (experimentsError) {
    return <GenericErrorCallout title={'Error with experiments list'} error={experimentsError} />;
  }

  return (
    <Flex direction="column" gap="4">
      <Flex justify="between" align="center">
        <Heading size={'8'}>
          Experiments
          {orgContext && orgContext.available.length > 1 && <> for {orgContext.current.name}</>}
        </Heading>
        <CreateExperimentButton />
      </Flex>

      {experimentsIsLoading && (
        <Flex>
          <XSpinner message={'Loading experiments list...'} />
        </Flex>
      )}

      {datasourcesData &&
      (datasourcesData.items.length === 0 ||
        (datasourcesData?.items.length === 1 &&
          datasourcesData.items[0].driver === NO_DWH_DRIVER &&
          committedExperiments.length === 0)) ? (
        // If there are no non-api-only datasources and no experiments, show the ds setup message.
        // One can still create api-only experiments from the create experiment button.
        <EmptyStateCard
          title={`Welcome to ${PRODUCT_NAME}`}
          description="To get started with experiments you'll need to first add a datasource in settings."
          buttonText="Go to Settings"
          buttonIcon={<GearIcon />}
          onClick={() => router.push(`/organizations/${currentOrgId}`)}
        />
      ) : committedExperiments.length === 0 ? (
        <EmptyStateCard
          title="Create your first experiment"
          description="Get started by creating your first experiment."
        >
          <CreateExperimentButton />
        </EmptyStateCard>
      ) : experimentsData ? (
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center" gap="4">
            <Flex align="center" gap="4">
              <TextField.Root
                placeholder="Search experiments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              >
                <TextField.Slot>
                  <MagnifyingGlassIcon height="16" width="16" />
                </TextField.Slot>
              </TextField.Root>

              <ExperimentStatusFilter value={selectedStatuses} onChange={setSelectedStatuses} />

              <ExperimentImpactFilter value={selectedImpacts} onChange={setSelectedImpacts} />

              {fieldOptions.length > 0 ? (
                <ExperimentFieldFilter value={selectedFields} onChange={setSelectedFields} options={fieldOptions} />
              ) : null}
              {filtersActive && (
                <Tooltip content="Reset Filters">
                  <IconButton variant="soft" onClick={resetFilters}>
                    <ReloadIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Flex>

            <Flex gap="2">
              <Tooltip content="Card View">
                <IconButton variant={isCardView ? 'solid' : 'soft'} size="2" onClick={() => setViewMode('card')}>
                  <DashboardIcon />
                </IconButton>
              </Tooltip>
              <Tooltip content="Table View">
                <IconButton variant={!isCardView ? 'solid' : 'soft'} size="2" onClick={() => setViewMode('table')}>
                  <ListBulletIcon />
                </IconButton>
              </Tooltip>
            </Flex>
          </Flex>

          {filteredExperiments.length === 0 ? (
            <EmptyStateCard
              title={searchQuery ? 'No experiments found' : 'No experiments match your filters'}
              description={
                searchQuery
                  ? 'Try adjusting your search terms or filters.'
                  : 'Try adjusting your filters to see more experiments.'
              }
            />
          ) : isCardView ? (
            <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="3">
              {filteredExperiments.map((experiment) => {
                return (
                  <ExperimentCard
                    key={experiment.experiment_id}
                    title={experiment.design_spec.experiment_name}
                    hypothesis={experiment.design_spec.description}
                    type={experiment.design_spec.experiment_type}
                    startDate={experiment.design_spec.start_date}
                    endDate={experiment.design_spec.end_date}
                    datasourceId={experiment.datasource_id}
                    designUrl={experiment.design_spec.design_url || ''}
                    experimentId={experiment.experiment_id}
                    organizationId={currentOrgId}
                    status={experiment.status}
                    impact={experiment.impact}
                    decision={experiment.decision}
                  />
                );
              })}
            </Grid>
          ) : (
            <ExperimentsTable experiments={filteredExperiments} organizationId={currentOrgId} />
          )}
        </Flex>
      ) : null}
    </Flex>
  );
}
