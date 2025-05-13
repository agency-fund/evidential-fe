import { Badge } from '@radix-ui/themes';

export const ExperimentStatusBadge = ({ status }: { status: string }) => {
  const colorMap: Record<
    string,
    { color: 'gray' | 'amber' | 'green' | 'lime' | 'blue' | 'red'; variant?: 'soft' | 'outline' }
  > = {
    // TODO: use these colors if the current date is after the start/end dates and it was committed.
    ongoing: { color: 'green' },
    completed: { color: 'lime' },
    // ExperimentState types below
    designing: { color: 'blue', variant: 'outline' },
    assigned: { color: 'blue', variant: 'outline' },
    abandoned: { color: 'gray', variant: 'outline' },
    committed: { color: 'green', variant: 'outline' },
    aborted: { color: 'red', variant: 'outline' },
  };

  const { color, variant = 'soft' } = colorMap[status];
  return (
    <Badge color={color} variant={variant}>
      {status}
    </Badge>
  );
};
