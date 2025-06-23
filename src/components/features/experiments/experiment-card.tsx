// src/components/features/experiments/experiment-card.tsx

import { Card, Heading, Text, Flex, Badge, IconButton, Box, Button, DropdownMenu, Tooltip } from "@radix-ui/themes"
import { TargetIcon, CalendarIcon, EyeOpenIcon, DownloadIcon, DotsVerticalIcon, LightningBoltIcon, TableIcon, PersonIcon, ComponentInstanceIcon } from "@radix-ui/react-icons";
import { ReadMoreText } from "@/components/ui/read-more-text";
import { DownloadAssignmentsCsvButton } from "@/components/features/experiments/download-assignments-csv-button";
import { DeleteExperimentButton } from "@/components/features/experiments/delete-experiment-button";
import { getExperimentAssignmentsAsCsv } from '@/api/admin';
import Link from "next/link";
import { useState } from "react";

interface ExperimentCardProps {
  title: string;
  hypothesis: string;
  type: string;
  startDate: string;
  endDate: string;
  datasource: string;
  datasourceId: string;
  participantType: string;
  experimentId: string;
  organizationId: string;
}

export default function ExperimentCard({title, hypothesis, type, startDate, endDate, datasource, datasourceId, participantType, experimentId, organizationId}: ExperimentCardProps) {
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();
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
      }
    } catch (error) {
      console.error('Error downloading CSV:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Calculate experiment status
  const getExperimentStatus = () => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) {
      return 'Draft';
    } else if (now > end) {
      return 'Completed';
    } else {
      return 'Active';
    }
  };

  const status = getExperimentStatus();

  // Get status badge color
  const getStatusBadgeColor = () => {
    switch (status) {
      case 'Active':
        return 'green';
      case 'Draft':
        return 'gray';
      case 'Completed':
        return 'blue';
      default:
        return 'gray';
    }
  };

  return (
    <Card size="3">
      {/* Header with title and status */}
      <Flex justify="between" align="start" mb="5">
        <Flex align="center" justify="start" gap="1">
          <LightningBoltIcon width="16" height="16" color="var(--blue-9)" />
          <Heading as="h3" size="4" weight="medium">
            {title}
          </Heading>
          
          {/* Quick action icons */}
          <Flex align="center" gap="2" ml="3">
            <Tooltip content="View experiment">
              <IconButton variant="ghost" color="gray" size="1" asChild>
                <Link href={`/datasources/${datasourceId}/experiments/${experimentId}`}>
                  <EyeOpenIcon width="16" height="16" />
                </Link>
              </IconButton>
            </Tooltip>
            
            <Tooltip content="Download CSV">
              <IconButton 
                variant="ghost" 
                color="gray" 
                size="1" 
                onClick={handleDownload}
                loading={isDownloading}
              >
                <DownloadIcon width="16" height="16" />
              </IconButton>
            </Tooltip>
          </Flex>
        </Flex>
        
        {/* Right side: Always reserves space for both badge and actions */}
        <Flex align="center" gap="3" minWidth="0">
          <Badge color={getStatusBadgeColor()} variant="soft">
            {status}
          </Badge>
          
          {/* Actions menu always visible */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <IconButton 
                variant="ghost"
                color="gray"
                size="1"
              >
                <DotsVerticalIcon width="16" height="16" />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DeleteExperimentButton
                organizationId={organizationId}
                datasourceId={datasourceId}
                experimentId={experimentId}
                asDropdownItem={true}
              />
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Flex>
      </Flex>

      {/* Metadata section */}
      <Box mb="5">
        <Flex direction="column" gap="3">
          {/* Datasource, participant, and type info as badges */}
          <Flex align="center" gap="2" wrap="wrap">
            <Badge variant="soft" color="gray" size="1" asChild>
              <Link href={`/datasources/${datasourceId}`}>
                <TableIcon width="12" height="12" />
                {datasource}
              </Link>
            </Badge>
            <Badge variant="soft" color="blue" size="1" asChild>
              <Link href={`/datasources/${datasourceId}`}>
                <PersonIcon width="12" height="12" />
                {participantType}
              </Link>
            </Badge>
            <Badge variant="soft" color="orange" size="1">
              <ComponentInstanceIcon width="12" height="12" />
              {type}
            </Badge>
          </Flex>

          {/* Date range */}
          <Flex align="center" gap="2">
            <CalendarIcon width="14" height="14" color="var(--gray-9)" />
            <Text size="2" color="gray">
              {formatDate(startDate)} - {formatDate(endDate)}
            </Text>
          </Flex>
        </Flex>
      </Box>

      {/* Hypothesis section */}
      <Box>
        <Text size="2" weight="medium" color="gray" mb="2">
          Hypothesis
        </Text>
        <ReadMoreText text={hypothesis} maxWords={15} />
      </Box>


    </Card>
  );
}