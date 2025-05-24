'use client';

import { ExperimentFormData } from '@/app/datasources/[datasourceId]/experiments/create/page';
import { Table } from '@radix-ui/themes';

export function StatisticsSummaryTable({ formData }: { formData: ExperimentFormData }) {
  return (
    <>
      <Table.Root>
        <Table.Body>
          <Table.Row>
            <Table.RowHeaderCell>Actual Sample Size</Table.RowHeaderCell>
            <Table.Cell>{formData.createExperimentResponse?.assign_summary.sample_size}</Table.Cell>
          </Table.Row>
          {formData.createExperimentResponse?.assign_summary.balance_check ? (
            <>
              <Table.Row>
                <Table.RowHeaderCell>F Statistic</Table.RowHeaderCell>
                <Table.Cell>
                  {formData.createExperimentResponse.assign_summary.balance_check.f_statistic.toFixed(3)}
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.RowHeaderCell>Numerator DF</Table.RowHeaderCell>
                <Table.Cell>{formData.createExperimentResponse.assign_summary.balance_check.numerator_df}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.RowHeaderCell>Denominator DF</Table.RowHeaderCell>
                <Table.Cell>{formData.createExperimentResponse.assign_summary.balance_check.denominator_df}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.RowHeaderCell>P-Value</Table.RowHeaderCell>
                <Table.Cell>
                  {formData.createExperimentResponse.assign_summary.balance_check.p_value.toFixed(3)}
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.RowHeaderCell>Balance OK?</Table.RowHeaderCell>
                <Table.Cell>
                  {formData.createExperimentResponse?.assign_summary.balance_check.balance_ok ? '✅ Yes' : '❗No'}
                </Table.Cell>
              </Table.Row>
            </>
          ) : (
            <Table.Row>
              <Table.RowHeaderCell>Balance Check</Table.RowHeaderCell>
              <Table.Cell>N/A</Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table.Root>
    </>
  );
}
