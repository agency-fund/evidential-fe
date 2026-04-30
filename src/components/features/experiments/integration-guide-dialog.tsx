'use client';
import { Button, Callout, Card, DataList, Dialog, Flex, Select, Text } from '@radix-ui/themes';
import { ChevronDownIcon, ChevronRightIcon, FileIcon, GearIcon, PlusIcon } from '@radix-ui/react-icons';
import { Collapsible } from 'radix-ui';
import { useEffect, useState } from 'react';
import { mutate } from 'swr';
import { Arm, Context } from '@/api/methods.schemas';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import { useCreateApiKey } from '@/api/admin';
import {
  getGetOrganizationTurnJourneysKey,
  getGetTurnArmJourneyMappingKey,
  useGetOrganizationTurnConnection,
  useGetOrganizationTurnJourneys,
  useGetTurnArmJourneyMapping,
  useSetTurnArmJourneyMapping,
} from '@/api/admin-third-party-tools-integrations';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { ApiError } from '@/services/orval-fetch';
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
  const [showTurnConfig, setShowTurnConfig] = useState(false);
  const [armJourneyDraft, setArmJourneyDraft] = useState<Record<string, string>>({});

  const {
    data: createdKey,
    trigger: triggerCreateApiKey,
    isMutating: isCreatingApiKey,
  } = useCreateApiKey(datasourceId);

  const { error: turnConnectionError, isLoading: isLoadingTurnConnection } = useGetOrganizationTurnConnection(
    organizationId,
    { allow_missing: false },
    { swr: { enabled: open } },
  );
  const noTurnConnection = turnConnectionError instanceof ApiError && turnConnectionError.response.status === 404;
  const hasTurnConnection = !isLoadingTurnConnection && !turnConnectionError;

  const turnSectionEnabled = open && showTurnConfig && hasTurnConnection;

  const {
    data: journeysData,
    error: journeysError,
    isLoading: isLoadingJourneys,
  } = useGetOrganizationTurnJourneys(organizationId, { swr: { enabled: turnSectionEnabled } });

  const { error: mappingError } = useGetTurnArmJourneyMapping(datasourceId, experimentId, {
    swr: {
      enabled: turnSectionEnabled,
      onSuccess: (data) => {
        if (data?.arm_to_journeys) {
          setArmJourneyDraft(data.arm_to_journeys);
        }
      },
    },
  });
  const mappingNotFound = mappingError instanceof ApiError && mappingError.response.status === 404;

  const {
    trigger: triggerSaveMapping,
    isMutating: isSavingMapping,
    error: saveError,
  } = useSetTurnArmJourneyMapping(datasourceId, experimentId);

  const handleOpenCollapsible = (next: boolean) => {
    setShowTurnConfig(next);
    if (!next) return;
    setArmJourneyDraft({});
    void mutate(getGetOrganizationTurnJourneysKey(organizationId));
    void mutate(getGetTurnArmJourneyMappingKey(datasourceId, experimentId));
  };

  const handleSaveMapping = async () => {
    await triggerSaveMapping({ arm_to_journeys: armJourneyDraft });
    await mutate(getGetTurnArmJourneyMappingKey(datasourceId, experimentId));
    setShowTurnConfig(false);
  };

  const journeyEntries = journeysData ? Object.entries(journeysData.journeys) : [];
  const hasJourneys = journeyEntries.length > 0;

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

            <Card>
              <Collapsible.Root
                open={showTurnConfig}
                onOpenChange={handleOpenCollapsible}
                disabled={isLoadingTurnConnection || noTurnConnection}
              >
                <Flex direction="column" gap="2">
                  <Collapsible.Trigger
                    style={{
                      all: 'unset',
                      cursor: isLoadingTurnConnection || noTurnConnection ? 'not-allowed' : 'pointer',
                      opacity: isLoadingTurnConnection || noTurnConnection ? 0.6 : 1,
                    }}
                  >
                    <Flex align="center" justify="between">
                      <Flex align="center" gap="2">
                        <GearIcon />
                        <Text size="2" weight="medium">
                          Configure integration for third-party tools
                        </Text>
                      </Flex>
                      {showTurnConfig ? <ChevronDownIcon /> : <ChevronRightIcon />}
                    </Flex>
                  </Collapsible.Trigger>
                  {noTurnConnection && (
                    <Text size="2" color="gray">
                      No Turn.io API key configured. <Link href="/integrations">Add one in Integrations</Link> to enable
                      this.
                    </Text>
                  )}
                </Flex>
                <Collapsible.Content>
                  {hasTurnConnection && (
                    <Flex direction="column" gap="3" mt="3">
                      <Dialog.Description size="3" weight="bold">
                        Turn.io Arm → Journey Mapping
                      </Dialog.Description>
                      {journeysError && (
                        <GenericErrorCallout title="Error loading Turn journeys" error={journeysError} />
                      )}
                      {mappingError && !mappingNotFound && (
                        <GenericErrorCallout title="Error loading existing mapping" error={mappingError} />
                      )}
                      {!isLoadingJourneys && journeysData && !hasJourneys && (
                        <Callout.Root color="gray">
                          <Callout.Text>No journeys found in your Turn workspace.</Callout.Text>
                        </Callout.Root>
                      )}
                      <DataList.Root>
                        {arms.map((arm) => {
                          const armId = arm.arm_id ?? '';
                          return (
                            <DataList.Item key={armId}>
                              <DataList.Label>
                                <Flex direction="column" gap="1">
                                  <Text size="2" weight="medium" mt="2">
                                    {arm.arm_name}
                                  </Text>
                                  <Text size="1" color="gray">
                                    {armId}
                                  </Text>
                                </Flex>
                              </DataList.Label>
                              <DataList.Value>
                                <Flex direction="column">
                                  <Select.Root
                                    value={armJourneyDraft[armId] ?? ''}
                                    onValueChange={(val) => setArmJourneyDraft((s) => ({ ...s, [armId]: val }))}
                                    disabled={!hasJourneys}
                                  >
                                    <Select.Trigger placeholder="Select a journey..." />
                                    <Select.Content position="popper">
                                      {journeyEntries.map(([name, uuid]) => (
                                        <Select.Item key={uuid} value={uuid}>
                                          {name}
                                        </Select.Item>
                                      ))}
                                    </Select.Content>
                                  </Select.Root>
                                  {armJourneyDraft[armId] && (
                                    <Text size="1" color="gray">
                                      {armJourneyDraft[armId]}
                                    </Text>
                                  )}
                                </Flex>
                              </DataList.Value>
                            </DataList.Item>
                          );
                        })}
                      </DataList.Root>
                      {saveError && <GenericErrorCallout title="Error saving mapping" error={saveError} />}
                      <Flex justify="end">
                        <Button onClick={handleSaveMapping} loading={isSavingMapping}>
                          Save
                        </Button>
                      </Flex>
                    </Flex>
                  )}
                </Collapsible.Content>
              </Collapsible.Root>
            </Card>

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
