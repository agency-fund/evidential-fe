import { Button, Callout, Card, Flex, Spinner, Table, Text, TextField } from '@radix-ui/themes';
import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { ExperimentFormData } from '@/app/experiments/create/page';
import { usePowerCheck } from '@/api/admin';
import { convertFormDataToCreateExperimentRequest } from '@/app/experiments/create/helpers';
import { GenericErrorCallout } from '@/app/components/generic-error';

interface PowerCheckSectionProps {
  formData: ExperimentFormData;
  onFormDataChange: (data: ExperimentFormData) => void;
}

export function PowerCheckSection({ formData, onFormDataChange }: PowerCheckSectionProps) {
  const { trigger, data, isMutating, error } = usePowerCheck(formData.datasourceId!);

  const handlePowerCheck = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const { design_spec, audience_spec } = convertFormDataToCreateExperimentRequest(formData);
    try {
      const response = await trigger({
        design_spec,
        audience_spec,
      });
      onFormDataChange({
        ...formData,
        powerCheckResponse: response,
        chosenN: response.analyses[0].target_n!,
      });
    } catch (_handled_by_swr) {}
  };

  const isButtonDisabled = isMutating || formData.primaryMetric === undefined;
  return (
    <Flex direction="column" gap="3">
      <Flex direction={'row'} gap={'3'}>
        <Button disabled={isButtonDisabled} onClick={handlePowerCheck}>
          {isMutating && <Spinner size="1" />}
          {isMutating ? 'Checking...' : 'Run Power Check'}
        </Button>
        {data !== undefined && (
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

      {error && (
        <Flex align="center" gap="2">
          <GenericErrorCallout
            title={'Power check failed'}
            message={error ? JSON.stringify(error, null, 2) : 'unknown'}
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
                    <Table.RowHeaderCell>Available Sample Size</Table.RowHeaderCell>
                    <Table.Cell>
                      {metricAnalysis.metric_spec.available_n === null ? '?' : metricAnalysis.metric_spec.available_n}
                    </Table.Cell>
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
