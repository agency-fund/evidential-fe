'use client';

import { useState } from 'react';
import { Badge, Box, Flex, IconButton, Table, Text, TextField, Tooltip } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import { FieldMetadata } from '@/api/methods.schemas';
import { Combobox } from '@/components/ui/combobox';
import { DataTypeBadge } from '@/components/ui/data-type-badge';
import FieldDataCard from '@/components/ui/cards/field-data-card';
import { MetricWithMDE } from '@/app/experiments/create/experiment-form/experiment-form-types';

const DEFAULT_MDE = '10';

export type MetricBuilderAction =
  | { type: 'primary-metric-select'; primaryMetric: MetricWithMDE }
  | { type: 'primary-metric-deselect'; primaryMetric: MetricWithMDE | undefined; secondaryMetrics: MetricWithMDE[] }
  | { type: 'promote-secondary-to-primary'; primaryMetric: MetricWithMDE; secondaryMetrics: MetricWithMDE[] }
  | { type: 'secondary-metric-add'; secondaryMetrics: MetricWithMDE[] }
  | { type: 'secondary-metric-remove'; secondaryMetrics: MetricWithMDE[] }
  | { type: 'mde-change'; primaryMetric?: MetricWithMDE; secondaryMetrics?: MetricWithMDE[] };

const getSearchTextFromOption = (option: FieldMetadata) => option.field_name;

interface MetricComboboxRowProps {
  metric: FieldMetadata;
}

const MetricComboboxRow = ({ metric }: MetricComboboxRowProps) => {
  return (
    <Flex gap="2" align="center" justify="between" wrap="nowrap">
      <Text size="2">{metric.field_name}</Text>
      <DataTypeBadge type={metric.data_type} />
    </Flex>
  );
};

type MetricBuilderProps = {
  primaryMetric: MetricWithMDE | undefined;
  secondaryMetrics: MetricWithMDE[];
  dispatch: (action: MetricBuilderAction) => void;
  metricFields: FieldMetadata[];
  excludeKeys?: string[];
};

export function MetricBuilder({
  primaryMetric,
  secondaryMetrics,
  dispatch,
  metricFields,
  excludeKeys,
}: MetricBuilderProps) {
  const [searchText, setSearchText] = useState('');

  // Fields not yet selected as a metric and not otherwise excluded (e.g. primary key).
  const comboboxOptions = metricFields
    .filter(
      (m) =>
        m.field_name !== primaryMetric?.metric.field_name &&
        !excludeKeys?.includes(m.field_name) &&
        !secondaryMetrics.some((sm) => sm.metric.field_name === m.field_name),
    )
    .toSorted((a, b) => a.field_name.localeCompare(b.field_name));

  const handlePrimaryMetricSelect = (metric: FieldMetadata) => {
    dispatch({ type: 'primary-metric-select', primaryMetric: { metric, mde: DEFAULT_MDE } });
  };

  const handlePrimaryMetricDeselect = () => {
    const [nextPrimary, ...remainingSecondary] = secondaryMetrics.toSorted((a, b) =>
      a.metric.field_name.localeCompare(b.metric.field_name),
    );

    if (nextPrimary) {
      dispatch({
        type: 'primary-metric-deselect',
        primaryMetric: { metric: nextPrimary.metric, mde: nextPrimary.mde },
        secondaryMetrics: remainingSecondary,
      });
      return;
    }

    dispatch({
      type: 'primary-metric-deselect',
      primaryMetric: undefined,
      secondaryMetrics: [],
    });
  };

  const handlePromoteSecondaryToPrimary = (metricName: string) => {
    const metricToPromote = secondaryMetrics.find((m) => m.metric.field_name === metricName)!;
    const currentPrimary = primaryMetric!;

    const newSecondaryMetrics = secondaryMetrics
      .filter((m) => m.metric.field_name !== metricName)
      .concat([{ metric: currentPrimary.metric, mde: currentPrimary.mde }]);

    dispatch({
      type: 'promote-secondary-to-primary',
      primaryMetric: { metric: metricToPromote.metric, mde: metricToPromote.mde },
      secondaryMetrics: newSecondaryMetrics,
    });
  };

  const handleSecondaryMetricAdd = (metric: FieldMetadata) => {
    const newSecondaryMetrics = [...secondaryMetrics, { metric, mde: DEFAULT_MDE }];
    dispatch({ type: 'secondary-metric-add', secondaryMetrics: newSecondaryMetrics });
  };

  const handleSecondaryMetricRemove = (metricName: string) => {
    const newSecondaryMetrics = secondaryMetrics.filter((m) => m.metric.field_name !== metricName);
    dispatch({ type: 'secondary-metric-remove', secondaryMetrics: newSecondaryMetrics });
  };

  const handleMdeChange = (type: 'primary' | 'secondary', metricName: string, mde: string) => {
    if (type === 'primary' && primaryMetric) {
      dispatch({
        type: 'mde-change',
        primaryMetric: {
          metric: primaryMetric.metric,
          mde: mde || '',
        },
      });
    } else if (type === 'secondary') {
      const newSecondaryMetrics = secondaryMetrics.map((m) => (m.metric.field_name === metricName ? { ...m, mde } : m));
      dispatch({ type: 'mde-change', secondaryMetrics: newSecondaryMetrics });
    }
  };

  // The first metric added becomes the primary metric; later ones are secondary.
  const handleMetricAdd = (value: string, fieldName?: string) => {
    setSearchText(value);
    if (!fieldName) return;
    const toAdd = comboboxOptions.find((f) => f.field_name === fieldName);
    if (!toAdd) return;

    if (primaryMetric) {
      handleSecondaryMetricAdd(toAdd);
    } else {
      handlePrimaryMetricSelect(toAdd);
    }
    setSearchText('');
  };

  return metricFields.length === 0 ? (
    <Text color="gray" size="2">
      No metrics available for this table.
    </Text>
  ) : (
    <Flex direction="column" gap="3" overflowX="auto">
      <Flex gap="2" align="center">
        <Text as="label" size="2" weight="bold">
          Add metric:
        </Text>
        <Combobox<FieldMetadata>
          value={searchText}
          onChange={handleMetricAdd}
          options={comboboxOptions}
          getDisplayTextForOption={getSearchTextFromOption}
          getKeyForOption={getSearchTextFromOption}
          placeholder="Search fields..."
          noMatchText="No available metrics"
          dropdownRow={({ option }) => <MetricComboboxRow metric={option} />}
          disabled={comboboxOptions.length === 0}
        />
      </Flex>
      {primaryMetric ? (
        <Box maxWidth="50%">
          <Table.Root layout="fixed">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell width="104px">Actions</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Metric</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell width="150px">
                  Minimum Effect
                  <br />
                  (% change)
                </Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <>
                <Table.Row align="center">
                  <Table.Cell>
                    <IconButton
                      variant="soft"
                      color="red"
                      onClick={(event) => {
                        event.preventDefault();
                        handlePrimaryMetricDeselect();
                      }}
                    >
                      <TrashIcon />
                    </IconButton>
                  </Table.Cell>
                  <Table.Cell>
                    <FieldDataCard
                      field={primaryMetric.metric}
                      trigger={
                        <Flex gap="2" align="center">
                          <Text style={{ cursor: 'pointer' }}>{primaryMetric.metric.field_name}</Text>
                          <Badge color="green">{'\u24F5'} Primary</Badge>
                        </Flex>
                      }
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <TextField.Root
                      type="number"
                      value={primaryMetric.mde}
                      onChange={(e) => handleMdeChange('primary', primaryMetric.metric.field_name, e.target.value)}
                      placeholder="MDE %"
                    />
                  </Table.Cell>
                </Table.Row>
                {secondaryMetrics
                  .toSorted((a, b) => a.metric.field_name.localeCompare(b.metric.field_name))
                  .map((selectedMetric) => (
                    <Table.Row key={selectedMetric.metric.field_name} align="center">
                      <Table.Cell>
                        <Flex gap="2">
                          <IconButton
                            variant="soft"
                            color="red"
                            onClick={(event) => {
                              event.preventDefault();
                              handleSecondaryMetricRemove(selectedMetric.metric.field_name);
                            }}
                          >
                            <TrashIcon />
                          </IconButton>
                          <Tooltip content="Make Primary">
                            <IconButton
                              variant="soft"
                              color="green"
                              onClick={(event) => {
                                event.preventDefault();
                                handlePromoteSecondaryToPrimary(selectedMetric.metric.field_name);
                              }}
                            >
                              {'\u24F5'}
                            </IconButton>
                          </Tooltip>
                        </Flex>
                      </Table.Cell>
                      <Table.Cell>
                        <FieldDataCard
                          field={selectedMetric.metric}
                          trigger={<Text style={{ cursor: 'pointer' }}>{selectedMetric.metric.field_name}</Text>}
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <TextField.Root
                          type="number"
                          value={selectedMetric.mde}
                          onChange={(e) =>
                            handleMdeChange('secondary', selectedMetric.metric.field_name, e.target.value)
                          }
                          placeholder="MDE %"
                        />
                      </Table.Cell>
                    </Table.Row>
                  ))}
              </>
            </Table.Body>
          </Table.Root>
        </Box>
      ) : null}
    </Flex>
  );
}
