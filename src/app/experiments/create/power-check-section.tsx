import { Button, Callout, Card, Flex, Spinner, Table, Text, TextField } from '@radix-ui/themes';
import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { ExperimentFormData } from '@/app/experiments/create/page';
import { usePowerCheck } from '@/api/admin';
import { convertFormDataToCreateExperimentRequest } from '@/app/experiments/create/helpers';
import { isHttpOk } from '@/services/typehelper';
import { GenericErrorCallout } from '@/app/components/generic-error';
import { useState } from 'react';

interface PowerCheckSectionProps {
  formData: ExperimentFormData;
  onFormDataChange: (data: ExperimentFormData) => void;
}

export function PowerCheckSection({ formData, onFormDataChange }: PowerCheckSectionProps) {
  const { trigger, data, isMutating } = usePowerCheck(formData.datasourceId!);
  const [error, setError] = useState(false);

  const handlePowerCheck = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const { design_spec, audience_spec } = convertFormDataToCreateExperimentRequest(formData);
    setError(false);
    const response = await trigger({
      design_spec,
      audience_spec,
    });
    if (isHttpOk(response)) {
      onFormDataChange({
        ...formData,
        powerCheckResponse: response.data,
        chosenN: response.data.analyses[0].target_n!,
      });
    } else {
      setError(true);
    }
  };

  const isButtonDisabled = isMutating || formData.primaryMetric === undefined;
  return (
    <Flex direction="column" gap="3">
      <Flex direction={'row'} gap={'3'}>
        <Button disabled={isButtonDisabled} onClick={handlePowerCheck}>
          {isMutating && <Spinner size="1" />}
          {isMutating ? 'Checking...' : 'Run Power Check'}
        </Button>
        {isHttpOk(data) && (
          <>
            <Text>N: </Text>
            <TextField.Root
              type="number"
              value={formData.chosenN}
              onChange={(e) => onFormDataChange({ ...formData, chosenN: Number(e.target.value) })}
            />
          </>
        )}
      </Flex>

      {!isHttpOk(data) && error && (
        <Flex align="center" gap="2">
          <GenericErrorCallout title={'Power check failed'} message={data ? JSON.stringify(data.data) : 'unknown'} />
        </Flex>
      )}

      {isMutating && (
        <Flex align="center" gap="2">
          <Spinner size="1" />
          <Text>Analyzing metrics and population data...</Text>
        </Flex>
      )}

      {isHttpOk(data) &&
        data.data.analyses.map((metricAnalysis, i) => (
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
                    <Table.RowHeaderCell>Available Sample Size</Table.RowHeaderCell>
                    <Table.Cell>{metricAnalysis.metric_spec.available_n === null ? '?' : metricAnalysis.metric_spec.available_n}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.RowHeaderCell>Minimum Detectable Effect</Table.RowHeaderCell>
                    <Table.Cell>{metricAnalysis.pct_change_possible || '?'}%</Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table.Root>
            </Flex>
          </Card>
        ))}
    </Flex>
  );
}
