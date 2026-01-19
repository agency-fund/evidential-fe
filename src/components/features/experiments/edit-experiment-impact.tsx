import { ExperimentImpactBadge } from '@/components/features/experiments/experiment-impact-badge';
import { EditableSelect } from '@/components/ui/inputs/editable-select';
import { Flex, Text } from '@radix-ui/themes';
import { Impact } from '@/api/methods.schemas';

import { IMPACT_LIST } from '@/services/impact-constants';

interface EditExperimentImpactProps {
  value?: Impact | null;
  onSubmit: (value: Impact) => Promise<void> | void;
  size?: '1' | '2' | '3';
}

const EDIT_IMPACT_OPTIONS = IMPACT_LIST.filter((c) => c.value !== '').map((c) => ({ label: c.label, value: c.value }));

export function EditExperimentImpact({ value, onSubmit, size = '2' }: EditExperimentImpactProps) {
  const normalizedValue = value || '';

  return (
    <EditableSelect
      value={normalizedValue}
      options={EDIT_IMPACT_OPTIONS}
      onSubmit={(v) => onSubmit(v as Impact)}
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
