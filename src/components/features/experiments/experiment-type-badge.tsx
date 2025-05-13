import { Badge } from '@radix-ui/themes';

export const ExperimentTypeBadge = ({ type }: { type: string }) => {
  const colorMap: Record<
    string,
    { color: 'green' | 'blue' | 'red'; variant?: 'soft' | 'outline' }
  > = {
    preassigned: { color: 'blue' },
    online: { color: 'green' },
    unknown: { color: 'red', variant: 'outline' },
  };

  const { color, variant = 'soft' } = colorMap[type] || colorMap.unknown;
  return (
    <Badge color={color} variant={variant}>
      {type}
    </Badge>
  );
};
