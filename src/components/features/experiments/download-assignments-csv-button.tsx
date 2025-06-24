'use client';
import { Button, Dialog, Flex, IconButton, Tooltip } from '@radix-ui/themes';
import { useState } from 'react';
import { getExperimentAssignmentsAsCsv } from '@/api/admin';
import { DownloadIcon } from '@radix-ui/react-icons';

interface DownloadAssignmentsCsvButtonProps {
  datasourceId: string;
  experimentId: string;
}

export function DownloadAssignmentsCsvButton({ datasourceId, experimentId }: DownloadAssignmentsCsvButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [noDataDialog, setNoDataDialog] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await getExperimentAssignmentsAsCsv(datasourceId, experimentId);

      if (response) {
        const blob = new Blob([response as BlobPart], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `experiment_${experimentId}_assignments.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        console.log('No data available');
        setNoDataDialog(true);
      }
    } catch (error) {
      console.error('Error downloading CSV:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <Tooltip content="Download CSV">
        <IconButton variant="soft" color="gray" size="2" onClick={handleDownload} loading={isDownloading}>
          <DownloadIcon width="16" height="16" />
        </IconButton>
      </Tooltip>

      <Dialog.Root open={noDataDialog} onOpenChange={setNoDataDialog}>
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
    </>
  );
}
