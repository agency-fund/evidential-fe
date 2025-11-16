'use client';
import { Table, Text, Flex, Tooltip } from '@radix-ui/themes';
import {
  ExperimentStatusBadge,
  type ExperimentStatus,
} from '@/components/features/experiments/experiment-status-badge';
import { ExperimentTypeBadge } from '@/components/features/experiments/experiment-type-badge';
import { ParticipantTypeBadge } from '@/components/features/participants/participant-type-badge';
import { DatasourceBadge } from '@/components/features/datasources/datasource-badge';
import { ExperimentActionsMenu } from '@/components/features/experiments/experiment-actions-menu';
import { formatIsoDateLocal } from '@/services/date-utils';
import Link from 'next/link';

interface ExperimentTableRowProps {
  title: string;
  hypothesis: string;
  type: string;
  status: ExperimentStatus;
  startDate: string;
  endDate: string;
  datasource: string;
  datasourceId: string;
  organizationId: string;
  designUrl?: string;
  participantType: string;
  experimentId: string;
}

export function ExperimentsTableRow({
  title,
  hypothesis,
  type,
  status,
  startDate,
  endDate,
  datasource,
  datasourceId,
  organizationId,
  designUrl,
  participantType,
  experimentId,
}: ExperimentTableRowProps) {
  return (
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
      <Table.Cell>{hypothesis}</Table.Cell>
      <Table.Cell>{formatIsoDateLocal(startDate)}</Table.Cell>
      <Table.Cell>{formatIsoDateLocal(endDate)}</Table.Cell>
      <Table.Cell>
        <DatasourceBadge datasourceId={datasourceId} datasourceName={datasource} />
      </Table.Cell>
      <Table.Cell>
        <ParticipantTypeBadge datasourceId={datasourceId} participantType={participantType} />
      </Table.Cell>
      <Table.Cell>
        <ExperimentTypeBadge type={type} />
      </Table.Cell>
      <Table.Cell>
        <ExperimentActionsMenu
          datasourceId={datasourceId}
          experimentId={experimentId}
          organizationId={organizationId}
          designUrl={designUrl}
        />
      </Table.Cell>
    </Table.Row>
  );
}
