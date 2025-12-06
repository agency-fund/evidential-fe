'use client';
import { useState } from 'react';
import { Flex, Table, Text } from '@radix-ui/themes';
import { CaretDownIcon, CaretSortIcon, CaretUpIcon } from '@radix-ui/react-icons';
import { ExperimentsTableRow } from '@/components/features/experiments/experiments-table-row';
import type { ExperimentWithStatus } from '@/components/features/experiments/types';

const IMPACT_ORDERING = ['high', 'medium', 'low', 'negative', 'unclear'];

interface ExperimentTableProps {
  experiments: ExperimentWithStatus[];
  organizationId: string;
}

type SortDirection = 'asc' | 'desc';

interface SortableColumn {
  label: string;
  sortable: true;
  sortKey: string;
  sortType: 'string' | 'date';
  getSortValue: (experiment: ExperimentWithStatus) => string | undefined;
}

interface NonSortableColumn {
  label: string;
  sortable: false;
}

type ColumnConfig = SortableColumn | NonSortableColumn;

const COLUMN_CONFIG: ColumnConfig[] = [
  {
    label: 'Title',
    sortable: true,
    sortKey: 'title',
    sortType: 'string',
    getSortValue: (experiment: ExperimentWithStatus) => experiment.design_spec.experiment_name,
  },
  {
    label: 'Status',
    sortable: true,
    sortKey: 'status',
    sortType: 'string',
    getSortValue: (experiment: ExperimentWithStatus) => experiment.status,
  },
  { label: 'Hypothesis', sortable: false },
  {
    label: 'Start Date',
    sortable: true,
    sortKey: 'startDate',
    sortType: 'date',
    getSortValue: (experiment: ExperimentWithStatus) => experiment.design_spec.start_date,
  },
  {
    label: 'End Date',
    sortable: true,
    sortKey: 'endDate',
    sortType: 'date',
    getSortValue: (experiment: ExperimentWithStatus) => experiment.design_spec.end_date,
  },
  {
    label: 'Impact',
    sortable: true,
    sortKey: 'impact',
    sortType: 'string',
    getSortValue: (experiment: ExperimentWithStatus) => {
      if (experiment.impact === undefined) {
        return undefined;
      }
      const pos = IMPACT_ORDERING.indexOf(experiment.impact || '');
      if (pos === -1) {
        return 'a' + experiment.impact; // unrecognized impacts
      }
      return String.fromCharCode('b'.charCodeAt(0) + pos); // standard impacts
    },
  },
  { label: 'Decision', sortable: false },
  {
    label: 'Experiment Type',
    sortable: true,
    sortKey: 'experimentType',
    sortType: 'string',
    getSortValue: (experiment: ExperimentWithStatus) => experiment.design_spec.experiment_type,
  },
  { label: 'Actions', sortable: false },
];

const compareStrings = (a: string, b: string): number => {
  return a.localeCompare(b);
};

const compareDates = (a: string, b: string): number => {
  const aDate = new Date(a);
  const bDate = new Date(b);
  return aDate.getTime() - bDate.getTime();
};

export function ExperimentsTable({ experiments, organizationId }: ExperimentTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(null);

  const handleSort = (sortKey: string) => {
    if (sortColumn === sortKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(sortKey);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (columnSortKey: string) => {
    if (sortColumn !== columnSortKey) {
      return <CaretSortIcon />;
    }

    if (sortDirection === 'asc') {
      return <CaretUpIcon />;
    }

    if (sortDirection === 'desc') {
      return <CaretDownIcon />;
    }

    return <CaretSortIcon />;
  };

  const getSortedExperiments = () => {
    if (sortColumn === null) {
      return experiments;
    }

    const column = COLUMN_CONFIG.find((col) => col.sortable && col.sortKey === sortColumn);
    if (!column || !('getSortValue' in column)) {
      return experiments;
    }

    return experiments.toSorted((a, b) => {
      const aValue = column.getSortValue(a);
      const bValue = column.getSortValue(b);

      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      const comparison = column.sortType === 'date' ? compareDates(aValue, bValue) : compareStrings(aValue, bValue);

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const sortedExperiments = getSortedExperiments();

  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          {COLUMN_CONFIG.map((column) =>
            column.sortable ? (
              <Table.ColumnHeaderCell key={column.label} onClick={() => handleSort(column.sortKey)}>
                <Flex align="center" gap="2">
                  <Text wrap="nowrap">{column.label}</Text>
                  {getSortIcon(column.sortKey)}
                </Flex>
              </Table.ColumnHeaderCell>
            ) : (
              <Table.ColumnHeaderCell key={column.label}>{column.label}</Table.ColumnHeaderCell>
            ),
          )}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {sortedExperiments.map((experiment) => (
          <ExperimentsTableRow
            key={experiment.experiment_id}
            title={experiment.design_spec.experiment_name}
            hypothesis={experiment.design_spec.description}
            decision={experiment.decision}
            type={experiment.design_spec.experiment_type}
            status={experiment.status}
            impact={experiment.impact}
            startDate={experiment.design_spec.start_date}
            endDate={experiment.design_spec.end_date}
            datasourceId={experiment.datasource_id}
            organizationId={organizationId}
            designUrl={experiment.design_spec.design_url ?? undefined}
            experimentId={experiment.experiment_id}
          />
        ))}
      </Table.Body>
    </Table.Root>
  );
}
