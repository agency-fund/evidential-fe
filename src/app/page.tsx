'use client';
import { Button, Flex, Grid, Heading, TextField } from '@radix-ui/themes';
import { GearIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { useListOrganizationDatasources, useListOrganizationExperiments } from '@/api/admin';
import { XSpinner } from '@/components/ui/x-spinner';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { EmptyStateCard } from '@/components/ui/cards/empty-state-card';
import { useRouter } from 'next/navigation';
import { PRODUCT_NAME } from '@/services/constants';
import { CreateExperimentButton } from '@/components/features/experiments/create-experiment-button';
import ExperimentCard from '@/components/features/experiments/experiment-card';
import { useState } from 'react';

const getExperimentStatus = (startDate: string, endDate: string) => {
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
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  const datasourcesToName = new Map(datasourcesData?.items.map((e) => [e.id, e.name]) || []);

  const statusOrder = ['all', 'current', 'upcoming', 'finished'] as const;

  const committedExperiments = experimentsData?.items.filter((experiment) => experiment.state === 'committed') || [];

  const experimentsWithStatus = committedExperiments.map((experiment) => ({
    ...experiment,
    status: getExperimentStatus(experiment.design_spec.start_date, experiment.design_spec.end_date),
  }));

  const getCount = (status: string) =>
    status === 'all'
      ? experimentsWithStatus.length
      : experimentsWithStatus.filter((exp) => exp.status === status).length;

  const availableFilters = statusOrder.filter((status) => getCount(status) > 0);

  const filteredExperiments = experimentsWithStatus.filter((experiment) => {
    const matchesStatus = selectedStatus === 'all' || experiment.status === selectedStatus;
    const matchesSearch =
      experiment.design_spec.experiment_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      experiment.design_spec.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
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
        <Heading size={'8'}>Experiments</Heading>
        <CreateExperimentButton datasources={datasourcesData} loading={datasourcesIsLoading} />
      </Flex>

      {experimentsIsLoading && (
        <Flex>
          <XSpinner message={'Loading experiments list...'} />
        </Flex>
      )}

      {datasourcesData && datasourcesData.items.length === 0 ? (
        <EmptyStateCard
          title={`Welcome to ${PRODUCT_NAME}`}
          description="To get started with experiments you'll need to first add a datasource in settings."
          buttonText="Go to Settings"
          buttonIcon={<GearIcon />}
          onClick={() => router.push(`/organizations/${currentOrgId}`)}
        />
      ) : experimentsData && committedExperiments.length === 0 ? (
        <EmptyStateCard
          title="Create your first experiment"
          description="Get started by creating your first experiment."
        >
          <CreateExperimentButton datasources={datasourcesData} loading={datasourcesIsLoading || false} />
        </EmptyStateCard>
      ) : experimentsData ? (
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center" gap="4">
            <TextField.Root
              placeholder="Search experiments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            >
              <TextField.Slot>
                <MagnifyingGlassIcon height="16" width="16" />
              </TextField.Slot>
            </TextField.Root>

            <Flex gap="2">
              {availableFilters.map((status) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? 'solid' : 'soft'}
                  onClick={() => setSelectedStatus(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)} ({getCount(status)})
                </Button>
              ))}
            </Flex>
          </Flex>

          {filteredExperiments.length === 0 ? (
            <EmptyStateCard
              title={searchQuery ? 'No experiments found' : `No ${selectedStatus} experiments`}
              description={
                searchQuery
                  ? 'Try adjusting your search terms.'
                  : `There are no ${selectedStatus} experiments to display.`
              }
            />
          ) : (
            <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="3">
              {filteredExperiments.map((experiment) => (
                <ExperimentCard
                  key={experiment.design_spec.experiment_id}
                  title={experiment.design_spec.experiment_name}
                  hypothesis={experiment.design_spec.description}
                  type={experiment.design_spec.experiment_type}
                  startDate={experiment.design_spec.start_date}
                  endDate={experiment.design_spec.end_date}
                  datasource={datasourcesToName.get(experiment.datasource_id) || ''}
                  datasourceId={experiment.datasource_id}
                  participantType={experiment.design_spec.participant_type}
                  experimentId={experiment.design_spec.experiment_id!}
                  organizationId={currentOrgId}
                />
              ))}
            </Grid>
          )}
        </Flex>
      ) : null}
    </Flex>
  );
}
