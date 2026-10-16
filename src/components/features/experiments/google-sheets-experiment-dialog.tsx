'use client';

import { useState } from 'react';
import { Button, Dialog, Flex, Text, TextField } from '@radix-ui/themes';
import { GearIcon, LockClosedIcon } from '@radix-ui/react-icons';
import { mutate } from 'swr';
import {
  getGetExperimentForUiKey,
  getListOrganizationExperimentsKey,
  useGetDatasource,
  useUpdateExperiment,
} from '@/api/admin';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { useAuth } from '@/providers/auth-provider';
import { XSpinner } from '@/components/ui/x-spinner';

export function GoogleSheetsExperimentDialog({
  datasourceId,
  experimentId,
  experimentName,
  organizationId,
  rawSpreadsheetUrl,
  experimentSpreadsheetUrl,
  triggerLabel,
}: {
  datasourceId: string;
  experimentId: string;
  experimentName: string;
  organizationId: string;
  rawSpreadsheetUrl?: string;
  experimentSpreadsheetUrl: string | null;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const { isPrivileged } = useAuth();
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const { data: datasource, error: datasourceError } = useGetDatasource(datasourceId, {
    swr: { enabled: open && isPrivileged && !rawSpreadsheetUrl },
  });
  const sourceUrl =
    rawSpreadsheetUrl ?? (datasource?.dsn.type === 'google_sheets' ? datasource.dsn.spreadsheet_url : undefined);
  const {
    trigger: updateExperiment,
    isMutating,
    error,
    reset,
  } = useUpdateExperiment(datasourceId, experimentId, {
    swr: {
      onSuccess: async () => {
        await mutate(getGetExperimentForUiKey(datasourceId, experimentId));
        handleClose();
        await mutate(getListOrganizationExperimentsKey(organizationId));
      },
    },
  });

  function handleClose() {
    reset();
    setOpen(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setSpreadsheetUrl(experimentSpreadsheetUrl ?? '');
      setOpen(true);
    } else {
      handleClose();
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isPrivileged || !sourceUrl) return;
    await updateExperiment({ google_sheets_experiment_url: spreadsheetUrl.trim() }, { throwOnError: false });
  }

  if (!isPrivileged) return null;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger>
        <Button type="button" variant="soft">
          <GearIcon />
          {triggerLabel ?? (experimentSpreadsheetUrl ? 'Experiment tab settings' : 'Connect Experiment tab')}
        </Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <form onSubmit={handleSubmit}>
          <Dialog.Title>Google Sheets connection</Dialog.Title>
          <Text as="p" size="3" weight="medium" mb="2">
            {experimentName}
          </Text>
          <Dialog.Description size="2" mb="4">
            Read-only access requires publicly accessible tabs with CSV downloads enabled.
          </Dialog.Description>
          <Flex direction="column" gap="3">
            {error && <GenericErrorCallout title="Could not connect Experiment tab" error={error} />}
            {datasourceError && <GenericErrorCallout title="Could not load datasource" error={datasourceError} />}
            {!sourceUrl && !datasourceError && <XSpinner />}
            <label>
              <Text as="div" size="2" mb="1" weight="bold" color="gray">
                Raw datasource tab
              </Text>
              <TextField.Root type="url" value={sourceUrl ?? ''} disabled variant="soft" color="gray">
                <TextField.Slot>
                  <LockClosedIcon />
                </TextField.Slot>
              </TextField.Root>
            </label>
            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Experiment tab URL (outcomes)
              </Text>
              <TextField.Root
                type="url"
                value={spreadsheetUrl}
                onChange={(event) => setSpreadsheetUrl(event.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/…/edit#gid=…"
                required
              />
            </label>
          </Flex>
          <Flex gap="3" mt="4" justify="end">
            <Button type="button" variant="soft" color="gray" onClick={handleClose} disabled={isMutating}>
              Cancel
            </Button>
            <Button type="submit" loading={isMutating} disabled={!sourceUrl}>
              Save experiment tab
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
