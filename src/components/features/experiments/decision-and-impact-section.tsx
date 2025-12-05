'use client';
import { SectionCard } from '@/components/ui/cards/section-card';
import { EditExperimentImpact } from '@/components/features/experiments/edit-experiment-impact';
import { ExperimentImpactBadge } from '@/components/features/experiments/experiment-impact-badge';
import { EditableTextArea } from '@/components/ui/inputs/editable-text-area';
import { ReadMoreText } from '@/components/ui/read-more-text';
import { useState, useEffect } from 'react';
import { Text, Flex, RadioCards, Button, TextArea } from '@radix-ui/themes';

const impactOptions = [
  { value: 'unclear', label: 'Unclear Impact', description: 'Not enough data to determine impact' },
  { value: 'negative', label: 'Negative Impact', description: 'Significant adverse effects observed' },
  { value: 'low', label: 'Low Impact', description: 'Minor positive effects observed' },
  { value: 'medium', label: 'Medium Impact', description: 'Moderate positive effects observed' },
  { value: 'high', label: 'High Impact', description: 'Significant positive effects observed' },
];

const IMPACT_HELP_TEXT =
  'Has the experiment unlocked key insights or triggered major decisions that have positively affected the program? Please do not confuse this with the treatment effect—inconclusive experiments can have big impact for organizations in terms of learning.';

const DECISION_HELP_TEXT = 'Briefly describe the key takeaways and decisions taken from this experiment';

interface DecisionAndImpactSectionProps {
  impact: string | null | undefined;
  decision: string | null | undefined;
  onUpdate: (updates: { impact?: string; decision?: string }) => Promise<void> | void;
}

interface FormData {
  impact: string;
  decision: string;
}

const defaultFormData = (impact: string | null | undefined, decision: string | null | undefined): FormData => ({
  impact: impact ?? '',
  decision: decision ?? '',
});

export function DecisionAndImpactSection({ impact, decision, onUpdate }: DecisionAndImpactSectionProps) {
  const [formData, setFormData] = useState<FormData>(defaultFormData(impact, decision));

  useEffect(() => {
    setFormData(defaultFormData(impact, decision));
  }, [impact, decision]);

  const canSave = formData.impact || formData.decision;

  const handleSave = async () => {
    await onUpdate({
      impact: formData.impact,
      decision: formData.decision,
    });
  };

  return (
    <SectionCard
      title="Decision and Impact"
      headerRight={
        impact && <EditExperimentImpact value={impact} onSubmit={(value) => onUpdate({ impact: value })} size="1" />
      }
    >
      {!impact ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <Flex direction="column" gap="4">
            <Flex direction="column" gap="3">
              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="bold">
                  Impact
                </Text>
                <Text as="p" size="1" color="gray">
                  {IMPACT_HELP_TEXT}
                </Text>
              </Flex>
              <RadioCards.Root
                columns={{ initial: '1', sm: '5' }}
                value={formData.impact}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, impact: val }))}
              >
                {impactOptions.map((option) => (
                  <RadioCards.Item key={option.value} value={option.value}>
                    <Flex direction="column" gap="2">
                      <ExperimentImpactBadge impact={option.value} size="3" />
                      <Text size="1" color="gray">
                        {option.description}
                      </Text>
                    </Flex>
                  </RadioCards.Item>
                ))}
              </RadioCards.Root>
            </Flex>

            <Flex direction="column" gap="3">
              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="bold">
                  Decision
                </Text>
                <Text size="1" color="gray">
                  {DECISION_HELP_TEXT}
                </Text>
              </Flex>
              <TextArea
                value={formData.decision}
                onChange={(e) => setFormData((prev) => ({ ...prev, decision: e.target.value }))}
                rows={4}
              />
            </Flex>

            <Flex justify="end" gap="3">
              <Button type="submit" disabled={!canSave}>
                Save
              </Button>
            </Flex>
          </Flex>
        </form>
      ) : (
        <EditableTextArea value={decision || ''} onSubmit={(value) => onUpdate({ decision: value })} size="2">
          <ReadMoreText text={decision || DECISION_HELP_TEXT} maxWords={30} />
        </EditableTextArea>
      )}
    </SectionCard>
  );
}
