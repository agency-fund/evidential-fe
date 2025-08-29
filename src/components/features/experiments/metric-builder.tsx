'use client';

import { Badge, Button, Flex, Grid, Table, Text, TextField } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import { FrequentABFormData } from '@/app/datasources/[datasourceId]/experiments/create/types';
import { GetMetricsResponseElement } from '@/api/methods.schemas';
import { ClickableBadge } from '@/components/features/experiments/clickable-badge';

const DEFAULT_MDE = '10';

type MetricBuilderProps = {
  formData: FrequentABFormData;
  onFormDataChange: (data: FrequentABFormData) => void;
  metricFields: GetMetricsResponseElement[];
};

export function MetricBuilder({ formData, onFormDataChange, metricFields }: MetricBuilderProps) {
  const handlePrimaryMetricSelect = (metricName: string) => {
    onFormDataChange({
      ...formData,
      primaryMetric: { metricName, mde: DEFAULT_MDE },
    });
  };

  const handlePrimaryMetricDeselect = () => {
    onFormDataChange({
      ...formData,
      primaryMetric: undefined,
    });
  };

  const handleSecondaryMetricAdd = (metricName: string) => {
    const newSecondaryMetrics = [...formData.secondaryMetrics, { metricName, mde: DEFAULT_MDE }];
    onFormDataChange({ ...formData, secondaryMetrics: newSecondaryMetrics });
  };

  const handleSecondaryMetricRemove = (metricName: string) => {
    const newSecondaryMetrics = formData.secondaryMetrics.filter((m) => m.metricName !== metricName);
    onFormDataChange({ ...formData, secondaryMetrics: newSecondaryMetrics });
  };

  const handleMdeChange = (type: 'primary' | 'secondary', metricName: string, mde: string) => {
    if (type === 'primary' && formData.primaryMetric) {
      onFormDataChange({
        ...formData,
        primaryMetric: {
          metricName: formData.primaryMetric?.metricName || '',
          mde: mde || '',
        },
      });
    } else if (type === 'secondary') {
      const newSecondaryMetrics = formData.secondaryMetrics.map((m) =>
        m.metricName === metricName ? { ...m, mde } : m,
      );
      onFormDataChange({ ...formData, secondaryMetrics: newSecondaryMetrics });
    }
  };

  // Determine metrics available for primary selection (all metrics not in secondaryMetrics)
  const availablePrimaryMetricBadges = metricFields
    .filter((m) => !formData.secondaryMetrics.some((sm) => sm.metricName === m.field_name))
    .toSorted((a, b) => a.field_name.localeCompare(b.field_name));

  // Determine metrics available for secondary selection
  const availableSecondaryMetricBadges = metricFields
    .filter(
      (m) =>
        m.field_name !== formData.primaryMetric?.metricName &&
        !formData.secondaryMetrics.some((sm) => sm.metricName === m.field_name),
    )
    .toSorted((a, b) => a.field_name.localeCompare(b.field_name));

  return (
    <Grid columns={'2'} gap={'4'}>
      <Table.Root layout={'fixed'}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Metric</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>
              Minimum Effect
              <br />
              (% change)
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell> </Table.ColumnHeaderCell>
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
                  {formData.primaryMetric?.metricName} <Badge color={'green'}>Primary</Badge>
                </Table.Cell>
                <Table.Cell>
                  <TextField.Root
                    type={'number'}
                    value={formData.primaryMetric?.mde}
                    onChange={(e) => handleMdeChange('primary', formData.primaryMetric!.metricName, e.target.value)}
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
              .toSorted((a, b) => a.metricName.localeCompare(b.metricName))
              .map((selectedMetric) => (
                <Table.Row key={selectedMetric.metricName}>
                  <Table.Cell>
                    <Text size="3">{selectedMetric.metricName}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <TextField.Root
                      type="number"
                      value={selectedMetric.mde}
                      onChange={(e) => handleMdeChange('secondary', selectedMetric.metricName, e.target.value)}
                      placeholder="MDE %"
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      variant="soft"
                      color="red"
                      onClick={(event) => {
                        event.preventDefault();
                        handleSecondaryMetricRemove(selectedMetric.metricName);
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
    </Grid>
  );
}
