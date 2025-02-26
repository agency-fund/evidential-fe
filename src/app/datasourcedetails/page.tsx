'use client';
import { Callout, Flex, Heading, Text } from '@radix-ui/themes';
import { XSpinner } from '../components/x-spinner';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { ApiKeysSection } from './api-keys-section';
import { useGetDatasource, useInspectDatasource } from '@/api/admin';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { EditDatasourceDialog } from '@/app/organizationdetails/edit-datasource-dialog';
import { isHttpOk } from '@/services/typehelper';
import { FailedToConnectToDatasource } from '@/app/datasourcedetails/failed-to-connect-to-datasource';
import { ParticipantTypesSection } from '@/app/datasourcedetails/participant-types-section';

export default function Page() {
  const searchParams = useSearchParams();
  const datasourceId = searchParams.get('id');
  const { data: datasourceMetadata, isLoading: datasourceDetailsLoading } = useGetDatasource(datasourceId!, {
    swr: {
      enabled: datasourceId !== null,
    },
  });
  const { data: inspectDatasourceData, isLoading: inspectDatasourceLoading } = useInspectDatasource(
    datasourceId!,
    {},
    {
      swr: {
        enabled: datasourceId !== null,
      },
    },
  );
  const isLoading = inspectDatasourceLoading || datasourceDetailsLoading;
  if (isLoading) {
    return <XSpinner message="Loading datasource details..." />;
  }
  if (!datasourceId) {
    return <Text>missing parameter</Text>;
  }
  if (datasourceMetadata === undefined) {
    return <Text>Unknown error reading datasource metadata.</Text>;
  }
  if (inspectDatasourceData === undefined) {
    return <Text>Unknown error inspecting the datasource.</Text>;
  }
  if (!isHttpOk(inspectDatasourceData)) {
    return (
      <Flex direction="column" gap="3">
        <Heading>Error fetching datasource metadata</Heading>
        <FailedToConnectToDatasource data={inspectDatasourceData!} datasourceId={datasourceId!} />
      </Flex>
    );
  }
  if (!isHttpOk(datasourceMetadata)) {
    return (
      <Flex direction="column" gap="3">
        <Heading>Error reading tables from datasource</Heading>
        <FailedToConnectToDatasource data={datasourceMetadata} datasourceId={datasourceId!} />
      </Flex>
    );
  }

  const datasourceName = datasourceMetadata.data.name;
  const organizationName = datasourceMetadata.data.organization_name;
  const organizationId = datasourceMetadata.data.organization_id;
  return (
    <Flex direction="column" gap="3">
      <Heading>Datasource Details: {datasourceName}</Heading>
      <Text>
        Back to: <Link href={`/organizationdetails?id=${organizationId}`}>{organizationName}</Link>
      </Text>
      <Flex gap="3">
        <EditDatasourceDialog datasourceId={datasourceId} variant="button" />
      </Flex>
      {inspectDatasourceData.status !== 200 ? (
        <FailedToConnectToDatasource data={inspectDatasourceData} datasourceId={datasourceId} />
      ) : (
        <>
          <Callout.Root color={'green'}>
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              Successfully connected to datasource ({inspectDatasourceData.data.tables.length} tables)
            </Callout.Text>
          </Callout.Root>
          {inspectDatasourceData.data.tables.length == 0 && (
            <Callout.Root color={'red'}>
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>Note: Expecting some tables? Check your connection settings.</Callout.Text>
            </Callout.Root>
          )}
        </>
      )}
      <ParticipantTypesSection datasourceId={datasourceId} />
      <ApiKeysSection datasourceId={datasourceId} />
    </Flex>
  );
}
