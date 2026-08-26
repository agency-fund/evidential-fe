'use client';

import { useState } from 'react';
import { useCurrentOrganization } from '@/providers/organization-provider';
import {
  useSetOrganizationTurnConnection,
  useGetOrganizationTurnConnection,
  useDeleteTurnConnectionFromOrganization,
  getGetOrganizationTurnConnectionKey,
  useRegenerateTurnWebhookToken,
} from '@/api/admin-third-party-tools-integrations';
import { mutate } from 'swr';
import {
  Box,
  Heading,
  Flex,
  Spinner,
  Text,
  Button,
  Code,
  Tooltip,
  IconButton,
  Grid,
  Link,
  Callout,
} from '@radix-ui/themes';
import { DeleteAlertDialog } from '@/components/ui/delete-alert-dialog';
import { SetApiKeyAlertDialog } from '@/components/features/integrations/set-api-key-alert-dialog';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import {
  DownloadIcon,
  EyeClosedIcon,
  EyeOpenIcon,
  InfoCircledIcon,
  ReloadIcon,
  TrashIcon,
} from '@radix-ui/react-icons';

export default function IntegrationsPage() {
  const organizationCtx = useCurrentOrganization();
  const organizationId = organizationCtx?.current.id || '';
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openSetApiKeyDialog, setOpenSetApiKeyDialog] = useState(false);
  const [isWebhookTokenVisible, setIsWebhookTokenVisible] = useState(false);
  const turnConnectionGetKey = getGetOrganizationTurnConnectionKey(organizationId, { allow_missing: true });
  const { data: turnConnectionData, isLoading: isTurnConnectionLoadingData } = useGetOrganizationTurnConnection(
    organizationId,
    { allow_missing: true },
  );
  const {
    trigger: deleteTurnConnection,
    isMutating: isDeletingTurnConnection,
    error: deleteError,
  } = useDeleteTurnConnectionFromOrganization(organizationId, undefined, {
    swr: { onSuccess: () => mutate(turnConnectionGetKey) },
  });
  const {
    trigger: setTurnConnection,
    isMutating: isSettingTurnConnection,
    error: setError,
  } = useSetOrganizationTurnConnection(organizationId, {
    swr: {
      onSuccess: () => mutate(turnConnectionGetKey),
    },
  });

  const { trigger: regenerateTurnWebhookToken } = useRegenerateTurnWebhookToken(
    organizationId,
    { allow_missing: false },
    {
      swr: {
        onSuccess: () => mutate(turnConnectionGetKey),
      },
    },
  );

  const tokenPreview = turnConnectionData?.auth_token ?? '';

  const handleAddOrRotateTurnConnection = async (newApiKey: string) => {
    await setTurnConnection({ turn_api_token: newApiKey });
  };
  const handleDeleteTurnConnection = async () => {
    await deleteTurnConnection();
  };
  const handleRegenerateTurnWebhookToken = async () => {
    await regenerateTurnWebhookToken();
  };

  return (
    <Flex direction="column" gap="6">
      <Heading size="8">Third-Party Tools Integrations</Heading>

      {isTurnConnectionLoadingData ? (
        <Spinner />
      ) : (
        <Box style={{ border: '1px solid var(--gray-a6)', borderRadius: 'var(--radius-3)' }}>
          {/* Turn.io API Key section */}
          <Flex direction="column" gap="3" p="5">
            <Heading size="4">Turn.io API Key</Heading>
            <Text size="2" color="gray">
              We use this API key to integrate with Turn.io for Journey management.
              <br />
              You can create one from{' '}
              <Link href="https://whatsapp.turn.io/" target="_blank">
                Turn.io
              </Link>
              . Go to Settings &gt; API & Webhooks &gt; Create a Token:
            </Text>
            {tokenPreview ? (
              <Flex direction="column" gap="5">
                <Flex
                  align="center"
                  justify="between"
                  style={{ border: '1px solid var(--gray-a6)', borderRadius: 'var(--radius-2)', padding: '8px 12px' }}
                >
                  <Text>***********{turnConnectionData?.turn_api_token_preview}</Text>
                </Flex>
                <Flex direction="row" gap="3">
                  <Button radius="full" variant="soft" color="blue" onClick={() => setOpenSetApiKeyDialog(true)}>
                    <ReloadIcon />
                    Rotate API Key
                  </Button>
                  <Button radius="full" variant="soft" color="red" onClick={() => setOpenDeleteDialog(true)}>
                    <TrashIcon />
                    Delete API Key
                  </Button>
                </Flex>
                <Flex direction="column" gap="3">
                  <Callout.Root color="blue">
                    <Callout.Icon>
                      <InfoCircledIcon />
                    </Callout.Icon>
                    <Callout.Text>
                      To finish setting up the integration with Turn.io, install the Evidential Turn.io App in your
                      workspace:
                      <br />
                      1. Download the app zip file below.
                      <br />
                      2. On Turn.io, go to Apps &gt; Installed Apps &gt; Upload app. Upload the .zip file you downloaded
                      and click `Install app`.
                      <br />
                      3. Go to the Settings page of the App. Paste the Webhook ID and Webhook Auth Token from the
                      section below.
                      <br />
                      4. Generate the Evidential API Key from your experiment&apos;s Integration Guide. Paste it into
                      the app Settings as well.
                      <br />
                      5. Follow the instructions on the app About page for further setup.
                    </Callout.Text>
                  </Callout.Root>
                  <Heading size="3">Turn.io Evidential App</Heading>
                  <Text size="2" color="gray">
                    Download the latest version of the Evidential Turn.io App.
                  </Text>
                  <Flex direction="row">
                    <Button radius="full" variant="soft" color="blue" asChild>
                      <a
                        href="https://github.com/IDinsight/evidential-turn-app/raw/builds/evidential.zip"
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <DownloadIcon />
                        Download the Evidential Turn.io App
                      </a>
                    </Button>
                  </Flex>
                </Flex>
                <Flex direction="column" gap="3">
                  <Heading size="3">Autogenerated Webhook ID and token for Turn.io.</Heading>
                  <Text size="2" color="gray">
                    Copy these values into the appropriate fields in the Turn.io Evidential App, to notify Evidential
                    when there are changes to Journeys:
                  </Text>
                  <Grid columns="2" gap="4">
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="bold">
                        Webhook ID
                      </Text>
                      <Box
                        style={{
                          border: '1px solid var(--gray-a6)',
                          borderRadius: 'var(--radius-2)',
                          padding: '5.5px 12px',
                        }}
                      >
                        <Flex align="center" gap="2">
                          <Flex align="center" style={{ width: '100%' }}>
                            <Text>{turnConnectionData?.id}</Text>
                          </Flex>
                          <CopyToClipBoard tooltipContent="Copy webhook ID" content={turnConnectionData?.id || ''} />
                        </Flex>
                      </Box>
                    </Flex>

                    <Flex direction="column" gap="1">
                      <Flex direction="row" gap="2" align="center">
                        <Text size="2" weight="bold">
                          Webhook Auth Token
                        </Text>
                      </Flex>
                      <Box
                        style={{
                          border: '1px solid var(--gray-a6)',
                          borderRadius: 'var(--radius-2)',
                          padding: '8px 12px',
                        }}
                      >
                        <Flex align="center" gap="2">
                          <Flex align="center" style={{ width: '100%' }}>
                            <Code variant="ghost">
                              {isWebhookTokenVisible ? turnConnectionData?.auth_token : '••••••••••••••••'}
                            </Code>
                          </Flex>
                          <IconButton
                            size="1"
                            aria-label={isWebhookTokenVisible ? 'Hide auth token' : 'Show auth token'}
                            color="gray"
                            variant="ghost"
                            onClick={() => setIsWebhookTokenVisible(!isWebhookTokenVisible)}
                          >
                            <Tooltip content={isWebhookTokenVisible ? 'Hide auth token' : 'Show auth token'}>
                              {isWebhookTokenVisible ? <EyeOpenIcon /> : <EyeClosedIcon />}
                            </Tooltip>
                          </IconButton>
                          <IconButton
                            size="1"
                            aria-label={'Rotate auth token'}
                            color="blue"
                            variant="soft"
                            onClick={handleRegenerateTurnWebhookToken}
                          >
                            <Tooltip content="Rotate auth token">
                              <ReloadIcon />
                            </Tooltip>
                          </IconButton>
                          <CopyToClipBoard
                            tooltipContent="Copy auth token"
                            content={turnConnectionData?.auth_token || ''}
                          />
                        </Flex>
                      </Box>
                    </Flex>
                  </Grid>
                </Flex>
              </Flex>
            ) : (
              <Button radius="full" variant="soft" color="blue" onClick={() => setOpenSetApiKeyDialog(true)}>
                Add API Key
              </Button>
            )}
          </Flex>
        </Box>
      )}

      <SetApiKeyAlertDialog
        trigger={handleAddOrRotateTurnConnection}
        loading={isSettingTurnConnection}
        error={setError}
        open={openSetApiKeyDialog}
        onOpenChange={setOpenSetApiKeyDialog}
      />

      <DeleteAlertDialog
        title="Delete Turn.io Connection"
        description="Are you sure you want to delete this Turn.io connection? This deletes the stored API key, webhook, all stored Journeys on Evidential, and arm-to-Journey mappings, including those for experiments that are still running. This action cannot be undone."
        trigger={handleDeleteTurnConnection}
        loading={isDeletingTurnConnection}
        error={deleteError}
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
      />
    </Flex>
  );
}
