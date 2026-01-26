'use client';
import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData } from '@/app/experiments/create/experiment-form/experiment-form-def';
import { Box, Button, Flex, Separator, Text, TextArea, TextField } from '@radix-ui/themes';
import { WizardBreadcrumbs } from '@/services/wizard/wizard-breadcrumbs-context';
import { SelectWebhooksSection } from '@/app/experiments/create/experiment-form/select-webhooks-section';
import { Collapsible } from 'radix-ui';
import { ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { useState } from 'react';

export type ExperimentMetadataMessages =
  | { type: 'set-name'; value: string }
  | { type: 'set-hypothesis'; value: string }
  | { type: 'set-design-url'; value: string }
  | { type: 'set-start-date'; value: string }
  | { type: 'set-end-date'; value: string }
  | { type: 'set-webhook-ids'; value: string[] };

export const ExperimentMetadataScreen = ({
  data,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentMetadataMessages>) => {
  const [webhooksOpen, setWebhooksOpen] = useState(false);

  return (
    <Flex direction="column" gap={'3'}>
      <WizardBreadcrumbs />
      <Box>
        <Text as="label" size="2" weight="bold" mb="6px">
          Experiment Name
        </Text>
        <TextField.Root
          placeholder="Enter experiment name"
          value={data.name}
          onChange={(e) => dispatch({ type: 'set-name', value: e.target.value })}
        />
      </Box>

      <Box>
        <Text as="label" size="2" weight="bold" mb="6px">
          Hypothesis
        </Text>
        <TextArea
          placeholder="Describe your hypothesis..."
          value={data.hypothesis}
          onChange={(e) => dispatch({ type: 'set-hypothesis', value: e.target.value })}
          rows={3}
        />
      </Box>

      <Flex gap="4">
        <Box>
          <Text as="label" size="2" weight="bold" mb="6px">
            Start Date
          </Text>
          <TextField.Root
            type="date"
            value={data.startDate || ''}
            onChange={(e) => dispatch({ type: 'set-start-date', value: e.target.value })}
          />
        </Box>
        <Box>
          <Text as="label" size="2" weight="bold" mb="6px">
            End Date
          </Text>
          <TextField.Root
            type="date"
            value={data.endDate || ''}
            onChange={(e) => dispatch({ type: 'set-end-date', value: e.target.value })}
          />
        </Box>
      </Flex>

      <Box>
        <Text as="label" size="2" weight="bold" mb="6px">
          Design Document URL (optional)
        </Text>
        <TextField.Root
          value={data.designUrl || ''}
          onChange={(e) => dispatch({ type: 'set-design-url', value: e.target.value })}
          placeholder="https://docs.google.com/document/..."
        />
      </Box>

      <Separator size="4" my="3" />

      <Collapsible.Root open={webhooksOpen} onOpenChange={setWebhooksOpen}>
        <Collapsible.Trigger asChild>
          <Button variant={'ghost'} style={{ backgroundColor: 'unset' }}>
            <>{webhooksOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}Advanced: Webhooks</>
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content asChild>
          <Flex direction={'column'} gap={'3'} ml={'20px'}>
            <SelectWebhooksSection
              selectedWebhookIds={data.selectedWebhookIds ?? []}
              onWebhookIdsChange={(ids) => dispatch({ type: 'set-webhook-ids', value: ids })}
            />
          </Flex>
        </Collapsible.Content>
      </Collapsible.Root>
    </Flex>
  );
};
