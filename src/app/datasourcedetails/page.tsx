'use client';
import { Callout, Flex, Heading, Text } from '@radix-ui/themes';
import { XSpinner } from '../components/x-spinner';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { ApiKeysSection } from './api-keys-section';
import { useGetDatasource, useInspectDatasource } from '@/api/admin';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { EditDatasourceDialog } from '@/app/organizationdetails/edit-datasource-dialog';
import { ParticipantTypesSection } from '@/app/datasourcedetails/participant-types-section';
import { useCurrentOrganization } from '@/app/providers/organization-provider';
import { useEffect } from 'react';
import { GenericErrorCallout } from '@/app/components/generic-error';

export default function Page() {
  const searchParams = useSearchParams();
  const datasourceId = searchParams.get('id');
  const orgContext = useCurrentOrganization();
  const currentOrgId = orgContext?.current?.id;
  const router = useRouter();

  const {
    data: datasourceMetadata,
    isLoading: datasourceDetailsLoading,
    error: datasourceError,
  } = useGetDatasource(datasourceId!, {
    swr: {
      enabled: datasourceId !== null,
    },
  });

  const {
    data: inspectDatasourceData,
    isLoading: inspectDatasourceLoading,
    error: inspectError,
  } = useInspectDatasource(
    datasourceId!,
    {},
    {
      swr: {
        enabled: datasourceId !== null,
      },
    },
  );

  // Redirect if datasource doesn't belong to current organization
  useEffect(() => {
    if (currentOrgId && datasourceMetadata && datasourceMetadata.organization_id !== currentOrgId) {
      // Redirect to home if datasource doesn't belong to current org
      router.push('/');
    }
  }, [currentOrgId, datasourceMetadata, router]);

  const isLoading = inspectDatasourceLoading || datasourceDetailsLoading;
  if (isLoading) {
    return <XSpinner message="Loading datasource details..." />;
  }
  if (!datasourceId) {
    return <Text>missing parameter</Text>;
  }
  if (inspectError) {
    return (
      <>
        <GenericErrorCallout title={'Failed to fetch datasource metadata'} error={inspectError} />
        <EditDatasourceDialog datasourceId={datasourceId} variant="button" />
      </>
    );
  }

  if (datasourceError) {
    return (
      <>
        <GenericErrorCallout title={'Failed to fetch datasource metadata'} error={datasourceError} />
        <EditDatasourceDialog datasourceId={datasourceId} variant="button" />
      </>
    );
  }

  if (!datasourceMetadata || !inspectDatasourceData) {
    return <Text>Error: Missing datasource metadata</Text>;
  }

  // We can safely use data properties now that we've handled all error cases
  const datasourceName = datasourceMetadata.name;
  const organizationName = datasourceMetadata.organization_name;
  const organizationId = datasourceMetadata.organization_id;
  return (
    <Flex direction="column" gap="3">
      <Heading>Datasource Details: {datasourceName}</Heading>
      <Text>
        Back to: <Link href={`/organizationdetails?id=${organizationId}`}>{organizationName}</Link>
      </Text>
      <Flex gap="3">
        <EditDatasourceDialog datasourceId={datasourceId} variant="button" />
      </Flex>
      {
        <>
          <Callout.Root color={'green'}>
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              Successfully connected to datasource ({inspectDatasourceData.tables.length} tables)
            </Callout.Text>
          </Callout.Root>
          {inspectDatasourceData.tables.length == 0 && (
            <Callout.Root color={'red'}>
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>Note: Expecting some tables? Check your connection settings.</Callout.Text>
            </Callout.Root>
          )}
        </>
      }
      <ParticipantTypesSection datasourceId={datasourceId} />
      <ApiKeysSection datasourceId={datasourceId} />
    </Flex>
  );
}
