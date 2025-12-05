import { ExperimentImpactBadge } from '@/components/features/experiments/experiment-impact-badge';
import { EditableSelect } from '@/components/ui/inputs/editable-select';
import { Flex, Text } from '@radix-ui/themes';

const IMPACT_OPTIONS: { label: string; value: string }[] = [
  { label: 'High Impact', value: 'high' },
  { label: 'Medium Impact', value: 'medium' },
  { label: 'Low Impact', value: 'low' },
  { label: 'Negative Impact', value: 'negative' },
  { label: 'Unclear Impact', value: 'unclear' },
];

interface EditExperimentImpactProps {
  value?: string | null;
  onSubmit: (value: string) => Promise<void> | void;
  size?: '1' | '2' | '3';
}

export function EditExperimentImpact({ value, onSubmit, size = '2' }: EditExperimentImpactProps) {
  const normalizedValue = value || '';

  return (
    <EditableSelect
      value={normalizedValue}
      options={IMPACT_OPTIONS}
      onSubmit={onSubmit}
      size={size}
      placeholder="Choose impact"
    >
      <Flex align="center">
        {value ? (
          <ExperimentImpactBadge impact={value} size={size} />
        ) : (
          <Text size={size} color="gray">
            Choose impact
          </Text>
        )}
      </Flex>
    </EditableSelect>
  );
}
