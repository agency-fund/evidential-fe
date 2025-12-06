'use client';

import Link from 'next/link';
import { Flex, IconButton, Table, Text, Tooltip } from '@radix-ui/themes';
import { FileTextIcon } from '@radix-ui/react-icons';
import { ExperimentStatusBadge } from '@/components/features/experiments/experiment-status-badge';
import { ExperimentImpactBadge } from '@/components/features/experiments/experiment-impact-badge';
import type { ExperimentStatus } from '@/components/features/experiments/types';
import { ExperimentTypeBadge } from '@/components/features/experiments/experiment-type-badge';
import { DownloadAssignmentsCsvButton } from '@/components/features/experiments/download-assignments-csv-button';
import { formatIsoDateLocal } from '@/services/date-utils';

interface ExperimentTableRowProps {
  title: string;
  hypothesis: string;
  decision?: string;
  type: string;
  status: ExperimentStatus;
  impact?: string;
  startDate: string;
  endDate: string;
  datasourceId: string;
  organizationId: string;
  designUrl?: string;
  experimentId: string;
}

export function ExperimentsTableRow({
  title,
  hypothesis,
  decision,
  type,
  status,
  impact,
  startDate,
  endDate,
  datasourceId,
  designUrl,
  experimentId,
}: ExperimentTableRowProps) {
  return (
    <>
      <Table.Row>
        <Table.Cell>
          <Flex width="150px">
            <Tooltip content={title}>
              <Text truncate asChild>
                <Link href={`/datasources/${datasourceId}/experiments/${experimentId}`}>{title}</Link>
              </Text>
            </Tooltip>
          </Flex>
        </Table.Cell>
        <Table.Cell>
          <ExperimentStatusBadge status={status} />
        </Table.Cell>
        <Table.Cell>
          <Flex width="150px">
            <Text truncate>{hypothesis}</Text>
          </Flex>
        </Table.Cell>
        <Table.Cell>{formatIsoDateLocal(startDate)}</Table.Cell>
        <Table.Cell>{formatIsoDateLocal(endDate)}</Table.Cell>
        <Table.Cell>
          {impact ? <ExperimentImpactBadge impact={impact} short={true} /> : <Text color="gray">Ongoing</Text>}
        </Table.Cell>
        <Table.Cell>
          <Flex width="150px">
            <Text truncate color={decision ? undefined : 'gray'}>
              {decision || 'Ongoing'}
            </Text>
          </Flex>
        </Table.Cell>
        <Table.Cell>
          <ExperimentTypeBadge type={type} />
        </Table.Cell>
        <Table.Cell>
          <Flex gap="2">
            <DownloadAssignmentsCsvButton datasourceId={datasourceId} experimentId={experimentId} />
            {designUrl && (
              <Tooltip content="View design document">
                <IconButton variant="soft" color="blue" size="2" asChild>
                  <Link href={designUrl} target="_blank" rel="noopener noreferrer">
                    <FileTextIcon width="16" height="16" />
                  </Link>
                </IconButton>
              </Tooltip>
            )}
          </Flex>
        </Table.Cell>
      </Table.Row>
    </>
  );
}
