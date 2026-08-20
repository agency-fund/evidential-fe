'use client';
import { SectionCard } from '@/components/ui/cards/section-card';
import { EditExperimentImpact } from '@/components/features/experiments/edit-experiment-impact';
import { ExperimentImpactBadge } from '@/components/features/experiments/experiment-impact-badge';
import { EditableTextArea } from '@/components/ui/inputs/editable-text-area';
import { ReadMoreText } from '@/components/ui/read-more-text';
import { useState } from 'react';
import { Button, Flex, RadioCards, Text, TextArea } from '@radix-ui/themes';
import { Impact } from '@/api/methods.schemas';
import { IMPACT_LIST } from '@/services/impact-constants';

const IMPACT_HELP_TEXT =
  'Has the experiment unlocked key insights or triggered major decisions that have positively affected the program? Please do not confuse this with the treatment effect—inconclusive experiments can have big impact for organizations in terms of learning.';

const DECISION_HELP_TEXT = 'Briefly describe the key takeaways and decisions taken from this experiment';

interface DecisionAndImpactSectionProps {
  impact: Impact | null | undefined;
  decision: string | null | undefined;
  onUpdate: (updates: { impact?: Impact; decision?: string }) => Promise<void> | void;
}

interface FormData {
  impact: Impact;
  decision: string;
}

const defaultFormData = (impact: Impact | null | undefined, decision: string | null | undefined): FormData => ({
  impact: impact ?? '',
  decision: decision ?? '',
});

type DecisionAndImpactFormProps = Pick<DecisionAndImpactSectionProps, 'decision' | 'onUpdate'>;

function DecisionAndImpactForm({ decision, onUpdate }: DecisionAndImpactFormProps) {
  const [formData, setFormData] = useState<FormData>(() => defaultFormData(null, decision));
  const canSave = formData.impact || formData.decision;

  const handleSave = async () => {
    await onUpdate({
      impact: formData.impact,
      decision: formData.decision,
    });
  };

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        await handleSave();
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
            onValueChange={(value) => setFormData((previous) => ({ ...previous, impact: value as Impact }))}
          >
            {IMPACT_LIST.filter((option) => option.value !== '').map((option) => (
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
            onChange={(event) => setFormData((previous) => ({ ...previous, decision: event.target.value }))}
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
  );
}

export function DecisionAndImpactSection({ impact, decision, onUpdate }: DecisionAndImpactSectionProps) {
  return (
    <SectionCard
      title="Decision and Impact"
      headerRight={
        impact && <EditExperimentImpact value={impact} onSubmit={(value) => onUpdate({ impact: value })} size="1" />
      }
    >
      {!impact ? (
        <DecisionAndImpactForm key={decision ?? ''} decision={decision} onUpdate={onUpdate} />
      ) : (
        <EditableTextArea value={decision || ''} onSubmit={(value) => onUpdate({ decision: value })} size="2">
          {decision ? <ReadMoreText text={decision} maxWords={30} /> : <Text color={'gray'}>{DECISION_HELP_TEXT}</Text>}
        </EditableTextArea>
      )}
    </SectionCard>
  );
}
