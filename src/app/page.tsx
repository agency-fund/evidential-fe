'use client';
import { Button, Flex, Heading, Table } from '@radix-ui/themes';
import { GearIcon, PlusIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { DownloadAssignmentsCsvButton } from '@/components/features/experiments/download-assignments-csv-button';
import { useListExperiments, useListOrganizationDatasources } from '@/api/admin';
import { DeleteExperimentButton } from '@/components/features/experiments/delete-experiment-button';
import { XSpinner } from '@/components/ui/x-spinner';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { useEffect, useState } from 'react';
import { DatasourceSelector } from '@/components/features/datasources/datasource-selector';
import { ExperimentTypeBadge } from '@/components/features/experiments/experiment-type-badge';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { EmptyStateCard } from '@/components/ui/cards/empty-state-card';
import { useRouter } from 'next/navigation';
import { PRODUCT_NAME } from '@/services/constants';
import { ReadMoreText } from '@/components/ui/read-more-text';
export default function Page() {
  const router = useRouter();
  // Get the current organization from context
  const orgContext = useCurrentOrganization();
  const currentOrgId = orgContext?.current?.id;

  // Fetch datasources for the current organization
  const {
    data: datasourcesData,
    isLoading: datasourcesIsLoading,
    error: datasourcesError,
  } = useListOrganizationDatasources(currentOrgId!, {
    swr: {
      enabled: !!currentOrgId,
      revalidateOnFocus: true,
    },
  });

  const [selectedDatasource, setSelectedDatasource] = useState<string>('');
  const {
    data: experimentsData,
    isLoading: experimentsIsLoading,
    error: experimentsError,
  } = useListExperiments(selectedDatasource!, {
    swr: { enabled: selectedDatasource !== '' },
  });

  const filteredExperiments = experimentsData
    ? experimentsData.items.filter((experiment) => experiment.state === 'committed')
    : [];

  // Set the selected datasource to the first one in the list when data loads
  useEffect(() => {
    if (datasourcesData && datasourcesData.items.length > 0 && selectedDatasource === '') {
      setSelectedDatasource(datasourcesData.items[0].id);
    }
  }, [datasourcesData, selectedDatasource]);

  if (datasourcesError) {
    return <GenericErrorCallout title={'Error with experiments list'} error={datasourcesError} />;
  }

  if (experimentsError) {
    return <GenericErrorCallout title={'Error with experiments list'} error={experimentsError} />;
  }

  return (
    <Flex direction="column" gap="3">
      {datasourcesIsLoading && <XSpinner message={'Datasources list loading...'} />}
      {datasourcesData && datasourcesData.items.length > 0 && (
        <DatasourceSelector
          selectedDatasource={selectedDatasource}
          setSelectedDatasource={setSelectedDatasource}
          datasourcesData={datasourcesData}
        />
      )}
      <Flex justify="between" align="center">
        <Heading>Experiments</Heading>
        <Link href={`/datasources/${selectedDatasource}/experiments/create`}>
          <Button disabled={selectedDatasource === ''}>
            <PlusIcon /> Create Experiment
          </Button>
        </Link>
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
      ) : (
        experimentsData !== undefined && (
          <Flex direction="column" gap="3">
            {filteredExperiments.length === 0 ? (
              <EmptyStateCard
                title="Create your first experiment"
                description="Get started by creating your first experiment."
                buttonText="Create Experiment"
                buttonIcon={<PlusIcon />}
                onClick={() => router.push(`/datasources/${selectedDatasource}/experiments/create`)}
              />
            ) : (
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Participants</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Start Date</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>End Date</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell width="30%">Hypothesis</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {filteredExperiments.map((experiment) => (
                    <Table.Row key={experiment.design_spec.experiment_id}>
                      <Table.Cell>{experiment.design_spec.experiment_name}</Table.Cell>
                      <Table.Cell>{experiment.design_spec.participant_type}</Table.Cell>
                      <Table.Cell>
                        <ExperimentTypeBadge type={experiment.design_spec.experiment_type} />
                      </Table.Cell>
                      <Table.Cell>{new Date(experiment.design_spec.start_date).toLocaleDateString()}</Table.Cell>
                      <Table.Cell>{new Date(experiment.design_spec.end_date).toLocaleDateString()}</Table.Cell>
                      <Table.Cell>
                        <ReadMoreText text={experiment.design_spec.description} />
                      </Table.Cell>
                      <Table.Cell>
                        <Flex direction={'row'} gap={'2'}>
                          <Button variant="soft" size="1" asChild>
                            <Link
                              href={`/datasources/${selectedDatasource}/experiments/${experiment.design_spec.experiment_id}`}
                            >
                              View
                            </Link>
                          </Button>
                          <DownloadAssignmentsCsvButton
                            datasourceId={selectedDatasource}
                            experimentId={experiment.design_spec.experiment_id!}
                          />
                          <DeleteExperimentButton
                            datasourceId={selectedDatasource}
                            experimentId={experiment.design_spec.experiment_id!}
                          />
                        </Flex>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            )}

          </Flex>
        )
      )}
    </Flex>
  );
}
