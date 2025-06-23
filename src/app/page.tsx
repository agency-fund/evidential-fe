'use client';
import { Flex, Heading, Grid, TextField, Button } from '@radix-ui/themes';
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

type ExperimentStatus = 'all' | 'upcoming' | 'current' | 'finished';

export default function Page() {
  const router = useRouter();
  const orgContext = useCurrentOrganization();
  const currentOrgId = orgContext!.current.id;
  const [selectedStatus, setSelectedStatus] = useState<ExperimentStatus>('all');
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

  if (datasourcesError) {
    return <GenericErrorCallout title={'Error with experiments list'} error={datasourcesError} />;
  }

  if (experimentsError) {
    return <GenericErrorCallout title={'Error with experiments list'} error={experimentsError} />;
  }

  const datasourcesToName = new Map(datasourcesData?.items.map((e) => [e.id, e.name]) || []);

  // Helper function to determine experiment status based on dates
  const getExperimentStatus = (startDate: string, endDate: string): 'upcoming' | 'current' | 'finished' => {
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
        experimentsData && (() => {
          const committedExperiments = experimentsData.items.filter((experiment) => experiment.state === 'committed');

          // If no committed experiments, show create first experiment state
          if (committedExperiments.length === 0) {
            return (
              <EmptyStateCard
                title="Create your first experiment"
                description="Get started by creating your first experiment."
              >
                <CreateExperimentButton datasources={datasourcesData} loading={datasourcesIsLoading || false} />
              </EmptyStateCard>
            );
          }

          // Filter experiments by selected status and search query
          const filteredExperiments = committedExperiments.filter((experiment) => {
            const status = getExperimentStatus(
              experiment.design_spec.start_date,
              experiment.design_spec.end_date
            );
            
            const matchesStatus = selectedStatus === 'all' || status === selectedStatus;
            const matchesSearch = experiment.design_spec.experiment_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 experiment.design_spec.description.toLowerCase().includes(searchQuery.toLowerCase());
            
            return matchesStatus && matchesSearch;
          });

          // Count experiments by status for display
          const experimentCounts = {
            all: committedExperiments.length,
            upcoming: committedExperiments.filter(exp => getExperimentStatus(exp.design_spec.start_date, exp.design_spec.end_date) === 'upcoming').length,
            current: committedExperiments.filter(exp => getExperimentStatus(exp.design_spec.start_date, exp.design_spec.end_date) === 'current').length,
            finished: committedExperiments.filter(exp => getExperimentStatus(exp.design_spec.start_date, exp.design_spec.end_date) === 'finished').length,
          };

          return (
            <Flex direction="column" gap="4">
              {/* Search and Filter Controls */}
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
                  <Button 
                    variant={selectedStatus === 'all' ? 'solid' : 'soft'} 
                    onClick={() => setSelectedStatus('all')}
                  >
                    All ({experimentCounts.all})
                  </Button>
                  <Button 
                    variant={selectedStatus === 'upcoming' ? 'solid' : 'soft'} 
                    onClick={() => setSelectedStatus('upcoming')}
                  >
                    Upcoming ({experimentCounts.upcoming})
                  </Button>
                  <Button 
                    variant={selectedStatus === 'current' ? 'solid' : 'soft'} 
                    onClick={() => setSelectedStatus('current')}
                  >
                    Current ({experimentCounts.current})
                  </Button>
                  <Button 
                    variant={selectedStatus === 'finished' ? 'solid' : 'soft'} 
                    onClick={() => setSelectedStatus('finished')}
                  >
                    Finished ({experimentCounts.finished})
                  </Button>
                </Flex>
              </Flex>

              {/* Experiment Cards Grid */}
              {filteredExperiments.length === 0 ? (
                <EmptyStateCard
                  title={searchQuery ? 'No experiments found' : `No ${selectedStatus} experiments`}
                  description={searchQuery ? 'Try adjusting your search terms.' : `There are no ${selectedStatus} experiments to display.`}
                />
              ) : (
                <Grid columns={{ initial: "1", md: "2", lg: "3" }} gap="3">
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
          );
        })()
      )}
    </Flex>
  );
}
