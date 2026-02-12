'use client';

import { Button, Callout, Card, Flex, RadioCards, Spinner, Table, Text, TextField } from '@radix-ui/themes';
import { CheckCircledIcon, CrossCircledIcon, LightningBoltIcon } from '@radix-ui/react-icons';
import { ExperimentFormData } from './experiment-form-def';
import { ExperimentFreqStackScreenMessage } from './experiment-freq-stack-screen';
import { usePowerCheck } from '@/api/admin';
import { convertToDesignSpec } from './experiment-form-helpers';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { ZodError } from 'zod';
import { useState } from 'react';
import { prettyJSON } from '@/services/json-utils';
import { SectionCard } from '@/components/ui/cards/section-card';

enum PowerCheckOption {
  USE_POWER_CHECK = 'use_power_check',
  USE_ALL_NON_NULL_SAMPLES = 'use_all_non_null_samples',
  ENTER_OWN = 'enter_own',
  NONE = '',
}

interface PowerCheckSectionProps {
  data: ExperimentFormData;
  dispatch: (msg: ExperimentFreqStackScreenMessage) => void;
}

const isPowerCheckButtonEnabled = (isMutating: boolean, data: ExperimentFormData) => {
  const reasons = [];
  if (isMutating) {
    reasons.push('Running power check');
  }
  if (data.primaryKey === undefined) {
    reasons.push('Please select a unique ID field.');
  }
  if (data.primaryMetric === undefined) {
    reasons.push('Please select a primary metric.');
  }
  return { enabled: !reasons.length, reason: reasons.join('\n') };
};

interface PowerCheckButtonProps {
  enabled: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => Promise<void>;
  loading: boolean;
}

function RunPowerCheckButton({ enabled, onClick, loading }: PowerCheckButtonProps) {
  return (
    <Button disabled={!enabled} onClick={onClick} style={{ minWidth: '25%' }}>
      <Spinner loading={loading}>
        <LightningBoltIcon />
      </Spinner>
      Run Power Check
    </Button>
  );
}

export function PowerCheckSection({ data, dispatch }: PowerCheckSectionProps) {
  const { trigger, isMutating, error } = usePowerCheck(data.datasourceId!);
  const [validationError, setValidationError] = useState<ZodError | null>(null);
  const [powerCheckTarget, setPowerCheckTarget] = useState<number | undefined>();
  const [nonNullSamples, setNonNullSamples] = useState<number | undefined>();
  const [allSamples, setAllSamples] = useState<number | undefined>();
  const [selectedSampleOption, setSelectedSampleOption] = useState<PowerCheckOption>(PowerCheckOption.USE_POWER_CHECK);

  const { enabled } = isPowerCheckButtonEnabled(isMutating, data); // TODO: present reason field

  const handlePowerCheck = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setValidationError(null);

    // TODO: reimplement this to be simpler
    try {
      const design_spec = convertToDesignSpec(data);
      const response = await trigger({ design_spec, table_name: data.tableName, primary_key: data.primaryKey });
      const primary = response.analyses.find((a) => a.metric_spec.field_name === data.primaryMetric?.metric.field_name);

      dispatch({ type: 'set-power-check-response', response, chosenN: undefined });
      setPowerCheckTarget(primary?.target_n ?? undefined);
      setNonNullSamples(primary?.metric_spec.available_nonnull_n ?? 0);
      setAllSamples(primary?.metric_spec.available_n ?? 0);
      if (primary?.sufficient_n) {
        setSelectedSampleOption(PowerCheckOption.USE_POWER_CHECK);
        dispatch({ type: 'set-chosen-n', value: primary?.target_n ?? undefined });
      } else {
        setSelectedSampleOption(PowerCheckOption.NONE);
      }
    } catch (err) {
      if (err instanceof ZodError) {
        setValidationError(err);
        return;
      }
      throw err;
    }
  };

  const handleSampleOptionChange = (value: PowerCheckOption) => {
    setSelectedSampleOption(value);
    switch (value) {
      case PowerCheckOption.USE_POWER_CHECK:
        dispatch({ type: 'set-chosen-n', value: powerCheckTarget });
        break;
      case PowerCheckOption.USE_ALL_NON_NULL_SAMPLES:
        dispatch({ type: 'set-chosen-n', value: nonNullSamples });
        break;
      case PowerCheckOption.ENTER_OWN:
      case PowerCheckOption.NONE:
        dispatch({ type: 'set-chosen-n', value: undefined });
        break;
    }
  };

  return (
    <Flex direction="column" gap={'3'}>
      <Flex direction="row" gap="4">
        <Flex direction="column" gap="1" flexGrow="1">
          <Text as="label" size="2" weight="medium">
            Confidence (%)
          </Text>
          <TextField.Root
            type="number"
            min={50}
            max={99}
            value={data.confidence ?? '95'}
            onChange={(e) => dispatch({ type: 'set-confidence', value: e.target.value })}
            placeholder="95"
          />
        </Flex>
        <Flex direction="column" gap="1" flexGrow="1">
          <Text as="label" size="2" weight="medium">
            Power (%)
          </Text>
          <TextField.Root
            type="number"
            min={50}
            max={99}
            value={data.power ?? '80'}
            onChange={(e) => dispatch({ type: 'set-power', value: e.target.value })}
            placeholder="80"
          />
        </Flex>
      </Flex>

      <SectionCard title="Analysis">
        <Flex direction="column" gap="3" align="center">
          <RunPowerCheckButton enabled={enabled} onClick={handlePowerCheck} loading={isMutating} />

          {error && (
            <Flex align="center" gap="2">
              <GenericErrorCallout title={'Power check failed'} message={error ? prettyJSON(error) : 'unknown'} />
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

          {data.powerCheckResponse !== undefined &&
            !validationError &&
            data.powerCheckResponse.analyses.map((metricAnalysis, i) => (
              <Card key={i}>
                <Flex direction="column" gap={'2'}>
                  <Text weight={'bold'}>{metricAnalysis.metric_spec.field_name}</Text>
                  <Callout.Root color={metricAnalysis.sufficient_n ? 'green' : 'red'}>
                    <Callout.Icon>
                      {metricAnalysis.sufficient_n ? <CheckCircledIcon /> : <CrossCircledIcon />}
                    </Callout.Icon>
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
                            <span color="crimson">{metricAnalysis.metric_spec.available_n}</span>
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
                            <span color="crimson">{metricAnalysis.metric_spec.available_nonnull_n}</span>
                          ) : (
                            metricAnalysis.metric_spec.available_nonnull_n
                          )}
                        </Table.Cell>
                      </Table.Row>
                      {metricAnalysis.pct_change_possible !== null &&
                        metricAnalysis.pct_change_possible !== undefined && (
                          <Table.Row>
                            <Table.RowHeaderCell>
                              Minimum Meaningful Effect with all available samples
                            </Table.RowHeaderCell>
                            <Table.Cell>{(metricAnalysis.pct_change_possible * 100).toFixed(4)}%</Table.Cell>
                          </Table.Row>
                        )}
                    </Table.Body>
                  </Table.Root>
                </Flex>
              </Card>
            ))}
        </Flex>
      </SectionCard>

      {data.powerCheckResponse !== undefined && !validationError && (
        <SectionCard title="Select Target Sample Size">
          <Flex direction="column" gap="3" align="start">
            <Text>Select target sample size to distribute across all arms:</Text>
            <Flex direction="column" gap="2" align="center">
              {!data.powerCheckResponse.analyses.map((a) => a.sufficient_n).every((sufficient) => sufficient) && (
                <Callout.Root color="orange">
                  <Callout.Icon>
                    <CrossCircledIcon />
                  </Callout.Icon>
                  <Callout.Text>
                    You don&apos;t have sufficient samples for one or more metrics. You can still proceed with a custom
                    sample size, but consider adjusting your experiment design.
                  </Callout.Text>
                </Callout.Root>
              )}
              <RadioCards.Root columns="1" value={selectedSampleOption} onValueChange={handleSampleOptionChange}>
                <RadioCards.Item
                  value={PowerCheckOption.USE_POWER_CHECK}
                  disabled={powerCheckTarget === undefined || powerCheckTarget === 0}
                >
                  Use minimum sample required: {powerCheckTarget ?? 'N/A'}
                </RadioCards.Item>
                <RadioCards.Item
                  value={PowerCheckOption.USE_ALL_NON_NULL_SAMPLES}
                  disabled={nonNullSamples === undefined || nonNullSamples === 0}
                >
                  Use all available non-null samples: {nonNullSamples}
                </RadioCards.Item>
                <RadioCards.Item
                  value={PowerCheckOption.ENTER_OWN}
                  disabled={allSamples === undefined || allSamples === 0}
                >
                  <Flex align="center" direction={'row'} gap="2">
                    <span>Use custom sample size:</span>
                    <div style={{ pointerEvents: 'auto' }}>
                      <TextField.Root
                        style={{ width: '250px' }}
                        size="2"
                        type="number"
                        max={allSamples ?? undefined}
                        onChange={(e) =>
                          dispatch({
                            type: 'set-chosen-n',
                            value: e.target.value === '' ? undefined : Number(e.target.value),
                          })
                        }
                        placeholder="Type your own desired #."
                      />
                    </div>
                  </Flex>
                </RadioCards.Item>
              </RadioCards.Root>
            </Flex>
          </Flex>
        </SectionCard>
      )}
    </Flex>
  );
}
