'use client';

import { useState } from 'react';
import { Button, Dialog, Flex, Text, TextField } from '@radix-ui/themes';
import { GearIcon } from '@radix-ui/react-icons';
import { mutate } from 'swr';
import { getGetExperimentForUiKey, useUpdateExperiment } from '@/api/admin';
import { GenericErrorCallout } from '@/components/ui/generic-error';

export function GoogleSheetsExperimentDialog({
  datasourceId,
  experimentId,
  rawSpreadsheetUrl,
  experimentSpreadsheetUrl,
}: {
  datasourceId: string;
  experimentId: string;
  rawSpreadsheetUrl: string;
  experimentSpreadsheetUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
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
    await updateExperiment({ google_sheets_experiment_url: spreadsheetUrl.trim() }, { throwOnError: false });
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger>
        <Button type="button">
          <GearIcon />
          {experimentSpreadsheetUrl ? 'Experiment tab settings' : 'Connect Experiment tab'}
        </Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <form onSubmit={handleSubmit}>
          <Dialog.Title>Experiment tab settings</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            The Raw tab stays connected to the datasource. This outcomes connection applies only to this experiment.
          </Dialog.Description>
          <Flex direction="column" gap="3">
            {error && <GenericErrorCallout title="Could not connect Experiment tab" error={error} />}
            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Raw tab URL (datasource)
              </Text>
              <TextField.Root type="url" value={rawSpreadsheetUrl} readOnly />
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
            <Button type="submit" loading={isMutating}>
              Save connection
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
