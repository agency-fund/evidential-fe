import { ExperimentFormData } from '@/app/experiments/create/page';
import { Heading, Table } from '@radix-ui/themes';

export function StatisticsSummaryTable({ formData }: { formData: ExperimentFormData }) {
  return (
    <>
      <Heading size="4" mb="4">
        Statistics
      </Heading>
      <Table.Root>
        <Table.Body>
          <Table.Row>
            <Table.RowHeaderCell>Sample Size</Table.RowHeaderCell>
            <Table.Cell>{formData.createExperimentResponse?.assign_summary.sample_size}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>F Statistic</Table.RowHeaderCell>
            <Table.Cell>
              {formData.createExperimentResponse?.assign_summary.balance_check.f_statistic.toFixed(3)}
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>Numerator DF</Table.RowHeaderCell>
            <Table.Cell>{formData.createExperimentResponse?.assign_summary.balance_check.numerator_df}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>Denominator DF</Table.RowHeaderCell>
            <Table.Cell>{formData.createExperimentResponse?.assign_summary.balance_check.denominator_df}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>P-Value</Table.RowHeaderCell>
            <Table.Cell>
              {formData.createExperimentResponse?.assign_summary.balance_check.p_value.toFixed(3)}
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>Balance OK?</Table.RowHeaderCell>
            <Table.Cell>
              {formData.createExperimentResponse?.assign_summary.balance_check.balance_ok ? '✅ Yes' : '❗No'}
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </>
  );
}
