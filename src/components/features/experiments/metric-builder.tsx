'use client';

import { Badge, Flex, Grid, IconButton, Table, Text, TextField, Tooltip } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import { MetricWithMDE } from '@/app/datasources/[datasourceId]/experiments/create/types';
import { GetMetricsResponseElement } from '@/api/methods.schemas';
import { ClickableBadge } from '@/components/features/experiments/clickable-badge';
import FieldDataCard from '@/components/ui/cards/field-data-card';

const DEFAULT_MDE = '10';

export type MetricBuilderAction =
  | { type: 'primary-metric-select'; primaryMetric: MetricWithMDE }
  | { type: 'primary-metric-deselect'; primaryMetric: MetricWithMDE | undefined; secondaryMetrics: MetricWithMDE[] }
  | { type: 'promote-secondary-to-primary'; primaryMetric: MetricWithMDE; secondaryMetrics: MetricWithMDE[] }
  | { type: 'secondary-metric-add'; secondaryMetrics: MetricWithMDE[] }
  | { type: 'secondary-metric-remove'; secondaryMetrics: MetricWithMDE[] }
  | { type: 'mde-change'; primaryMetric?: MetricWithMDE; secondaryMetrics?: MetricWithMDE[] };

type MetricBuilderProps = {
  primaryMetric: MetricWithMDE | undefined;
  secondaryMetrics: MetricWithMDE[];
  dispatch: (action: MetricBuilderAction) => void;
  metricFields: GetMetricsResponseElement[];
};

export function MetricBuilder({ primaryMetric, secondaryMetrics, dispatch, metricFields }: MetricBuilderProps) {
  const handlePrimaryMetricSelect = (metric: GetMetricsResponseElement) => {
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
      secondaryMetrics: [], // TODO: bug?
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

  const handleSecondaryMetricAdd = (metric: GetMetricsResponseElement) => {
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

  // Determine metrics available for primary selection (all metrics not in secondaryMetrics)
  const availablePrimaryMetricBadges = metricFields
    .filter((m) => !secondaryMetrics.some((sm) => sm.metric.field_name === m.field_name))
    .toSorted((a, b) => a.field_name.localeCompare(b.field_name));

  // Determine metrics available for secondary selection
  const availableSecondaryMetricBadges = metricFields
    .filter(
      (m) =>
        m.field_name !== primaryMetric?.metric.field_name &&
        !secondaryMetrics.some((sm) => sm.metric.field_name === m.field_name),
    )
    .toSorted((a, b) => a.field_name.localeCompare(b.field_name));

  return (
    <Grid columns="2" gap="4">
      <Table.Root layout="fixed">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell width="50%">Metric</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Minimum Effect (% change)</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <>
            {!primaryMetric && !secondaryMetrics.length && (
              <Table.Row>
                <Table.Cell>(no metrics selected)</Table.Cell>
                <Table.Cell></Table.Cell>
                <Table.Cell></Table.Cell>
              </Table.Row>
            )}
            {primaryMetric && (
              <Table.Row>
                <Table.Cell>
                  <FieldDataCard
                    field={primaryMetric.metric}
                    trigger={
                      <Flex gap="2">
                        <Text style={{ cursor: 'pointer' }}>{primaryMetric.metric.field_name}</Text>
                        <Badge color="green">{'\u24F5'} Primary</Badge>
                      </Flex>
                    }
                  />
                </Table.Cell>
                <Table.Cell>
                  <TextField.Root
                    type="number"
                    value={primaryMetric?.mde}
                    onChange={(e) => handleMdeChange('primary', primaryMetric!.metric.field_name, e.target.value)}
                    placeholder="MDE %"
                  />
                </Table.Cell>
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
              </Table.Row>
            )}
            {secondaryMetrics
              .toSorted((a, b) => a.metric.field_name.localeCompare(b.metric.field_name))
              .map((selectedMetric) => (
                <Table.Row key={selectedMetric.metric.field_name}>
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
                      onChange={(e) => handleMdeChange('secondary', selectedMetric.metric.field_name, e.target.value)}
                      placeholder="MDE %"
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <Flex gap="2">
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
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))}
          </>
        </Table.Body>
      </Table.Root>
      <Flex direction="column" gap="3" overflowX="auto">
        <Flex direction="column" gap="2">
          <Flex gap="2">
            <Text as="label" size="2" weight="bold">
              Select a metric:
            </Text>
          </Flex>
          {!primaryMetric ? (
            <>
              <Flex gap="2" wrap="wrap">
                {availablePrimaryMetricBadges.map((metric) => (
                  <ClickableBadge key={metric.field_name} input={metric} onClick={handlePrimaryMetricSelect} />
                ))}
                {metricFields.length === 0 && (
                  <Text color="gray" size="2">
                    No metrics available for this participant type.
                  </Text>
                )}
              </Flex>
            </>
          ) : availableSecondaryMetricBadges.length > 0 && primaryMetric ? (
            <>
              <Flex gap="2" wrap="wrap">
                {availableSecondaryMetricBadges.map((metric) => (
                  <ClickableBadge key={metric.field_name} input={metric} onClick={handleSecondaryMetricAdd} />
                ))}
              </Flex>
            </>
          ) : (
            <></>
          )}
        </Flex>
      </Flex>
    </Grid>
  );
}
