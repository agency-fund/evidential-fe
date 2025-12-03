import { ExperimentImpactBadge } from '@/components/features/experiments/experiment-impact-badge';
import type { ExperimentImpact } from '@/components/features/experiments/types';
import { EditableSelect } from '@/components/ui/inputs/editable-select';
import { Flex, Text } from '@radix-ui/themes';

const IMPACT_OPTIONS: { label: string; value: ExperimentImpact }[] = [
  { label: 'High Impact', value: 'high' },
  { label: 'Medium Impact', value: 'medium' },
  { label: 'Low Impact', value: 'low' },
  { label: 'Negative Impact', value: 'negative' },
  { label: 'Unclear Impact', value: 'unclear' },
];

interface EditExperimentImpactProps {
  value?: ExperimentImpact | string | null;
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
          <ExperimentImpactBadge impact={value as ExperimentImpact} size={size}/>
        ) : (
          <Text size={size} color="gray">
            Choose impact
          </Text>
        )}
      </Flex>
    </EditableSelect>
  );
}
