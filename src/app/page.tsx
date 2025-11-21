'use client';
import { Flex, Grid, Heading, TextField, IconButton, Tooltip, Button, Separator} from '@radix-ui/themes';
import { GearIcon, MagnifyingGlassIcon, ListBulletIcon, DashboardIcon, ReloadIcon } from '@radix-ui/react-icons';
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
import { useState } from 'react';
import type { ExperimentStatus } from '@/components/features/experiments/experiment-status-badge';

const getExperimentStatus = (startDate: string, endDate: string): ExperimentStatus => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) {
    return 'upcoming';
  } else if (now > end) {
    return 'finished';
  } else {
    return 'current';
  }
};

export default function Page() {
  const router = useRouter();
  const orgContext = useCurrentOrganization();
  const currentOrgId = orgContext!.current.id;
  const [selectedStatuses, setSelectedStatuses] = useState<ExperimentStatus[]>([]);
  const [selectedImpacts, setSelectedImpacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  const {
    data: datasourcesData,
    isLoading: datasourcesIsLoading,
    error: datasourcesError,
  } = useListOrganizationDatasources(currentOrgId, {
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

  const statusOrder = ['current', 'upcoming', 'finished'] as const;

  const committedExperiments = experimentsData?.items.filter((experiment) => experiment.state === 'committed') || [];

  const experimentsWithStatus = committedExperiments.map((experiment) => ({
    ...experiment,
    status: getExperimentStatus(experiment.design_spec.start_date, experiment.design_spec.end_date),
  }));

  const getCount = (status: string) => experimentsWithStatus.filter((exp) => exp.status === status).length;

  const statusOptions = statusOrder
    .filter((status) => getCount(status) > 0)
    .map((status) => ({
      status,
    }));

  const impactOptions = [
    { value: 'positive', label: 'Positive Impact', count: 4 },
    { value: 'neutral', label: 'Neutral Impact', count: 1 },
    { value: 'negative', label: 'Negative Impact', count: 5 },
  ];

  const filteredExperiments = experimentsWithStatus.filter((experiment) => {
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(experiment.status);
    const matchesImpact = selectedImpacts.length === 0 || true;
    const matchesSearch =
      experiment.design_spec.experiment_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      experiment.design_spec.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesImpact && matchesSearch;
  });

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
        {datasourcesData && datasourcesData.items.length > 0 && (
          <CreateExperimentButton datasources={datasourcesData} loading={datasourcesIsLoading} />
        )}
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
          <CreateExperimentButton datasources={datasourcesData} loading={datasourcesIsLoading || false} />
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
             
              <ExperimentStatusFilter
                statusOptions={statusOptions}
                value={selectedStatuses}
                onChange={setSelectedStatuses}
              />
               {(selectedStatuses.length > 0 || searchQuery !== '') && (
              <Tooltip content="Reset Filters">
              <IconButton variant="soft" onClick={() => {
                setSelectedStatuses([]);
                setSearchQuery('');
              }}>
                <ReloadIcon />
              </IconButton>
              </Tooltip>
            )}
            </Flex>
          
             <Flex gap="2">
                <Tooltip content="Card View">
                  <IconButton
                    variant={viewMode === 'card' ? 'solid' : 'soft'}
                    size="2"
                    onClick={() => setViewMode('card')}
                  >
                    <DashboardIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip content="Table View">
                  <IconButton
                    variant={viewMode === 'table' ? 'solid' : 'soft'}
                    size="2"
                    onClick={() => setViewMode('table')}
                  >
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
          ) : viewMode === 'card' ? (
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
