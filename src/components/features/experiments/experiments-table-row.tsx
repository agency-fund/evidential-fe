'use client';

import Link from 'next/link';
import { Flex, IconButton, Table, Text, Tooltip } from '@radix-ui/themes';
import { FileTextIcon } from '@radix-ui/react-icons';
import { ExperimentStatusBadge } from '@/components/features/experiments/experiment-status-badge';
import { ExperimentImpactBadge } from '@/components/features/experiments/experiment-impact-badge';
import { ExperimentTypeBadge } from '@/components/features/experiments/experiment-type-badge';
import { DownloadAssignmentsCsvButton } from '@/components/features/experiments/download-assignments-csv-button';
import { formatIsoDateLocal } from '@/services/date-utils';
import { ExperimentWithStatus } from '@/components/features/experiments/types';

interface ExperimentTableRowProps {
  experiment: ExperimentWithStatus;
}

export function ExperimentsTableRow({ experiment }: ExperimentTableRowProps) {
  const { experiment_id: experimentId, datasource_id: datasourceId, design_spec } = experiment;
  return (
    <>
      <Table.Row>
        <Table.Cell>
          <Flex width="200px">
            <Tooltip content={design_spec.experiment_name}>
              <Text truncate asChild>
                <Link href={`/datasources/${datasourceId}/experiments/${experimentId}`}>
                  {design_spec.experiment_name}
                </Link>
              </Text>
            </Tooltip>
          </Flex>
        </Table.Cell>
        <Table.Cell>
          <ExperimentStatusBadge status={experiment.status} />
        </Table.Cell>
        <Table.Cell>{formatIsoDateLocal(design_spec.start_date)}</Table.Cell>
        <Table.Cell>{formatIsoDateLocal(design_spec.end_date)}</Table.Cell>
        <Table.Cell>
          {experiment.impact ? (
            <ExperimentImpactBadge impact={experiment.impact} short={true} />
          ) : (
            <Text color="gray">Ongoing</Text>
          )}
        </Table.Cell>
        <Table.Cell>
          <Flex width="150px">
            <Text truncate color={experiment.decision ? undefined : 'gray'}>
              {experiment.decision || 'Ongoing'}
            </Text>
          </Flex>
        </Table.Cell>
        <Table.Cell>
          <ExperimentTypeBadge type={design_spec.experiment_type} />
        </Table.Cell>
        <Table.Cell>
          <Flex gap="2">
            <DownloadAssignmentsCsvButton datasourceId={datasourceId} experimentId={experimentId} />
            {design_spec.design_url && (
              <Tooltip content="View design document">
                <IconButton variant="soft" color="blue" size="2" asChild>
                  <Link href={design_spec.design_url} target="_blank" rel="noopener noreferrer">
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
