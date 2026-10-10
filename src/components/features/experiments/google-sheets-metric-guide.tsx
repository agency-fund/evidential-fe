import { FieldMetadata } from '@/api/methods.schemas';
import { Card, Code, Flex, Table, Text } from '@radix-ui/themes';

const EXAMPLE_METRICS = [
  {
    fieldName: 'minutes_on_site_last_7_days',
    label: 'Minutes spent on site in the last 7 days',
    useCase: 'Websites and apps',
    description: 'Minutes per participant over 7 days. Higher means more engagement.',
  },
  {
    fieldName: 'customer_satisfaction_1_to_5',
    label: 'Customer satisfaction (1–5)',
    useCase: 'Customer experience',
    description: 'Satisfaction per participant, rated 1–5. Higher is better.',
  },
  {
    fieldName: 'revenue_last_7_days',
    label: 'Revenue in the last 7 days',
    useCase: 'Commerce and fundraising',
    description: 'Revenue per participant over 7 days. Use one currency.',
  },
  {
    fieldName: 'purchases_last_7_days',
    label: 'Purchases in the last 7 days',
    useCase: 'Commerce',
    description: 'Purchases per participant over 7 days. Zero means none.',
  },
  {
    fieldName: 'support_resolution_hours',
    label: 'Time to resolve a support request (hours)',
    useCase: 'Support teams',
    description: 'Hours to resolve a participant’s support request. Lower is better.',
  },
  {
    fieldName: 'assessment_score_0_to_100',
    label: 'Assessment score (0–100)',
    useCase: 'Education and training',
    description: 'Assessment score per participant, 0–100. Higher is better.',
  },
  {
    fieldName: 'onboarded_within_1_week',
    label: 'Onboarded within one week',
    useCase: 'Onboarding and activation',
    description: '1 if onboarded within 7 days; 0 if not after 7 days. Blank while unknown.',
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
          Choose a primary outcome and optional secondary metrics. Enter results per participant; Evidential compares
          them across arms.
        </Text>
        <Text size="2">
          Leave “Cluster key” empty to assign individuals. Use “Strata” to balance groups across arms, or “Cluster key”
          to assign whole groups together.
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
          Setup baseline: the column’s current average, used for sample size planning. “Minimum Effect” is the relative
          change to detect (initially 10%). The experiment’s baseline arm is the control group.
        </Text>
        <Text size="2">
          Blank outcomes are missing; zero is a result. If all are blank, click “Estimate Sample Size” and choose the
          maximum available or a custom size. Power needs observed values; comparisons need results in both arms.
        </Text>
      </Flex>
    </Card>
  );
}
