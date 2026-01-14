'use client';
import { Button, DataList, Dialog, Flex } from '@radix-ui/themes';
import { FileIcon, PlusIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { Arm, Context } from '@/api/methods.schemas';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import { useCreateApiKey } from '@/api/admin';
import Link from 'next/link';

interface IntegrationGuideDialogProps {
  organizationId: string;
  experimentId: string;
  datasourceId: string;
  arms: Arm[];
  contexts: Context[];
}

export function IntegrationGuideDialog({
  organizationId,
  experimentId,
  datasourceId,
  arms,
  contexts,
}: IntegrationGuideDialogProps) {
  const [open, setOpen] = useState(false);
  const {
    data: createdKey,
    trigger: triggerCreateApiKey,
    isMutating: isCreatingApiKey,
  } = useCreateApiKey(datasourceId);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <FileIcon />
        Integration Guide
      </Button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Content size="3" width={'500'} onOpenAutoFocus={(e) => e.preventDefault()}>
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
                    <Flex justify="between" width="100%">
                      {organizationId}
                      <CopyToClipBoard content={organizationId} tooltipContent="Copy Organization ID" />
                    </Flex>
                  </DataList.Value>
                </DataList.Item>

                <DataList.Item>
                  <DataList.Label>Datasource ID</DataList.Label>
                  <DataList.Value>
                    <Flex justify="between" width="100%">
                      {datasourceId}
                      <CopyToClipBoard content={datasourceId} tooltipContent="Copy Datasource ID" />
                    </Flex>
                  </DataList.Value>
                </DataList.Item>

                <DataList.Item>
                  <DataList.Label>Experiment ID</DataList.Label>
                  <DataList.Value>
                    <Flex justify="between" width="100%">
                      {experimentId}
                      <CopyToClipBoard content={experimentId} tooltipContent="Copy Experiment ID" />
                    </Flex>
                  </DataList.Value>
                </DataList.Item>
              </DataList.Root>
            </Flex>

            <Flex direction="column" gap="3">
              <Dialog.Description size="3" weight="bold">
                API Key
              </Dialog.Description>
              <DataList.Root>
                <DataList.Item>
                  <DataList.Label>Datasource API Key</DataList.Label>
                  <DataList.Value>
                    <Flex direction={'column'} width={'100%'}>
                      <Flex justify="between" width="100%" height={'32px'}>
                        {!createdKey ? (
                          <Button
                            variant="soft"
                            onClick={async () => await triggerCreateApiKey()}
                            loading={isCreatingApiKey}
                          >
                            <PlusIcon /> Add API Key
                          </Button>
                        ) : (
                          <>
                            {createdKey.key}
                            <CopyToClipBoard content={createdKey.key} tooltipContent="Copy API Key" />
                          </>
                        )}
                      </Flex>
                      <Link href={`/datasources/${datasourceId}`}>Manage API Keys</Link>
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
                      <Flex justify="between" width="100%">
                        {arm.arm_id}
                        <CopyToClipBoard content={arm.arm_id ?? ''} tooltipContent={`Copy ${arm.arm_name} ID`} />
                      </Flex>
                    </DataList.Value>
                  </DataList.Item>
                ))}
              </DataList.Root>
            </Flex>

            {contexts && contexts.length > 0 && (
              <Flex direction="column" gap="3">
                <Dialog.Description size="3" weight="bold">
                  Contexts
                </Dialog.Description>
                <DataList.Root>
                  {contexts.map((context) => (
                    <DataList.Item key={context.context_id}>
                      <DataList.Label>{context.context_name}</DataList.Label>
                      <DataList.Value>
                        <Flex justify="between" width="100%">
                          {context.context_id}
                          <CopyToClipBoard
                            content={context.context_id ?? ''}
                            tooltipContent={`Copy ${context.context_name} ID`}
                          />
                        </Flex>
                      </DataList.Value>
                    </DataList.Item>
                  ))}
                </DataList.Root>
              </Flex>
            )}

            <Flex gap="3" justify="end">
              <Dialog.Close>
                <Button>Close</Button>
              </Dialog.Close>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
