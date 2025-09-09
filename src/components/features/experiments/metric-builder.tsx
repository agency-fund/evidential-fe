'use client';

import { Badge, Button, Flex, HoverCard, Table, Text, TextField } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import { FrequentABFormData } from '@/app/datasources/[datasourceId]/experiments/create/types';
import { GetMetricsResponseElement } from '@/api/methods.schemas';
import { ClickableBadge } from '@/components/features/experiments/clickable-badge';
import FieldDatalist from '@/components/ui/field-datalist';

const DEFAULT_MDE = '10';

type MetricBuilderProps = {
  formData: FrequentABFormData;
  onFormDataChange: (data: FrequentABFormData) => void;
  metricFields: GetMetricsResponseElement[];
};

export function MetricBuilder({ formData, onFormDataChange, metricFields }: MetricBuilderProps) {
  const handlePrimaryMetricSelect = (metric: GetMetricsResponseElement) => {
    onFormDataChange({
      ...formData,
      primaryMetric: { metric, mde: DEFAULT_MDE },
    });
  };

  const handlePrimaryMetricDeselect = () => {
    onFormDataChange({
      ...formData,
      primaryMetric: undefined,
    });
  };

  const handleSecondaryMetricAdd = (metric: GetMetricsResponseElement) => {
    const newSecondaryMetrics = [...formData.secondaryMetrics, { metric, mde: DEFAULT_MDE }];
    onFormDataChange({ ...formData, secondaryMetrics: newSecondaryMetrics });
  };

  const handleSecondaryMetricRemove = (metricName: string) => {
    const newSecondaryMetrics = formData.secondaryMetrics.filter((m) => m.metric.field_name !== metricName);
    onFormDataChange({ ...formData, secondaryMetrics: newSecondaryMetrics });
  };

  const handleMdeChange = (type: 'primary' | 'secondary', metricName: string, mde: string) => {
    if (type === 'primary' && formData.primaryMetric) {
      onFormDataChange({
        ...formData,
        primaryMetric: {
          metric: formData.primaryMetric.metric,
          mde: mde || '',
        },
      });
    } else if (type === 'secondary') {
      const newSecondaryMetrics = formData.secondaryMetrics.map((m) =>
        m.metric.field_name === metricName ? { ...m, mde } : m,
      );
      onFormDataChange({ ...formData, secondaryMetrics: newSecondaryMetrics });
    }
  };

  // Determine metrics available for primary selection (all metrics not in secondaryMetrics)
  const availablePrimaryMetricBadges = metricFields
    .filter((m) => !formData.secondaryMetrics.some((sm) => sm.metric.field_name === m.field_name))
    .toSorted((a, b) => a.field_name.localeCompare(b.field_name));

  // Determine metrics available for secondary selection
  const availableSecondaryMetricBadges = metricFields
    .filter(
      (m) =>
        m.field_name !== formData.primaryMetric?.metric.field_name &&
        !formData.secondaryMetrics.some((sm) => sm.metric.field_name === m.field_name),
    )
    .toSorted((a, b) => a.field_name.localeCompare(b.field_name));

  return (
    <Flex direction="column" gap="4">
      <Table.Root layout={'fixed'}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Metric</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell width="140px">Minimum Effect (% change)</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell width="64px"> </Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <>
            {!formData.primaryMetric && !formData.secondaryMetrics.length && (
              <Table.Row>
                <Table.Cell>(no metrics selected)</Table.Cell>
                <Table.Cell></Table.Cell>
                <Table.Cell></Table.Cell>
              </Table.Row>
            )}
            {formData.primaryMetric && (
              <Table.Row>
                <Table.Cell>
                  <HoverCard.Root key={formData.primaryMetric.metric.field_name}>
                    <HoverCard.Trigger>
                      <Flex gap="2">
                        <Text style={{ cursor: 'pointer' }}>{formData.primaryMetric.metric.field_name}</Text>
                        <Badge color={'green'}>Primary</Badge>
                      </Flex>
                    </HoverCard.Trigger>
                    <HoverCard.Content>
                      <FieldDatalist field={formData.primaryMetric.metric} variant="content" />
                    </HoverCard.Content>
                  </HoverCard.Root>
                </Table.Cell>
                <Table.Cell>
                  <TextField.Root
                    type={'number'}
                    value={formData.primaryMetric?.mde}
                    onChange={(e) =>
                      handleMdeChange('primary', formData.primaryMetric!.metric.field_name, e.target.value)
                    }
                    placeholder="MDE %"
                  />
                </Table.Cell>
                <Table.Cell>
                  <Button
                    variant="soft"
                    color="red"
                    onClick={(event) => {
                      event.preventDefault();
                      handlePrimaryMetricDeselect();
                    }}
                  >
                    <TrashIcon />
                  </Button>
                </Table.Cell>
              </Table.Row>
            )}
            {formData.secondaryMetrics
              .toSorted((a, b) => a.metric.field_name.localeCompare(b.metric.field_name))
              .map((selectedMetric) => (
                <Table.Row key={selectedMetric.metric.field_name}>
                  <Table.Cell>
                    <HoverCard.Root key={selectedMetric.metric.field_name}>
                      <HoverCard.Trigger>
                        <Text style={{ cursor: 'pointer' }}>{selectedMetric.metric.field_name}</Text>
                      </HoverCard.Trigger>
                      <HoverCard.Content>
                        <FieldDatalist field={selectedMetric.metric} variant="content" />
                      </HoverCard.Content>
                    </HoverCard.Root>
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
                    <Button
                      variant="soft"
                      color="red"
                      onClick={(event) => {
                        event.preventDefault();
                        handleSecondaryMetricRemove(selectedMetric.metric.field_name);
                      }}
                    >
                      <TrashIcon />
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
          </>
        </Table.Body>
      </Table.Root>
      <Flex direction="column" gap="3" overflowX={'auto'}>
        <Flex direction="column" gap="2">
          {!formData.primaryMetric ? (
            <>
              <Flex gap="2">
                <Text as={'label'} size={'2'} weight={'bold'}>
                  Select a primary metric:
                </Text>
              </Flex>
              <Flex gap={'2'} wrap={'wrap'}>
                {availablePrimaryMetricBadges.map((metric) => (
                  <ClickableBadge key={metric.field_name} input={metric} onClick={handlePrimaryMetricSelect} />
                ))}
                {availablePrimaryMetricBadges.length === 0 && metricFields.length > 0 && (
                  <Text color="gray" size="2">
                    All available metrics are selected as secondary. Deselect one to make it primary.
                  </Text>
                )}
                {metricFields.length === 0 && (
                  <Text color="gray" size="2">
                    No metrics available for this participant type.
                  </Text>
                )}
              </Flex>
            </>
          ) : availableSecondaryMetricBadges.length > 0 && formData.primaryMetric ? (
            <>
              <Flex gap={'2'}>
                <Text as="label" size="2" weight="bold">
                  Add optional secondary metrics:
                </Text>
              </Flex>
              <Flex gap="2" wrap={'wrap'}>
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
    </Flex>
  );
}
