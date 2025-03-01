import { Badge } from '@radix-ui/themes';

export const ExperimentStatusBadge = ({ status }: { status: string }) => {
  const colorMap: Record<
    string,
    { color: 'orange' | 'green' | 'gray' | 'blue' | 'red'; variant?: 'soft' | 'outline' }
  > = {
    ongoing: { color: 'orange' },
    completed: { color: 'green' },
    pending: { color: 'gray', variant: 'outline' },
    // ExperimentState types below
    designing: { color: 'blue', variant: 'soft' },
    assigned: { color: 'blue' },
    abandoned: { color: 'red', variant: 'outline' },
    committed: { color: 'green', variant: 'outline' },
    aborted: { color: 'red' },
  };

  const { color, variant = 'soft' } = colorMap[status];
  return (
    <Badge color={color} variant={variant}>
      {status}
    </Badge>
  );
};
