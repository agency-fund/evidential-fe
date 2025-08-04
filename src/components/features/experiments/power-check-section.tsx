'use client';

import { Button, Callout, Card, Flex, Spinner, Table, Text, TextField } from '@radix-ui/themes';
import { CheckCircledIcon, CrossCircledIcon, LightningBoltIcon } from '@radix-ui/react-icons';
import { FrequentABFormData } from '@/app/datasources/[datasourceId]/experiments/create/types';
import { usePowerCheck } from '@/api/admin';
import { convertFormDataToCreateExperimentRequest } from '@/app/datasources/[datasourceId]/experiments/create/helpers';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { ZodError } from 'zod';
import { useState } from 'react';

interface PowerCheckSectionProps {
  formData: FrequentABFormData;
  onFormDataChange: (data: FrequentABFormData) => void;
}

export function PowerCheckSection({ formData, onFormDataChange }: PowerCheckSectionProps) {
  const { trigger, data, isMutating, error } = usePowerCheck(formData.datasourceId!);
  const [validationError, setValidationError] = useState<ZodError | null>(null);

  const handlePowerCheck = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    setValidationError(null);
    try {
      const { design_spec } = convertFormDataToCreateExperimentRequest(formData);
      const response = await trigger({ design_spec });
      onFormDataChange({
        ...formData,
        powerCheckResponse: response,
        chosenN: response.analyses[0].target_n!,
      });
    } catch (err) {
      if (err instanceof ZodError) {
        setValidationError(err);
        return;
      }
      throw err;
    }
  };

  const isButtonDisabled = isMutating || formData.primaryMetric === undefined;

  return (
    <Flex direction="column" gap="3" align="center">
      <Button disabled={isButtonDisabled} onClick={handlePowerCheck} style={{ minWidth: '25%' }} loading={isMutating}>
        <>
          <LightningBoltIcon />
          Run Power Check
        </>
      </Button>
      {data !== undefined && (
        <>
          <Text>Target sample size to distribute across all arms: </Text>
          <TextField.Root
            style={{
              minWidth: '50%',
              textAlign: 'center',
            }}
            size="3"
            type="number"
            value={formData.chosenN ?? ''}
            onChange={(e) =>
              onFormDataChange({ ...formData, chosenN: e.target.value === '' ? undefined : Number(e.target.value) })
            }
            placeholder="Run the Power Check, or type your own desired #."
          />
        </>
      )}

      {error && (
        <Flex align="center" gap="2">
          <GenericErrorCallout
            title={'Power check failed'}
            message={error ? JSON.stringify(error, null, 2) : 'unknown'}
          />
        </Flex>
      )}

      {validationError && (
        <Flex align="center" gap="2">
          <GenericErrorCallout
            title={'Validation failed'}
            message={validationError.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n')}
          />
        </Flex>
      )}

      {isMutating && (
        <Flex align="center" gap="2">
          <Spinner size="1" />
          <Text>Analyzing metrics and population data...</Text>
        </Flex>
      )}

      {data !== undefined &&
        !validationError &&
        data.analyses.map((metricAnalysis, i) => (
          <Card key={i}>
            <Flex direction="column" gap="3">
              <Text weight={'bold'}>{metricAnalysis.metric_spec.field_name}</Text>
              <Callout.Root color={metricAnalysis.sufficient_n ? 'green' : 'red'}>
                <Callout.Icon>{metricAnalysis.sufficient_n ? <CheckCircledIcon /> : <CrossCircledIcon />}</Callout.Icon>
                <Callout.Text>
                  {metricAnalysis.msg?.msg ||
                    (metricAnalysis.sufficient_n
                      ? `The experiment has sufficient power.`
                      : `The experiment does not have sufficient power.`)}
                </Callout.Text>
              </Callout.Root>
              <Table.Root>
                <Table.Body>
                  <Table.Row>
                    <Table.RowHeaderCell>Required Sample Size</Table.RowHeaderCell>
                    <Table.Cell>{metricAnalysis.target_n || '?'}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.RowHeaderCell>Available Samples</Table.RowHeaderCell>
                    <Table.Cell>
                      {metricAnalysis.metric_spec.available_n == null ? (
                        '?'
                      ) : metricAnalysis.metric_spec.available_n === 0 ||
                          metricAnalysis.metric_spec.available_n < (metricAnalysis.target_n ?? 0) ? (
                        <span style={{ color: 'var(--red-11)' }}>{metricAnalysis.metric_spec.available_n}</span>
                      ) : (
                        metricAnalysis.metric_spec.available_n
                      )}
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.RowHeaderCell>Available non-null Samples</Table.RowHeaderCell>
                    <Table.Cell>
                      {metricAnalysis.metric_spec.available_nonnull_n == null ? (
                        '?'
                      ) : metricAnalysis.metric_spec.available_nonnull_n === 0 ||
                          metricAnalysis.metric_spec.available_nonnull_n < (metricAnalysis.target_n ?? 0) ? (
                        <span style={{ color: 'var(--red-11)' }}>{metricAnalysis.metric_spec.available_nonnull_n}</span>
                      ) : (
                        metricAnalysis.metric_spec.available_nonnull_n
                      )}
                    </Table.Cell>
                  </Table.Row>
                  {metricAnalysis.pct_change_possible !== null && metricAnalysis.pct_change_possible !== undefined && (
                    <Table.Row>
                      <Table.RowHeaderCell>Minimum Detectable Effect with all available samples</Table.RowHeaderCell>
                      <Table.Cell>{(metricAnalysis.pct_change_possible * 100).toFixed(4)}%</Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table.Root>
            </Flex>
          </Card>
        ))}
    </Flex>
  );
}
