'use client';
import { Button, Dialog, Flex, IconButton, Tooltip } from '@radix-ui/themes';
import { useState } from 'react';
import { getExperimentAssignmentsAsCsvForUi } from '@/api/admin';
import { DownloadIcon } from '@radix-ui/react-icons';
import { GenericErrorCallout } from '@/components/ui/generic-error';

type DownloadState =
  | { status: 'idle' }
  | { status: 'downloading' }
  | { status: 'no-data' }
  | { status: 'failed'; error: Error };

interface DownloadAssignmentsCsvButtonProps {
  datasourceId: string;
  experimentId: string;
  children?: React.ReactNode;
}

export function DownloadAssignmentsCsvButton({
  datasourceId,
  experimentId,
  children,
}: DownloadAssignmentsCsvButtonProps) {
  const [downloadState, setDownloadState] = useState<DownloadState>({ status: 'idle' });

  const handleDownload = async () => {
    setDownloadState({ status: 'downloading' });
    try {
      const response = await getExperimentAssignmentsAsCsvForUi(datasourceId, experimentId);
      if (!response) {
        setDownloadState({ status: 'no-data' });
        return;
      }
      const blob = new Blob([response as BlobPart], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `experiment_${experimentId}_assignments.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDownloadState({ status: 'idle' });
    } catch (error) {
      setDownloadState({ status: 'failed', error: error instanceof Error ? error : new Error(String(error)) });
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setDownloadState({ status: 'idle' });
    }
  };

  return (
    <>
      {children ? (
        <span onClick={handleDownload}>{children}</span>
      ) : (
        <Tooltip content="Download CSV of participant arm assignments">
          <IconButton
            variant="soft"
            color="gray"
            size="2"
            onClick={handleDownload}
            loading={downloadState.status === 'downloading'}
          >
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      )}

      <Dialog.Root open={downloadState.status === 'no-data'} onOpenChange={handleDialogOpenChange}>
        <Dialog.Content>
          <Dialog.Title>No Data Available</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            There are no assignments to download for this experiment yet.
          </Dialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button>Close</Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      <Dialog.Root open={downloadState.status === 'failed'} onOpenChange={handleDialogOpenChange}>
        <Dialog.Content>
          <Dialog.Title>Download Failed</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            The assignments for this experiment could not be downloaded.
          </Dialog.Description>
          {downloadState.status === 'failed' ? (
            <GenericErrorCallout title="Download failed" error={downloadState.error} />
          ) : null}
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button>Close</Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
