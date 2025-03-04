'use client';
import { Button, Flex, Heading, Table, Text } from '@radix-ui/themes';
import Link from 'next/link';
import { PlusIcon } from '@radix-ui/react-icons';
import { DownloadAssignmentsCsvButton } from './download-assignments-csv-button';
import { useListOrganizationDatasources, useListExperiments } from '@/api/admin';
import { DeleteExperimentButton } from './delete-experiment-button';
import { XSpinner } from '@/app/components/x-spinner';
import { isHttpOk } from '@/services/typehelper';
import { GenericErrorCallout } from '@/app/components/generic-error';
import { useEffect, useState } from 'react';
import { DatasourceSelector } from '@/app/experiments/datasource-selector';
import { ExperimentStatusBadge } from '@/app/experiments/experiment-status-badge';
import { useCurrentOrganization } from '@/app/providers/organization-provider';

export default function Page() {
  // Get the current organization from context
  const orgContext = useCurrentOrganization();
  const currentOrgId = orgContext?.current?.id;

  // Fetch datasources for the current organization
  const {
    data: datasourcesData,
    isLoading: datasourcesIsLoading,
    error: datasourcesError,
    mutate: refreshDatasources
  } = useListOrganizationDatasources(currentOrgId!, {
    swr: {
      enabled: !!currentOrgId,
      revalidateOnFocus: true
    }
  });

  const [selectedDatasource, setSelectedDatasource] = useState<string>('');
  const {
    data: experimentsData,
    isLoading: experimentsIsLoading,
    error: experimentsError
  } = useListExperiments(selectedDatasource!, {
    swr: { enabled: selectedDatasource !== '' },
  });

  // Set the selected datasource to the first one in the list when data loads
  useEffect(() => {
    if (
      datasourcesData &&
      isHttpOk(datasourcesData) &&
      datasourcesData.data.items.length > 0 &&
      selectedDatasource === ''
    ) {
      setSelectedDatasource(datasourcesData.data.items[0].id);
    }
  }, [datasourcesData, selectedDatasource]);

  // Refresh datasources when organization changes
  useEffect(() => {
    if (currentOrgId) {
      refreshDatasources();
      // Reset selected datasource when org changes
      setSelectedDatasource('');
    }
  }, [currentOrgId, refreshDatasources]);

  if (datasourcesError || (datasourcesData !== undefined && !isHttpOk(datasourcesData))) {
    return <GenericErrorCallout title={'Error with experiments list'} message={JSON.stringify(datasourcesData)} />;
  }

  if (experimentsError || (experimentsData !== undefined && !isHttpOk(experimentsData))) {
    return <GenericErrorCallout title={'Error with experiments list'} message={JSON.stringify(experimentsData)} />;
  }

  return (
    <Flex direction="column" gap="3">
      {datasourcesIsLoading && <XSpinner message={'Datasources list loading...'} />}
      {datasourcesData && isHttpOk(datasourcesData) && (
        <DatasourceSelector
          selectedDatasource={selectedDatasource}
          setSelectedDatasource={setSelectedDatasource}
          datasourcesData={datasourcesData}
        />
      )}
      <Flex justify="between" align="center">
        <Heading>Experiments</Heading>
        <Button asChild disabled={selectedDatasource === ''}>
          <Link href={`/experiments/create?datasource_id=${selectedDatasource}`}>
            <PlusIcon /> Create Experiment
          </Link>
        </Button>
      </Flex>
      {experimentsIsLoading && (
        <Flex>
          <XSpinner message={'Loading experiments list...'} />
        </Flex>
      )}
      {experimentsData !== undefined && isHttpOk(experimentsData) && (
        <Flex>
          {experimentsData.data.items.length === 0 && (
            <Flex>
              <Text>There are no experiments. Create one!</Text>
            </Flex>
          )}
          {experimentsData.data.items.length ? (
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Start Date</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>End Date</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell width="30%">Hypothesis</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {experimentsData.data.items.map((experiment) => (
                  <Table.Row key={experiment.design_spec.experiment_id}>
                    <Table.Cell>{experiment.design_spec.experiment_name}</Table.Cell>
                    <Table.Cell>
                      <ExperimentStatusBadge status={experiment.state} />
                    </Table.Cell>
                    <Table.Cell>{experiment.design_spec.start_date}</Table.Cell>
                    <Table.Cell>{experiment.design_spec.end_date}</Table.Cell>
                    <Table.Cell>{experiment.design_spec.description}</Table.Cell>
                    <Table.Cell>
                      <Flex direction={'row'} gap={'2'}>
                        <Button variant="soft" size="1">
                          View
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
          ) : null}
        </Flex>
      )}
    </Flex>
  );
}
