'use client';
import { Badge, Card, Flex, Heading, IconButton, Separator, Text, Tooltip } from '@radix-ui/themes';
import {
  CalendarIcon,
  ComponentInstanceIcon,
  EyeOpenIcon,
  LightningBoltIcon,
  PersonIcon,
  TableIcon,
} from '@radix-ui/react-icons';
import { ReadMoreText } from '@/components/ui/read-more-text';
import { ExperimentActionsMenu } from '@/components/features/experiments/experiment-actions-menu';
import { DownloadAssignmentsCsvButton } from '@/components/features/experiments/download-assignments-csv-button';
import Link from 'next/link';

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

const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

const getExperimentStatus = (startDate: string, endDate: string) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) {
    return 'Upcoming';
  } else if (now > end) {
    return 'Finished';
  } else {
    return 'Current';
  }
};

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'Current':
      return 'green';
    case 'Upcoming':
      return 'gray';
    case 'Finished':
      return 'blue';
    default:
      return 'gray';
  }
};

export default function ExperimentCard({
  title,
  hypothesis,
  type,
  startDate,
  endDate,
  datasource,
  datasourceId,
  participantType,
  experimentId,
  organizationId,
}: ExperimentCardProps) {
  const status = getExperimentStatus(startDate, endDate);
  const statusBadgeColor = getStatusBadgeColor(status);
  return (
    <Card size="3">
      <Flex height={'100%'} direction="column">
        {/* Content area that grows to fill space */}
        <Flex direction="column" gap="4">
          {/* Header with title, status, and dots menu */}
          <Flex justify="between" align="center">
            <Flex minWidth={'0'} align="center" gap="2">
              <LightningBoltIcon width="16" height="16" color="var(--blue-9)" style={{ flexShrink: 0 }} />
              <Tooltip content={title}>
                <Heading
                  as="h3"
                  size="4"
                  weight="medium"
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minWidth: 0,
                  }}
                  asChild
                >
                  <Link
                    href={`/datasources/${datasourceId}/experiments/${experimentId}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    {title}
                  </Link>
                </Heading>
              </Tooltip>
            </Flex>

            {/* Right side: Status badge and actions menu */}
            <Flex align="center" gap="3" flexShrink={'0'}>
              <Badge color={statusBadgeColor} variant="soft">
                {status}
              </Badge>

              <ExperimentActionsMenu
                organizationId={organizationId}
                datasourceId={datasourceId}
                experimentId={experimentId}
              />
            </Flex>
          </Flex>

          {/* Date range - moved to top */}
          <Flex align="center" gap="2">
            <CalendarIcon width="14" height="14" color="var(--gray-9)" />
            <Text size="2" color="gray">
              {formatDate(startDate)} - {formatDate(endDate)}
            </Text>
          </Flex>

          {/* Metadata badges with separators */}
          <Flex align="center" gap="2" wrap="wrap">
            <Badge variant="soft" color="gray" size="1" asChild>
              <Link href={`/datasources/${datasourceId}`}>
                <TableIcon width="12" height="12" />
                {datasource}
              </Link>
            </Badge>
            <Text size="2" color="gray">
              •
            </Text>
            <Badge variant="soft" color="blue" size="1" asChild>
              <Link href={`/datasources/${datasourceId}`}>
                <PersonIcon width="12" height="12" />
                {participantType}
              </Link>
            </Badge>
            <Text size="2" color="gray">
              •
            </Text>
            <Badge variant="soft" color="orange" size="1">
              <ComponentInstanceIcon width="12" height="12" />
              {type==="freq_online" ? "Online" : type==="freq_preassigned" ? "Preassigned" : null}
            </Badge>
          </Flex>

          <Separator size="4" />

          {/* Hypothesis section - Hero content */}
          <Flex direction="column" gap="3">
            <Text size="2" weight="bold">
              Hypothesis
            </Text>
            <ReadMoreText text={hypothesis} maxWords={30} />
          </Flex>
        </Flex>

        {/* Bottom action buttons - always at bottom right */}
        <Flex justify="end" gap="2" pt="4">
          <Tooltip content="View experiment">
            <IconButton variant="soft" color="blue" size="2" asChild>
              <Link href={`/datasources/${datasourceId}/experiments/${experimentId}`}>
                <EyeOpenIcon width="16" height="16" />
              </Link>
            </IconButton>
          </Tooltip>

          <DownloadAssignmentsCsvButton datasourceId={datasourceId} experimentId={experimentId} />
        </Flex>
      </Flex>
    </Card>
  );
}
