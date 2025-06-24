'use client';
import { Button, DropdownMenu, IconButton, Tooltip } from '@radix-ui/themes';
import { useState } from 'react';
import { getExperimentAssignmentsAsCsv } from '@/api/admin';
import { DownloadIcon } from '@radix-ui/react-icons';

interface DownloadAssignmentsCsvButtonProps {
  datasourceId: string;
  experimentId: string;
  asDropdownItem?: boolean;
  asIconButton?: boolean;
}

export function DownloadAssignmentsCsvButton({ 
  datasourceId, 
  experimentId, 
  asDropdownItem = false,
  asIconButton = false 
}: DownloadAssignmentsCsvButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

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
        console.error('Failed to download CSV: No data received');
      }
    } catch (error) {
      console.error('Error downloading CSV:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (asDropdownItem) {
    return (
      <DropdownMenu.Item onClick={handleDownload} disabled={isDownloading}>
        <DownloadIcon />
        {isDownloading ? 'Downloading...' : 'Download CSV'}
      </DropdownMenu.Item>
    );
  }

  if (asIconButton) {
    return (
      <Tooltip content="Download CSV">
        <IconButton variant="soft" color="gray" size="2" onClick={handleDownload} loading={isDownloading}>
          <DownloadIcon width="16" height="16" />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Button variant="soft" size="1" onClick={handleDownload} loading={isDownloading}>
      <DownloadIcon /> CSV
    </Button>
  );
}
