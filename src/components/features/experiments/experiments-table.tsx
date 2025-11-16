'use client';
import { Table } from '@radix-ui/themes';
import { ExperimentConfig } from '@/api/methods.schemas';
import { ExperimentsTableRow } from '@/components/features/experiments/experiments-table-row';
import { useListOrganizationDatasources } from '@/api/admin';
import type { ExperimentStatus } from '@/components/features/experiments/experiment-status-badge';

type ExperimentWithStatus = ExperimentConfig & {
  status: ExperimentStatus;
};

interface ExperimentTableProps {
  experiments: ExperimentWithStatus[];
  organizationId: string;
}

export function ExperimentsTable({ experiments, organizationId }: ExperimentTableProps) {
  const { data: datasourcesData } = useListOrganizationDatasources(organizationId, {
    swr: {
      enabled: !!organizationId,
    },
  });

  const datasourcesToName = new Map(datasourcesData?.items.map((e) => [e.id, e.name]) || []);

  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Title</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Hypothesis</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Start Date</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>End Date</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Datasource</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Participant Type</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Experiment Type</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {experiments.map((experiment) => (
          <ExperimentsTableRow
            key={experiment.experiment_id}
            title={experiment.design_spec.experiment_name}
            hypothesis={experiment.design_spec.description}
            type={experiment.design_spec.experiment_type}
            status={experiment.status}
            startDate={experiment.design_spec.start_date}
            endDate={experiment.design_spec.end_date}
            datasource={datasourcesToName.get(experiment.datasource_id) || experiment.datasource_id}
            datasourceId={experiment.datasource_id}
            organizationId={organizationId}
            designUrl={experiment.design_spec.design_url ?? undefined}
            participantType={experiment.design_spec.participant_type}
            experimentId={experiment.experiment_id}
          />
        ))}
      </Table.Body>
    </Table.Root>
  );
}
