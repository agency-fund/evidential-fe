'use client';
import { Card, Flex, Heading, IconButton, Separator, Text, Tooltip } from '@radix-ui/themes';
import { CalendarIcon, EyeOpenIcon, LightningBoltIcon, FileTextIcon } from '@radix-ui/react-icons';
import { ReadMoreText } from '@/components/ui/read-more-text';
import { ExperimentActionsMenu } from '@/components/features/experiments/experiment-actions-menu';
import { DownloadAssignmentsCsvButton } from '@/components/features/experiments/download-assignments-csv-button';
import { ExperimentTypeBadge } from '@/components/features/experiments/experiment-type-badge';
import {
  ExperimentStatusBadge,
  type ExperimentStatus,
} from '@/components/features/experiments/experiment-status-badge';
import { formatIsoDateLocal } from '@/services/date-utils';
import Link from 'next/link';

interface ExperimentCardProps {
  title: string;
  hypothesis: string;
  type: string;
  startDate: string;
  endDate: string;
  status: ExperimentStatus;
  datasourceId: string;
  designUrl?: string;
  experimentId: string;
  organizationId: string;
}

export function ExperimentCard({
  title,
  hypothesis,
  type,
  startDate,
  endDate,
  status,
  datasourceId,
  designUrl,
  experimentId,
  organizationId,
}: ExperimentCardProps) {
  return (
    <Card size="3">
      <Flex height={'100%'} direction="column">
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center">
            <Flex minWidth={'0'} align="center" gap="2">
              <LightningBoltIcon width="16" height="16" color="var(--blue-9)" style={{ flexShrink: 0 }} />
              <Tooltip content={title}>
                <Heading as="h3" size="4" weight="medium" truncate asChild>
                  <Link
                    href={`/datasources/${datasourceId}/experiments/${experimentId}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    {title}
                  </Link>
                </Heading>
              </Tooltip>
            </Flex>

            <Flex align="center" gap="3" flexShrink={'0'}>
              <ExperimentStatusBadge status={status} />

              <ExperimentActionsMenu
                organizationId={organizationId}
                datasourceId={datasourceId}
                experimentId={experimentId}
              />
            </Flex>
          </Flex>

          <Flex align="center" gap="2">
            <CalendarIcon width="14" height="14" color="var(--gray-9)" />
            <Text size="2" color="gray">
              {formatIsoDateLocal(startDate)} - {formatIsoDateLocal(endDate)}
            </Text>
          </Flex>

          <Flex align="center">
            <ExperimentTypeBadge type={type} />
          </Flex>

          <Separator size="4" />

          <Flex direction="column" gap="3">
            <Text size="2" weight="bold">
              Hypothesis
            </Text>
            <ReadMoreText text={hypothesis} maxWords={30} />
          </Flex>
        </Flex>

        <Flex justify="end" gap="2" pt="4">
          {designUrl && (
            <Tooltip content="View design document">
              <IconButton variant="soft" color="blue" size="2" asChild>
                <Link href={designUrl} target="_blank" rel="noopener noreferrer">
                  <FileTextIcon width="16" height="16" />
                </Link>
              </IconButton>
            </Tooltip>
          )}

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
