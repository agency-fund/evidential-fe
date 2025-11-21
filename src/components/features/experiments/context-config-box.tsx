import { Badge, Box, Button, Card, Dialog, Flex, Heading, Popover, Text, TextField } from '@radix-ui/themes';
import { Pencil1Icon } from '@radix-ui/react-icons';
import React, { useState } from 'react';
import { ContextInput, Context } from '@/api/methods.schemas';
import { s } from 'motion/react-client';

interface ContextConfigDialogProps {
  analysisKey: string;
  contexts: Context[];
  contextValues: ContextInput[];
  onUpdate: (key: string, context_inputs: ContextInput[]) => void;
}

export function ContextConfigBox({ analysisKey, contexts, contextValues, onUpdate }: ContextConfigDialogProps) {
  const [open, setOpen] = useState(false);
  // Sort contexts and contextValues by context_id to ensure consistent ordering
  const sortedContexts = [...contexts].sort((a, b) => (a.context_id ?? '').localeCompare(b.context_id ?? ''));
  const sortedContextValues = [...contextValues].sort((a, b) => (a.context_id ?? '').localeCompare(b.context_id ?? ''));
  const [newContextValues, setNewContextValues] = useState<ContextInput[]>(sortedContextValues);

  return (
    <Dialog.Root open={analysisKey === 'live' ? open : false} onOpenChange={(isOpen) => setOpen(isOpen)}>
      <Dialog.Trigger disabled={analysisKey !== 'live'}>
        <Badge
          size="2"
          style={{ cursor: analysisKey === 'live' ? 'pointer' : 'not-allowed' }}
          className="hover:opacity-80"
        >
          <Heading size="2">Contexts:</Heading>
          <Flex gap="2" align="center">
            {sortedContexts.map((context, index) => (
              <React.Fragment key={context.context_id}>
                <Text>
                  {context.context_name}: {sortedContextValues[index]?.context_value}
                </Text>
                <Text color="gray">|</Text>
              </React.Fragment>
            ))}
            <Pencil1Icon width="14" height="14" />
          </Flex>
        </Badge>
      </Dialog.Trigger>
      <Dialog.Content size="3" width="fit-content" onOpenAutoFocus={(e) => e.preventDefault()}>
        <Flex direction="column" gap="5">
          <Dialog.Title size="2">Context Value Configuration</Dialog.Title>
          <Flex direction="column" gap="4" mt="4">
            {sortedContexts.map((context, index) => (
              <React.Fragment key={context.context_id}>
                <Flex align="center" gap="3" justify="between">
                  <Flex gap="2" align="center" style={{ flex: 1 }}>
                    <Text size="2" weight="medium">
                      {context.context_name}
                    </Text>
                    <Text size="1" color="gray">
                      {context.value_type}
                    </Text>
                  </Flex>
                  <TextField.Root
                    type="number"
                    size="2"
                    value={newContextValues[index]?.context_value ?? ''}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      const tempNewContextValues = [...newContextValues];
                      if (inputValue === '') {
                        tempNewContextValues[index] = {
                          ...tempNewContextValues[index],
                          context_value: undefined,
                        };
                      } else {
                        const rawValue = Number(inputValue);
                        const minVal = context.value_type === 'binary' ? 0 : -1000000;
                        const maxVal = context.value_type === 'binary' ? 1 : 1000000;
                        const clampedValue = Math.max(minVal, Math.min(maxVal, rawValue));
                        tempNewContextValues[index] = {
                          ...tempNewContextValues[index],
                          context_value: clampedValue,
                        };
                      }
                      setNewContextValues(tempNewContextValues);
                    }}
                  />
                </Flex>
              </React.Fragment>
            ))}
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" onClick={() => setNewContextValues(sortedContextValues)}>
                Cancel
              </Button>
            </Dialog.Close>
            <Dialog.Close>
              <Button onClick={() => onUpdate(analysisKey, newContextValues)}>Update</Button>
            </Dialog.Close>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
