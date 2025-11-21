'use client';
import { Callout, Flex, Heading, Text } from '@radix-ui/themes';
import { XSpinner } from '@/components/ui/x-spinner';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { ApiKeysTable } from '@/components/features/datasources/api-keys-table';
import { useGetDatasource, useInspectDatasource } from '@/api/admin';
import { useParams, useRouter } from 'next/navigation';
import { EditDatasourceDialog } from '@/components/features/datasources/edit-datasource-dialog';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { useEffect } from 'react';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import { ParticipantTypesSection } from '@/components/features/participants/participant-types-section';

export default function Page() {
  const params = useParams();
  const datasourceId = params.datasourceId as string;
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
  } = useInspectDatasource(datasourceId!, undefined, {
    swr: {
      enabled: datasourceId !== null,
    },
  });

  const isLoading = inspectDatasourceLoading || datasourceDetailsLoading;
  const datasourceName = datasourceMetadata?.name;
  const isNoDWH = datasourceMetadata?.dsn.type === 'api_only';
  const editDatasourceDialogComponent = <EditDatasourceDialog datasourceId={datasourceId!} variant="button" />;

  // Redirect if datasource doesn't belong to current organization
  useEffect(() => {
    if (currentOrgId && datasourceMetadata && datasourceMetadata.organization_id !== currentOrgId) {
      // Redirect to home if datasource doesn't belong to current org
      router.push('/');
    }
  }, [currentOrgId, datasourceMetadata, router]);

  if (isLoading) {
    return <XSpinner message="Loading datasource details..." />;
  }

  if (!datasourceId) {
    return <Text>missing parameter</Text>;
  }

  if (datasourceError) {
    return (
      <>
        <GenericErrorCallout title={'Failed to fetch datasource metadata'} error={datasourceError} />
        {editDatasourceDialogComponent}
      </>
    );
  }

  if (inspectError) {
    return (
      <>
        <GenericErrorCallout title={'Failed to inspect datasource'} error={inspectError} />
        {editDatasourceDialogComponent}
      </>
    );
  }

  if (!datasourceMetadata || !inspectDatasourceData) {
    return <Text>Error: Missing datasource or table metadata</Text>;
  }

  return (
    <Flex direction="column" gap="6">
      <Flex align="start" direction="column" gap="3">
        <Flex justify="between" align="end" width="100%">
          <Flex direction="row" align="center" gap="2">
            <Heading size="8">Datasource: {datasourceName}</Heading>
            <CopyToClipBoard content={datasourceId} />
          </Flex>
          {editDatasourceDialogComponent}
        </Flex>
      </Flex>

      {!isNoDWH && (
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
      )}
      <ApiKeysTable datasourceId={datasourceId} />
      <ParticipantTypesSection datasourceId={datasourceId} />
    </Flex>
  );
}
