import { Badge } from '@radix-ui/themes';

export type ExperimentStatus = 'current' | 'upcoming' | 'finished';

interface ExperimentStatusBadgeProps {
  status: ExperimentStatus;
}

const statusConfig: Record<ExperimentStatus, { label: string; color: 'green' | 'gray' | 'blue' }> = {
  current: { label: 'Current', color: 'green' },
  upcoming: { label: 'Upcoming', color: 'gray' },
  finished: { label: 'Finished', color: 'blue' },
};

export function ExperimentStatusBadge({ status }: ExperimentStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge color={config.color} variant="soft">
      {config.label}
    </Badge>
  );
}
