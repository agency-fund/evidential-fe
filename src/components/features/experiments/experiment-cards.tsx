import { Flex, Grid, SegmentedControl } from "@radix-ui/themes";
import { useState } from 'react';
import ExperimentCard from './experiment-card';
import { EmptyStateCard } from '@/components/ui/cards/empty-state-card';
import { CreateExperimentButton } from './create-experiment-button';

type ExperimentStatus = 'current' | 'upcoming' | 'past';

interface ExperimentCardsProps {
  experiments: NonNullable<ReturnType<typeof import('@/api/admin').useListOrganizationExperiments>['data']>;
  datasourcesToName: Map<string, string>;
  organizationId: string;
  datasources?: NonNullable<ReturnType<typeof import('@/api/admin').useListOrganizationDatasources>['data']>;
  datasourcesLoading?: boolean;
}

export default function ExperimentCards({ experiments, datasourcesToName, organizationId, datasources, datasourcesLoading }: ExperimentCardsProps) {
  const [selectedStatus, setSelectedStatus] = useState<ExperimentStatus>('current');

  // Helper function to determine experiment status based on dates
  const getExperimentStatus = (startDate: string, endDate: string): ExperimentStatus => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) {
      return 'upcoming';
    } else if (now > end) {
      return 'past';
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

  // Filter experiments by selected status
  const filteredExperiments = committedExperiments.filter((experiment) => {
    const status = getExperimentStatus(
      experiment.design_spec.start_date,
      experiment.design_spec.end_date
    );
    return status === selectedStatus;
  });

  // Count experiments by status for display
  const experimentCounts = {
    current: committedExperiments.filter(exp => getExperimentStatus(exp.design_spec.start_date, exp.design_spec.end_date) === 'current').length,
    upcoming: committedExperiments.filter(exp => getExperimentStatus(exp.design_spec.start_date, exp.design_spec.end_date) === 'upcoming').length,
    past: committedExperiments.filter(exp => getExperimentStatus(exp.design_spec.start_date, exp.design_spec.end_date) === 'past').length,
  };

  return (
    <Flex direction="column" gap="4">
      {/* Segmented Control for Filtering */}
      <SegmentedControl.Root value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as ExperimentStatus)}>
        <SegmentedControl.Item value="current">
          Current ({experimentCounts.current})
        </SegmentedControl.Item>
        <SegmentedControl.Item value="upcoming">
          Upcoming ({experimentCounts.upcoming})
        </SegmentedControl.Item>
        <SegmentedControl.Item value="past">
          Past ({experimentCounts.past})
        </SegmentedControl.Item>
      </SegmentedControl.Root>

      {/* Experiment Cards Grid */}
      {filteredExperiments.length === 0 ? (
        <EmptyStateCard
          title={`No ${selectedStatus} experiments`}
          description={`There are no ${selectedStatus} experiments to display.`}
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