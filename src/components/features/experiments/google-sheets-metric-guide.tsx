import { FieldMetadata } from '@/api/methods.schemas';
import { Card, Code, Flex, Table, Text } from '@radix-ui/themes';

const EXAMPLE_METRICS = [
  {
    fieldName: 'minutes_on_site_last_7_days',
    label: 'Minutes spent on site in the last 7 days',
    useCase: 'Websites and apps',
    description: 'Total minutes per participant over the last 7 days. Higher means more engagement.',
  },
  {
    fieldName: 'customer_satisfaction_1_to_5',
    label: 'Customer satisfaction (1–5)',
    useCase: 'Customer experience',
    description: 'Each participant’s satisfaction rating, from 1 to 5. Higher means more satisfied.',
  },
  {
    fieldName: 'revenue_last_7_days',
    label: 'Revenue in the last 7 days',
    useCase: 'Commerce and fundraising',
    description: 'Revenue per participant over the last 7 days, using one currency throughout the sheet.',
  },
  {
    fieldName: 'purchases_last_7_days',
    label: 'Purchases in the last 7 days',
    useCase: 'Commerce',
    description: 'Number of purchases per participant over the last 7 days. Zero means no purchases.',
  },
  {
    fieldName: 'support_resolution_hours',
    label: 'Time to resolve a support request (hours)',
    useCase: 'Support teams',
    description: 'Hours to resolve each participant’s support request. Lower means faster resolution.',
  },
  {
    fieldName: 'assessment_score_0_to_100',
    label: 'Assessment score (0–100)',
    useCase: 'Education and training',
    description: 'Each participant’s assessment score, from 0 to 100. Higher means a better score.',
  },
  {
    fieldName: 'onboarded_within_1_week',
    label: 'Onboarded within one week',
    useCase: 'Onboarding and activation',
    description:
      'Leave blank while unknown. Enter 1 for onboarding within 7 days, or 0 once 7 days elapsed without onboarding.',
  },
];

export function describeGoogleSheetsMetrics(fields: FieldMetadata[]): FieldMetadata[] {
  return fields.map((field) => ({
    ...field,
    description:
      field.description || EXAMPLE_METRICS.find((metric) => metric.fieldName === field.field_name)?.description || '',
  }));
}

export function GoogleSheetsMetricGuide({ metricFields }: { metricFields: FieldMetadata[] }) {
  const examples = EXAMPLE_METRICS.filter((metric) =>
    metricFields.some((field) => field.field_name === metric.fieldName),
  );

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Text weight="bold">What do you want to measure?</Text>
        <Text size="2">
          Choose one outcome as your primary metric. You can add others as secondary metrics. Enter each participant’s
          results in the sheet; Evidential compares the selected outcomes between your experiment arms.
        </Text>
        <Text size="2">
          For individual assignment, leave “Cluster key” empty. You can use region under “Strata” to balance regions
          across arms. Selecting region as the cluster key assigns whole regions together.
        </Text>
        {examples.length > 0 && (
          <Table.Root size="1">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Example outcome</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Sheet column</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Useful for</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {examples.map((metric) => (
                <Table.Row key={metric.fieldName}>
                  <Table.Cell>{metric.label}</Table.Cell>
                  <Table.Cell>
                    <Code>{metric.fieldName}</Code>
                  </Table.Cell>
                  <Table.Cell>{metric.useCase}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
        <Text size="2">
          During setup, the baseline is the average of the selected column’s current values, used to plan sample size.
          “Minimum Effect” starts at 10%: the relative change you want to detect. During the experiment, the baseline
          arm is the control group you compare against.
        </Text>
        <Text size="2">
          Outcome cells can be blank until results arrive. Blank means missing; zero is an observed result. If all
          outcomes are blank, click “Estimate Sample Size”, then choose the maximum available or a custom sample size
          for your demo. Power estimates will be unavailable until you have enough observed values; comparisons need
          results in both arms.
        </Text>
      </Flex>
    </Card>
  );
}
