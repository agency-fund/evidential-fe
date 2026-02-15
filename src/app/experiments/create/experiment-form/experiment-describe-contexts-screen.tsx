'use client';

import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData, ExperimentScreenId } from '@/app/experiments/create/experiment-form/experiment-form-def';
import { Box, Button, Card, Flex, Heading, IconButton, RadioCards, Text, TextArea, TextField } from '@radix-ui/themes';
import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';

import { ContextType } from '@/api/methods.schemas';
import { Context } from '@/app/experiments/create/experiment-form/experiment-form-types';

export type ExperimentDescribeContextsMessage =
  | { type: 'add-context' }
  | { type: 'remove-context'; index: number }
  | { type: 'update-context'; index: number; field: keyof Context; value: string };

interface ContextTypeOption {
  type: ContextType;
  title: string;
  description: string;
}

const CONTEXT_TYPE_OPTIONS: ContextTypeOption[] = [
  {
    type: 'binary',
    title: 'Binary',
    description: 'Yes/No outcomes: gender, adult or child, onboarded or not, etc.',
  },
  {
    type: 'real-valued',
    title: 'Real-valued',
    description: 'Continuous numeric outcomes: age, onboarding time, etc.',
  },
];

interface ContextCardProps {
  context: Context;
  contextIndex: number;
  canDelete: boolean;
  onUpdate: (updatedContext: Partial<Context>) => void;
  onDelete: () => void;
}

function ContextCard({ context, contextIndex, canDelete, onUpdate, onDelete }: ContextCardProps) {
  return (
    <Card>
      <Flex direction="column" gap="2">
        <Flex align="center" justify="between">
          <Text weight="bold" size="3">
            {`Context ${contextIndex + 1}`}
          </Text>
          <IconButton onClick={onDelete} disabled={!canDelete} color="red" variant="soft" size="1">
            <TrashIcon />
          </IconButton>
        </Flex>
      </Flex>

      <Flex direction="column" gap="1">
        <Box maxWidth={'50%'}>
          <Text as="label" size="2" weight="bold">
            Context Name
          </Text>
          <TextField.Root
            value={context.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Context Name"
            required
            mb="3"
          />
        </Box>
      </Flex>
      <Flex direction="column" gap="1">
        <Text as="label" size="2" weight="bold">
          Context Description
        </Text>
        <TextArea
          value={context.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Context Description"
          required
          mb="3"
        />
      </Flex>
      <Flex direction="column" gap="1">
        <Text as="label" size="2" weight="bold">
          Context Variable Type
        </Text>
        <Box maxWidth={'600px'}>
          <RadioCards.Root
            defaultValue={context.type}
            onValueChange={(value) => onUpdate({ type: value as ContextType })}
          >
            {CONTEXT_TYPE_OPTIONS.map((option) => (
              <RadioCards.Item key={option.type} value={option.type}>
                <Flex direction="column" width="100%">
                  <Text size="2" weight="bold">
                    {option.title}
                  </Text>
                  <Text size="1" weight="regular">
                    {option.description}
                  </Text>
                </Flex>
              </RadioCards.Item>
            ))}
          </RadioCards.Root>
        </Box>
      </Flex>
    </Card>
  );
}

export const ExperimentDescribeContextsScreen = ({
  data,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentDescribeContextsMessage, ExperimentScreenId>) => {
  const contexts = data.bandit?.experimentType === 'cmab_online' ? data.bandit.contexts : [];

  return (
    <>
      <Flex direction="column" gap={'3'}>
        <Heading as="h2" size="4">
          Define Context Variables
        </Heading>
        <Text size="2" color="gray">
          Define the context variables about the user that the algorithm will use to make personalized choices while
          assigning arms.
        </Text>

        <Flex direction="column" gap="3">
          {contexts.map((context, index) => (
            <ContextCard
              key={index}
              context={context}
              contextIndex={index}
              canDelete={contexts.length > 1}
              onUpdate={(updatedContext) => {
                Object.entries(updatedContext).forEach(([field, value]) => {
                  dispatch({ type: 'update-context', index, field: field as keyof Context, value: value as string });
                });
              }}
              onDelete={() => dispatch({ type: 'remove-context', index })}
            />
          ))}
          <Flex justify="center" mt="4">
            <Button onClick={() => dispatch({ type: 'add-context' })} variant="outline">
              <PlusIcon />
              Add Context
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </>
  );
};
