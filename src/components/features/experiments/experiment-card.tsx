'use client';
import { Card, Flex, Heading, IconButton, Separator, Text, Tooltip } from '@radix-ui/themes';
import { CalendarIcon, EyeOpenIcon, FileTextIcon, LightningBoltIcon } from '@radix-ui/react-icons';
import { ExperimentActionsMenu } from '@/components/features/experiments/experiment-actions-menu';
import { DownloadAssignmentsCsvButton } from '@/components/features/experiments/download-assignments-csv-button';
import { ExperimentTypeBadge } from '@/components/features/experiments/experiment-type-badge';
import { ExperimentStatusBadge } from '@/components/features/experiments/experiment-status-badge';
import { ExperimentImpactBadge } from '@/components/features/experiments/experiment-impact-badge';
import type { ExperimentStatus } from '@/components/features/experiments/types';
import { formatIsoDateLocal } from '@/services/date-utils';
import Link from 'next/link';
import { Impact } from '@/api/methods.schemas';

interface ExperimentCardProps {
  title: string;
  hypothesis: string;
  type: string;
  startDate: string;
  endDate: string;
  status: ExperimentStatus;
  impact?: Impact;
  decision?: string;
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
  impact,
  decision,
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

          <Flex align="center" gap="2">
            <ExperimentTypeBadge type={type} />
            <Separator orientation="vertical" />
            {impact ? (
              <ExperimentImpactBadge impact={impact} />
            ) : (
              <Text size="2" color="gray">
                Ongoing
              </Text>
            )}
          </Flex>

          <Separator size="4" />

          <Flex direction="column" gap="3">
            <Flex direction="column" gap="1">
              <Text size="2" weight="bold">
                Hypothesis
              </Text>
              <Text size="2" truncate>
                {hypothesis}
              </Text>
            </Flex>
            <Flex direction="column" gap="1">
              <Text size="2" weight="bold">
                Decision
              </Text>
              <Text size="2" truncate color={decision ? undefined : 'gray'}>
                {decision || 'Ongoing'}
              </Text>
            </Flex>
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
