'use client';
import { Callout, Flex, Heading, Text } from '@radix-ui/themes';
import { XSpinner } from '../../components/ui/x-spinner';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { ApiKeysSection } from '@/app/components/features/datasources/api-keys-section';
import { useGetDatasource, useInspectDatasource } from '@/api/admin';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { EditDatasourceDialog } from '@/app/components/features/datasources/edit-datasource-dialog';
import { ParticipantTypesSection } from '@/app/components/features/participants/participant-types-section';
import { useCurrentOrganization } from '@/app/providers/organization-provider';
import { useEffect, useState } from 'react';
import { GenericErrorCallout } from '@/app/components/ui/generic-error';

export default function Page() {
  const params = useParams();
  const datasourceId = params.datasourceId as string;
  const orgContext = useCurrentOrganization();
  const currentOrgId = orgContext?.current?.id;
  const router = useRouter();
  // State to pause some SWR requests when the dialog is open, which would otherwise inadvertently close the dialog.
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [wasDialogOpen, setWasDialogOpen] = useState(false);

  const {
    data: datasourceMetadata,
    isLoading: datasourceDetailsLoading,
    error: datasourceError,
  } = useGetDatasource(datasourceId!, {
    swr: {
      enabled: datasourceId !== null,
      isPaused: () => isDialogOpen,
    },
  });

  const {
    data: inspectDatasourceData,
    isLoading: inspectDatasourceLoading,
    error: inspectError,
    mutate: mutateInspect,
  } = useInspectDatasource(
    datasourceId!,
    {},
    {
      swr: {
        enabled: datasourceId !== null,
        // Don't trigger the inspection if we're possibly editing the datasource.
        isPaused: () => isDialogOpen,
      },
    },
  );

  // Only trigger revalidation when dialog transitions from open to closed,
  // while avoiding the initial load triggering a revalidation.
  useEffect(() => {
    if (datasourceId && wasDialogOpen && !isDialogOpen) {
      mutateInspect();
    }
    // Update previous state for next render
    setWasDialogOpen(isDialogOpen);
  }, [datasourceId, isDialogOpen, wasDialogOpen, mutateInspect]);

  // Redirect if datasource doesn't belong to current organization
  useEffect(() => {
    if (currentOrgId && datasourceMetadata && datasourceMetadata.organization_id !== currentOrgId) {
      // Redirect to home if datasource doesn't belong to current org
      router.push('/');
    }
  }, [currentOrgId, datasourceMetadata, router]);

  const isLoading = inspectDatasourceLoading || datasourceDetailsLoading;

  const editDatasourceDialogComponent = (
    <EditDatasourceDialog datasourceId={datasourceId!} variant="button" onOpenChange={setIsDialogOpen} />
  );

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

  // We can safely use data properties now that we've handled all error cases
  const datasourceName = datasourceMetadata.name;
  const organizationName = datasourceMetadata.organization_name;
  const organizationId = datasourceMetadata.organization_id;
  return (
    <Flex direction="column" gap="3">
      <Heading>Datasource Details: {datasourceName}</Heading>
      <Text>
        Back to: <Link href={`/organizations/${organizationId}`}>{organizationName}</Link>
      </Text>
      <Flex gap="3">{editDatasourceDialogComponent}</Flex>
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
