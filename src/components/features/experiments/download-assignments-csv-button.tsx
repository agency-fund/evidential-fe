'use client';
import { Button } from '@radix-ui/themes';
import { useState } from 'react';
import { getExperimentAssignmentsAsCsv } from '@/api/admin';
import { DownloadIcon } from '@radix-ui/react-icons';

interface DownloadAssignmentsCsvButtonProps {
  datasourceId: string;
  experimentId: string;
}

export function DownloadAssignmentsCsvButton({ datasourceId, experimentId }: DownloadAssignmentsCsvButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await getExperimentAssignmentsAsCsv(datasourceId, experimentId);

      if (response) {
        // Create a blob from the CSV data (typing is a hack)
        const blob = new Blob([response as BlobPart], { type: 'text/csv;charset=utf-8;' });

        // Create a download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `experiment_${experimentId}_assignments.csv`;

        // Trigger the download
        document.body.appendChild(link);
        link.click();

        // Clean up
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

  return (
    <Button variant="soft" size="1" onClick={handleDownload} loading={isDownloading}>
      <DownloadIcon /> CSV
    </Button>
  );
}
