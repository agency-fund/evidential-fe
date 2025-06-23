'use client';
import { Flex, Heading } from '@radix-ui/themes';
import { GearIcon } from '@radix-ui/react-icons';
import { useListOrganizationDatasources, useListOrganizationExperiments } from '@/api/admin';
import { XSpinner } from '@/components/ui/x-spinner';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { EmptyStateCard } from '@/components/ui/cards/empty-state-card';
import { useRouter } from 'next/navigation';
import { PRODUCT_NAME } from '@/services/constants';
import { CreateExperimentButton } from '@/components/features/experiments/create-experiment-button';
import ExperimentCards from '@/components/features/experiments/experiment-cards';

export default function Page() {
  const router = useRouter();
  const orgContext = useCurrentOrganization();
  const currentOrgId = orgContext!.current.id;

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

  if (datasourcesError) {
    return <GenericErrorCallout title={'Error with experiments list'} error={datasourcesError} />;
  }

  if (experimentsError) {
    return <GenericErrorCallout title={'Error with experiments list'} error={experimentsError} />;
  }

  const datasourcesToName = new Map(datasourcesData?.items.map((e) => [e.id, e.name]) || []);

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
      ) : (
        experimentsData && (
          <ExperimentCards 
            experiments={experimentsData}
            datasourcesToName={datasourcesToName}
            organizationId={currentOrgId}
            datasources={datasourcesData}
            datasourcesLoading={datasourcesIsLoading}
          />
        )
      )}
    </Flex>
  );
}
