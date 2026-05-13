'use client';

import { useState } from 'react';
import { Box, Button, Dialog, Flex } from '@radix-ui/themes';
import { BarChartIcon } from '@radix-ui/react-icons';
import { AssignSummary } from '@/api/methods.schemas';
import { PowerBalanceSection } from '@/components/features/experiments/sections/power-balance-section';

interface PowerAndBalanceDialogProps {
  confidence: number;
  power: number;
  desiredN?: number;
  assignSummary: AssignSummary | null | undefined;
  /** Design effect (DEFF) from the power analysis — cluster experiments only. */
  designEffect?: number | null;
  /** Total clusters needed across all arms — cluster experiments only. */
  numClustersTotal?: number | null;
}

export function PowerAndBalanceDialog({
  confidence,
  power,
  desiredN,
  assignSummary,
  designEffect,
  numClustersTotal,
}: PowerAndBalanceDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button variant="ghost" color="blue">
          <BarChartIcon /> Power/Balance
        </Button>
      </Dialog.Trigger>
      <Dialog.Content size="4" width="700px">
        <Flex direction="column" gap="3">
          <Dialog.Title>Power & Balance</Dialog.Title>
          <Box maxHeight="70vh" overflow="auto" pr="1">
            <PowerBalanceSection
              confidence={confidence}
              power={power}
              desiredN={desiredN}
              assignSummary={assignSummary}
              showTitle={false}
              // Hide the Desired Sample Size row on the saved experiment view:
              // for preassigned experiments, "Desired" equals "Actual" by
              // construction, so the row just duplicates information. Desired
              // is still shown on the create-flow Summary page where the
              // distinction is meaningful (the user is deciding).
              showDesiredSampleSize={false}
              designEffect={designEffect}
              numClustersTotal={numClustersTotal}
            />
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
