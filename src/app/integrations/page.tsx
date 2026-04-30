'use client';

import { useState } from 'react';
import { useCurrentOrganization } from '@/providers/organization-provider';
import {
  useSetOrganizationTurnConnection,
  useGetOrganizationTurnConnection,
  useDeleteTurnConnectionFromOrganization,
  getGetOrganizationTurnConnectionKey,
} from '@/api/admin-third-party-tools-integrations';
import { Box, Heading, Flex, Spinner, Text, Button } from '@radix-ui/themes';
import { DeleteAlertDialog } from '@/components/ui/delete-alert-dialog';
import { SetApiKeyAlertDialog } from '@/components/features/integrations/set-api-key-alert-dialog';

export default function IntegrationsPage() {
  const organizationCtx = useCurrentOrganization();
  const organizationId = organizationCtx?.current.id || '';
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openSetApiKeyDialog, setOpenSetApiKeyDialog] = useState(false);
  const turnConnectionGetKey = getGetOrganizationTurnConnectionKey(organizationId, { allow_missing: true });

  const { data: turnConnectionData, isLoading: isTurnConnectionLoadingData } = useGetOrganizationTurnConnection(
    organizationId,
    { allow_missing: true },
  );
  const {
    trigger: deleteTurnConnection,
    isMutating: isDeletingTurnConnection,
    error: deleteError,
  } = useDeleteTurnConnectionFromOrganization(organizationId, undefined, { swr: { swrKey: turnConnectionGetKey } });
  const {
    trigger: setTurnConnection,
    isMutating: isSettingTurnConnection,
    error: setError,
  } = useSetOrganizationTurnConnection(organizationId, {
    swr: {
      swrKey: turnConnectionGetKey,
    },
  });

  const tokenPreview = turnConnectionData?.token_preview ?? '';

  const handleAddOrRotateTurnConnection = async (newApiKey: string) => {
    await setTurnConnection({ turn_api_token: newApiKey });
  };
  const handleDeleteTurnConnection = async () => {
    await deleteTurnConnection();
  };

  return (
    <Flex direction="column" gap="6" align="center">
      <Heading size="8">Third-Party Tools Integrations</Heading>
      <Box>
        <Flex direction="column" gap="2" align="center">
          <Heading size="4">Turn.io API Key</Heading>
          <Text size="1">We use this API key to integrate with Turn.io for Journey management:</Text>
          {isTurnConnectionLoadingData ? (
            <Spinner />
          ) : tokenPreview ? (
            <Flex direction="column" gap="2" align="center">
              <Box>
                <Text>***********{tokenPreview}</Text>
              </Box>
              <Flex direction="row" gap="4">
                <Button variant="soft" color="blue" onClick={() => setOpenSetApiKeyDialog(true)}>
                  Rotate API Key
                </Button>
                <Button variant="soft" color="red" onClick={() => setOpenDeleteDialog(true)}>
                  Delete API Key
                </Button>
              </Flex>
            </Flex>
          ) : (
            <Button variant="soft" color="blue" onClick={() => setOpenSetApiKeyDialog(true)}>
              Add API Key
            </Button>
          )}

          <SetApiKeyAlertDialog
            trigger={handleAddOrRotateTurnConnection}
            loading={isSettingTurnConnection}
            error={setError}
            open={openSetApiKeyDialog}
            onOpenChange={setOpenSetApiKeyDialog}
          />

          <DeleteAlertDialog
            title="Delete Turn.io API Key"
            description="Are you sure you want to delete the Turn.io API key? This will disable our integration with Turn.io until a new API key is added."
            trigger={handleDeleteTurnConnection}
            loading={isDeletingTurnConnection}
            error={deleteError}
            open={openDeleteDialog}
            onOpenChange={setOpenDeleteDialog}
          ></DeleteAlertDialog>
        </Flex>
      </Box>
    </Flex>
  );
}
