// src/components/features/experiments/experiment-card.tsx

import { Card, Heading, Text, Flex, Badge, DropdownMenu, IconButton, Box, Separator, Tooltip, Theme } from "@radix-ui/themes"
import { TableIcon, PersonIcon, DotsVerticalIcon, CalendarIcon, EyeOpenIcon } from "@radix-ui/react-icons";
import { ExperimentTypeBadge } from "@/components/features/experiments/experiment-type-badge";
import { ReadMoreText } from "@/components/ui/read-more-text";
import { DownloadAssignmentsCsvButton } from "@/components/features/experiments/download-assignments-csv-button";
import { DeleteExperimentButton } from "@/components/features/experiments/delete-experiment-button";
import Link from "next/link";

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

  // Calculate experiment status
  const getExperimentStatus = () => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) {
      return 'upcoming';
    } else if (now > end) {
      return 'finished';
    } else {
      return 'current';
    }
  };

  const status = getExperimentStatus();



  return (
    
      <Card size="3" variant="surface">
        {/* Card Header */}
        <Flex justify="between" align="start" gap="4" pb="3">
          <Flex direction="column" gap="2" flexGrow="1" minWidth="0">
            <Heading as="h2" size="5" weight="medium" asChild>
              <Link href={`/datasources/${datasourceId}/experiments/${experimentId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Flex align="center" gap="2">
                  <Text truncate>{title}</Text>
                  <Tooltip content="View Experiment">
                      <EyeOpenIcon width="20" height="20" color="var(--gray-10)" />
                  </Tooltip>
                </Flex>
              </Link>
            </Heading>
          </Flex>
          
          {/* Actions Menu */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <IconButton variant="ghost" color="gray" size="2">
                <DotsVerticalIcon width="20" height="20" />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DownloadAssignmentsCsvButton 
                datasourceId={datasourceId}
                experimentId={experimentId}
                asDropdownItem={true}
              />
              <DeleteExperimentButton
                organizationId={organizationId}
                datasourceId={datasourceId}
                experimentId={experimentId}
                asDropdownItem={true}
              />
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Flex>

        <Separator size="4" />

        {/* Card Details */}
        <Box pt="3">
          <Flex direction="column" gap="3" p="3">
            {/* Metadata */}
            <Flex direction="column" gap="2">
              <Flex justify="between" align="center">
                <Text size="2" color="gray" weight="medium">Duration</Text>
                <Text size="2" color="gray">
                  {formatDate(startDate)} – {formatDate(endDate)}
                </Text>
              </Flex>
              
              <Flex justify="between" align="center">
                <Text size="2" color="gray" weight="medium">Type</Text>
                <ExperimentTypeBadge type={type} />
              </Flex>
              
              <Flex justify="between" align="center">
                <Text size="2" color="gray" weight="medium">Source</Text>
                <Badge variant="soft" color="blue" asChild>
                  <Link href={`/datasources/${datasourceId}`}>
                    <Flex align="center" gap="1">
                      <TableIcon width="12" height="12" />
                      {datasource}
                    </Flex>
                  </Link>
                </Badge>
              </Flex>
              
              <Flex justify="between" align="center">
                <Text size="2" color="gray" weight="medium">Participants</Text>
                <Badge variant="soft" color="green" asChild>
                  <Link href={`/datasources/${datasourceId}/participants/${participantType}`}>
                    <Flex align="center" gap="1">
                      <PersonIcon width="12" height="12" />
                      {participantType}
                    </Flex>
                  </Link>
                </Badge>
              </Flex>
            </Flex>

            {/* Hypothesis */}
            <Box>
              <Text size="1" weight="medium" color="gray" mb="1">Hypothesis</Text>
              <ReadMoreText text={hypothesis} maxWords={10} />
            </Box>
          </Flex>
        </Box>
      </Card>
  
  );
}