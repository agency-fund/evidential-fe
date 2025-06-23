import { Flex, Grid, SegmentedControl, TextField, Button } from "@radix-ui/themes";
import { useState } from 'react';
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import ExperimentCard from './experiment-card';
import { EmptyStateCard } from '@/components/ui/cards/empty-state-card';
import { CreateExperimentButton } from './create-experiment-button';

type ExperimentStatus = 'all' | 'upcoming' | 'current' | 'finished';

interface ExperimentCardsProps {
  experiments: NonNullable<ReturnType<typeof import('@/api/admin').useListOrganizationExperiments>['data']>;
  datasourcesToName: Map<string, string>;
  organizationId: string;
  datasources?: NonNullable<ReturnType<typeof import('@/api/admin').useListOrganizationDatasources>['data']>;
  datasourcesLoading?: boolean;
}

export default function ExperimentCards({ experiments, datasourcesToName, organizationId, datasources, datasourcesLoading }: ExperimentCardsProps) {
  const [selectedStatus, setSelectedStatus] = useState<ExperimentStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  const committedExperiments = experiments.items.filter((experiment) => experiment.state === 'committed');

  // If no committed experiments, show create first experiment state
  if (committedExperiments.length === 0) {
    return (
      <EmptyStateCard
        title="Create your first experiment"
        description="Get started by creating your first experiment."
      >
        <CreateExperimentButton datasources={datasources} loading={datasourcesLoading || false} />
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
              organizationId={organizationId}
            />
          ))}
        </Grid>
      )}
    </Flex>
  );
} 