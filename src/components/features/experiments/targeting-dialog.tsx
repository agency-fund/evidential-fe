'use client';

import { useState } from 'react';
import { Box, Button, Dialog, Flex } from '@radix-ui/themes';
import {
  CMABExperimentSpecOutput,
  DesignSpecOutput,
  MABExperimentSpecOutput,
  OnlineFrequentistExperimentSpecOutput,
  PreassignedFrequentistExperimentSpecOutput,
} from '@/api/methods.schemas';
import { DatasourceTargetingSection } from '@/components/features/experiments/sections/datasource-targeting-section';
import { ContextsSection } from '@/components/features/experiments/sections/contexts-section';
import { OutcomesPriorSection } from '@/components/features/experiments/sections/outcomes-prior-section';
import { WebhooksSection } from '@/components/features/experiments/sections/webhooks-section';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';

interface TargetingDialogProps {
  designSpec: DesignSpecOutput;
  webhookIds: string[];
}

const isFrequentistSpec = (
  spec: DesignSpecOutput,
): spec is OnlineFrequentistExperimentSpecOutput | PreassignedFrequentistExperimentSpecOutput =>
  spec.experiment_type === 'freq_online' || spec.experiment_type === 'freq_preassigned';

const isBanditSpec = (spec: DesignSpecOutput): spec is MABExperimentSpecOutput | CMABExperimentSpecOutput =>
  spec.experiment_type === 'mab_online' || spec.experiment_type === 'cmab_online';

const isCmabSpec = (spec: DesignSpecOutput): spec is CMABExperimentSpecOutput => spec.experiment_type === 'cmab_online';

export function TargetingDialog({ designSpec, webhookIds }: TargetingDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button variant="ghost" color="blue">
          <MagnifyingGlassIcon /> Targeting
        </Button>
      </Dialog.Trigger>
      <Dialog.Content size="4" width="900px">
        <Flex direction="column" gap="3">
          <Dialog.Title>Targeting</Dialog.Title>
          <Box maxHeight="70vh" overflow="auto" pr="1">
            <Flex direction="column" gap="3">
              {isFrequentistSpec(designSpec) && (
                <DatasourceTargetingSection
                  tableName={designSpec.table_name}
                  primaryKey={designSpec.primary_key}
                  filters={designSpec.filters}
                />
              )}
              {isBanditSpec(designSpec) && (
                <OutcomesPriorSection priorType={designSpec.prior_type} rewardType={designSpec.reward_type} />
              )}
              {isCmabSpec(designSpec) && <ContextsSection contexts={designSpec.contexts ?? []} />}
              {webhookIds.length > 0 && <WebhooksSection webhookIds={webhookIds} />}
            </Flex>
          </Box>
          <Flex gap="3" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Close
              </Button>
            </Dialog.Close>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}