import { MetricAnalysisOutput, PowerResponseOutput } from '@/api/methods.schemas';
import { useState } from 'react';
import { Button, Callout, Card, Flex, Spinner, Table, Text, TextField } from '@radix-ui/themes';
import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';

const EXAMPLE_METRIC_ANALYSIS_OUTPUT: MetricAnalysisOutput = {
  metric_spec: {
    field_name: 'total_visits',
  },
  target_n: 1200,
  sufficient_n: true,
  target_possible: 0.08,
  pct_change_possible: 12.5,
  msg: {
    type: 'sufficient',
    msg: 'The experiment has sufficient power to detect the target effect size.',
    source_msg: '_',
    values: {
      current_n: 1500,
      required_n: 1200,
    },
  },
};
const EXAMPLE_POWER_CHECK_OUTPUT: PowerResponseOutput = {
  analyses: [EXAMPLE_METRIC_ANALYSIS_OUTPUT],
};

// TODO: Accept a DesignSpec and AudienceSpec as props.
export function PowerCheckSection() {
  // TODO: This is a placeholder to simulate the API request. Replace with new powercheck API.
  const [state, setState] = useState<'initial' | 'loading' | 'error' | 'success'>('initial');

  const handlePowerCheck = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setState('loading');
    // Simulate API call
    setTimeout(() => {
      setState('success');
    }, 1000);
  };

  return (
    <Flex direction="column" gap="3">
      <Flex direction={'row'} gap={'3'}>
        <Button disabled={state === 'loading'} onClick={handlePowerCheck}>
          {state === 'loading' ? 'Checking...' : 'Run Power Check'}
        </Button>
        {state === 'success' && (
          <>
            <Text>N: </Text>
            <TextField.Root
              type="number"
              value={EXAMPLE_POWER_CHECK_OUTPUT.analyses[0].target_n || ''}
              onChange={() => {}}
            />
          </>
        )}
      </Flex>

      {state === 'loading' && (
        <Flex align="center" gap="2">
          <Spinner size="1" />
          <Text>Analyzing metrics and population data...</Text>
        </Flex>
      )}

      {state === 'success' &&
        EXAMPLE_POWER_CHECK_OUTPUT.analyses.map((metricAnalysis, i) => (
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
                    <Table.Cell>{metricAnalysis.target_n}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.RowHeaderCell>Available Sample Size</Table.RowHeaderCell>
                    <Table.Cell>{metricAnalysis.msg?.values?.current_n || 'Unknown'}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.RowHeaderCell>Minimum Detectable Effect</Table.RowHeaderCell>
                    <Table.Cell>{metricAnalysis.pct_change_possible}%</Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table.Root>
            </Flex>
          </Card>
        ))}
    </Flex>
  );
}
