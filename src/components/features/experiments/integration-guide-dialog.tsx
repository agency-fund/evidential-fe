'use client';
import { IconButton, DropdownMenu, Dialog, DataList, Flex, Button } from '@radix-ui/themes';
import { DotsVerticalIcon, FileIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { Arm } from '@/api/methods.schemas';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';

interface IntegrationGuideDialogProps {
  organizationId: string;
  experimentId: string;
  datasourceId: string;
  arms: Arm[];
}

export function IntegrationGuideDialog({
  organizationId,
  experimentId,
  datasourceId,
  arms,
}: IntegrationGuideDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <IconButton variant="ghost" size="3" color="gray">
            <DotsVerticalIcon />
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" side="bottom">
          <DropdownMenu.Item onClick={() => setOpen(true)}>
            <FileIcon />
            Integration Guide
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Content size="3" width="fit-content" onOpenAutoFocus={(e) => e.preventDefault()}>
          <Flex direction="column" gap="5">
            <Dialog.Title size="6">Integration Guide</Dialog.Title>

            <Flex direction="column" gap="3">
              <Dialog.Description size="3" weight="bold">
                API Identifiers
              </Dialog.Description>
              <DataList.Root>
                <DataList.Item>
                  <DataList.Label>Organization ID</DataList.Label>
                  <DataList.Value>
                    <Flex align="center" gap="2" justify="between" width="100%">
                      {organizationId}
                      <CopyToClipBoard content={organizationId} tooltipContent="Copy Organization ID" />
                    </Flex>
                  </DataList.Value>
                </DataList.Item>

                <DataList.Item>
                  <DataList.Label>Datasource ID</DataList.Label>
                  <DataList.Value>
                    <Flex align="center" gap="2" justify="between" width="100%">
                      {datasourceId}
                      <CopyToClipBoard content={datasourceId} tooltipContent="Copy Datasource ID" />
                    </Flex>
                  </DataList.Value>
                </DataList.Item>

                <DataList.Item>
                  <DataList.Label>Experiment ID</DataList.Label>
                  <DataList.Value>
                    <Flex align="center" gap="2" justify="between" width="100%">
                      {experimentId}
                      <CopyToClipBoard content={experimentId} tooltipContent="Copy Experiment ID" />
                    </Flex>
                  </DataList.Value>
                </DataList.Item>
              </DataList.Root>
            </Flex>

            <Flex direction="column" gap="3">
              <Dialog.Description size="3" weight="bold">
                Arms
              </Dialog.Description>
              <DataList.Root>
                {arms.map((arm) => (
                  <DataList.Item key={arm.arm_id}>
                    <DataList.Label>{arm.arm_name}</DataList.Label>
                    <DataList.Value>
                      <Flex align="center" gap="2" justify="between" width="100%">
                        {arm.arm_id}
                        <CopyToClipBoard content={arm.arm_id ?? ''} tooltipContent={`Copy ${arm.arm_name} ID`} />
                      </Flex>
                    </DataList.Value>
                  </DataList.Item>
                ))}
              </DataList.Root>
            </Flex>

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
    </>
  );
}
