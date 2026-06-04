'use client';

import {
  Badge,
  Button,
  Callout,
  Card,
  DataList,
  Flex,
  Grid,
  Heading,
  RadioCards,
  Spinner,
  Table,
  Text,
  TextField,
} from '@radix-ui/themes';
import { CheckCircledIcon, CrossCircledIcon, LightningBoltIcon } from '@radix-ui/react-icons';
import { ExperimentFormData } from './experiment-form-def';
import { PowerCheckOption } from './experiment-form-types';
import { ExperimentFreqStackScreenMessage } from './experiment-freq-stack-screen';
import { usePowerCheck } from '@/api/admin';
import { convertToFrequentistDesignSpec } from './experiment-form-helpers';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { ZodError } from 'zod';
import { useEffect, useRef, useState } from 'react';
import { SectionCard } from '@/components/ui/cards/section-card';
import { useDebounced } from '@/providers/use-debounced';

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

function getValidDraftN(input: string): number | undefined {
  const parsed = input === '' ? undefined : Number(input);
  return parsed !== undefined && !isNaN(parsed) && parsed > 0 ? parsed : undefined;
}

export function PowerCheckSection({ data, dispatch }: PowerCheckSectionProps) {
  const { trigger: triggerEstimateSampleSize, isMutating, error } = usePowerCheck(data.datasourceId!);
  // Separate mutation with a distinct SWR key so it doesn't share cache or conflict with the
  // main power-check mutation above.
  const { trigger: triggerEstimateMde, isMutating: isEstimatingMde } = usePowerCheck(data.datasourceId!, {
    swr: { swrKey: `${data.datasourceId}/power/mde-estimate` },
  });
  const [validationError, setValidationError] = useState<ZodError | null>(null);
  // Local draft state for the custom N input. Kept separate from data.desiredN so that the effect
  // only fires after the debounce settles on a value the user actually typed, not immediately when
  // the user switches to ENTER_OWN with a previously-committed value.
  // Initialised from data.desiredN so the input is pre-filled when returning to this screen.
  const [draftN, setDraftN] = useState<string>(
    data.sampleSizeOption === PowerCheckOption.ENTER_OWN && data.desiredN !== undefined ? String(data.desiredN) : '',
  );
  const debouncedValidDraftN = useDebounced(getValidDraftN(draftN), 400);

  const primaryAnalysis = data.powerCheckResponse?.analyses.find(
    (a) => a.metric_spec.field_name === data.primaryMetric?.metric.field_name,
  );
  const powerCheckTarget = primaryAnalysis?.target_n ?? undefined;
  const nonNullSamples = primaryAnalysis?.metric_spec.available_nonnull_n ?? 0;
  const allSamples = primaryAnalysis?.metric_spec.available_n ?? 0;
  const selectedSampleOption = data.sampleSizeOption ?? PowerCheckOption.USE_POWER_CHECK;
  const shouldEstimateMde = selectedSampleOption === PowerCheckOption.ENTER_OWN && debouncedValidDraftN !== undefined;

  const customPrimaryAnalysis = data.customPowerCheckResponse?.analyses.find(
    (a) => a.metric_spec.field_name === data.primaryMetric?.metric.field_name,
  );
  const estimatedMdePct =
    customPrimaryAnalysis?.pct_change_with_desired_n != null
      ? (customPrimaryAnalysis.pct_change_with_desired_n * 100).toFixed(1)
      : 'N/A';

  const { enabled } = isPowerCheckButtonEnabled(isMutating, data); // TODO: present reason field

  // A ref so our useEffect for triggering MDE mode always reads the latest form data without making
  // `data` a reactive dependency. `data.customPowerCheckResponse` changes when the effect's own
  // dispatch completes, so including `data` in deps would retrigger the effect after every
  // successful estimate, producing an infinite request loop.
  const dataRef = useRef(data);
  dataRef.current = data;

  // useEffect because we need a side effect (API call) triggered by the debounced draft value,
  // not by each raw keystroke. `dispatch` is stable thanks to ScreenRenderer's useCallback in
  // Wizard.tsx; `triggerEstimateMde` is stable from useSWRMutation.
  useEffect(() => {
    if (!shouldEstimateMde || debouncedValidDraftN === undefined) return;
    void (async () => {
      const response = await triggerEstimateMde({
        design_spec: convertToFrequentistDesignSpec({ ...dataRef.current, desiredN: debouncedValidDraftN }),
      });
      if (response) {
        dispatch({ type: 'set-custom-power-check-response', response, desiredN: debouncedValidDraftN });
      }
    })();
  }, [debouncedValidDraftN, shouldEstimateMde, triggerEstimateMde, dispatch]);

  const handlePowerCheck = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setValidationError(null);

    if (!data.tableName || !data.primaryKey || !data.primaryMetric) {
      return;
    }

    try {
      const response = await triggerEstimateSampleSize({ design_spec: convertToFrequentistDesignSpec(data) });

      const primary = response.analyses.find((a) => a.metric_spec.field_name === data.primaryMetric?.metric.field_name);
      const desiredN = primary?.sufficient_n ? (primary.target_n ?? undefined) : undefined;
      const sampleSizeOption = desiredN === undefined ? PowerCheckOption.NONE : PowerCheckOption.USE_POWER_CHECK;
      dispatch({ type: 'set-power-check-response', response, desiredN, sampleSizeOption });
    } catch (err) {
      if (err instanceof ZodError) {
        setValidationError(err);
        return;
      }
      throw err;
    }
  };

  const handleSampleOptionChange = (value: PowerCheckOption) => {
    dispatch({ type: 'set-sample-size-option', value });
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

  const primaryPower =
    data.powerCheckResponse !== undefined && !validationError ? data.powerCheckResponse.analyses[0] : undefined;
  const restPower =
    data.powerCheckResponse !== undefined && !validationError && data.powerCheckResponse.analyses.length > 1
      ? data.powerCheckResponse.analyses.slice(1)
      : undefined;

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
              <GenericErrorCallout title={'Power check failed'} error={error} />
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

          {primaryPower && (
            <Callout.Root color={primaryPower.sufficient_n ? 'green' : 'red'}>
              <Callout.Icon>{primaryPower.sufficient_n ? <CheckCircledIcon /> : <CrossCircledIcon />}</Callout.Icon>
              <Callout.Text>
                {primaryPower.msg?.msg ||
                  (primaryPower.sufficient_n
                    ? `The experiment has sufficient power.`
                    : `The experiment does not have sufficient power.`)}
              </Callout.Text>
            </Callout.Root>
          )}

          <Grid rows={'1'} columns={restPower ? '2' : '1'} gap={'3'}>
            {primaryPower && (
              <>
                <Card>
                  <Flex direction="column" gap={'3'}>
                    <Heading size={'3'}>Primary Metric: {primaryPower.metric_spec.field_name}</Heading>
                    <DataList.Root>
                      <DataList.Item>
                        <DataList.Label>Status</DataList.Label>
                        <DataList.Value>
                          {primaryPower.sufficient_n ? (
                            <Badge color={'green'}>Pass</Badge>
                          ) : (
                            <Badge color={'red'}>Failed</Badge>
                          )}
                        </DataList.Value>
                      </DataList.Item>
                      <DataList.Item>
                        <DataList.Label>Required</DataList.Label>
                        <DataList.Value>{primaryPower.target_n || '?'}</DataList.Value>
                      </DataList.Item>
                      <DataList.Item>
                        <DataList.Label>Available</DataList.Label>
                        <DataList.Value>
                          {' '}
                          {primaryPower.metric_spec.available_n == null ? (
                            '?'
                          ) : primaryPower.metric_spec.available_n === 0 ||
                            primaryPower.metric_spec.available_n < (primaryPower.target_n ?? 0) ? (
                            <span color="crimson">{primaryPower.metric_spec.available_n}</span>
                          ) : (
                            primaryPower.metric_spec.available_n
                          )}
                        </DataList.Value>
                      </DataList.Item>
                      <DataList.Item>
                        <DataList.Label>Available (non-null)</DataList.Label>
                        <DataList.Value>
                          {primaryPower.metric_spec.available_nonnull_n == null ? (
                            '?'
                          ) : primaryPower.metric_spec.available_nonnull_n === 0 ||
                            primaryPower.metric_spec.available_nonnull_n < (primaryPower.target_n ?? 0) ||
                            primaryPower.metric_spec.available_nonnull_n <
                              (primaryPower.metric_spec.available_n ?? 0) ? (
                            <Text color="orange">{primaryPower.metric_spec.available_nonnull_n}</Text>
                          ) : (
                            primaryPower.metric_spec.available_nonnull_n
                          )}
                        </DataList.Value>
                      </DataList.Item>
                      {primaryPower.pct_change_possible !== null && primaryPower.pct_change_possible !== undefined && (
                        <DataList.Item>
                          <DataList.Label>MME</DataList.Label>
                          <DataList.Value>{(primaryPower.pct_change_possible * 100).toFixed(4)}%</DataList.Value>
                        </DataList.Item>
                      )}
                    </DataList.Root>
                  </Flex>
                </Card>
              </>
            )}
            {restPower ? (
              <Card key={'secondary'}>
                <Flex direction="column" gap={'3'}>
                  <Heading size={'3'}>Secondary Metrics</Heading>
                  <Table.Root>
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeaderCell>Metric</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Required</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Available</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Available (non-null)</Table.ColumnHeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {restPower.map((metricAnalysis, i) => (
                        <Table.Row key={`rest${i}`}>
                          <Table.Cell>{metricAnalysis.metric_spec.field_name}</Table.Cell>
                          <Table.Cell>
                            {metricAnalysis.sufficient_n ? (
                              <Badge color={'green'}>Pass</Badge>
                            ) : (
                              <Badge color={'orange'}>Failed</Badge>
                            )}
                          </Table.Cell>
                          <Table.Cell align={'right'}>{metricAnalysis.target_n ?? ''}</Table.Cell>
                          <Table.Cell align={'right'}>
                            {metricAnalysis.metric_spec.available_n == null ? (
                              '?'
                            ) : metricAnalysis.metric_spec.available_n === 0 ||
                              metricAnalysis.metric_spec.available_n < (metricAnalysis.target_n ?? 0) ? (
                              <Text color="crimson">{metricAnalysis.metric_spec.available_n}</Text>
                            ) : (
                              metricAnalysis.metric_spec.available_n
                            )}
                          </Table.Cell>
                          <Table.Cell align={'right'}>
                            {metricAnalysis.metric_spec.available_nonnull_n == null ? (
                              '?'
                            ) : metricAnalysis.metric_spec.available_nonnull_n === 0 ||
                              metricAnalysis.metric_spec.available_nonnull_n < (metricAnalysis.target_n ?? 0) ? (
                              <Text color="crimson">{metricAnalysis.metric_spec.available_nonnull_n}</Text>
                            ) : (
                              metricAnalysis.metric_spec.available_nonnull_n
                            )}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Flex>
              </Card>
            ) : null}
          </Grid>
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
                <Flex direction={'row'} gap={'3'} justify={'between'}>
                  <RadioCards.Item
                    value={PowerCheckOption.USE_POWER_CHECK}
                    disabled={powerCheckTarget === undefined || powerCheckTarget === 0}
                  >
                    <Flex align="center" direction="column" gap="2">
                      <Text size="2">Use minimum sample required:</Text>
                      <Text size="2">{powerCheckTarget ?? 'N/A'}</Text>
                      <Flex align="center" style={{ minHeight: '24px' }}>
                        {data.primaryMetric?.mde !== undefined && (
                          <Badge color="purple" variant="soft" size="2">
                            Target MDE: {data.primaryMetric.mde}%
                          </Badge>
                        )}
                      </Flex>
                    </Flex>
                  </RadioCards.Item>
                  <RadioCards.Item
                    value={PowerCheckOption.USE_ALL_NON_NULL_SAMPLES}
                    disabled={nonNullSamples === undefined || nonNullSamples === 0}
                  >
                    <Flex align="center" direction="column" gap="2">
                      <Text size="2">Use all available non-null samples:</Text>
                      <Text size="2">{nonNullSamples ?? 'N/A'}</Text>
                      <Flex align="center" style={{ minHeight: '24px' }}></Flex>
                    </Flex>
                  </RadioCards.Item>
                  <RadioCards.Item
                    value={PowerCheckOption.ENTER_OWN}
                    disabled={allSamples === undefined || allSamples === 0}
                  >
                    <Flex align="center" direction="column" gap="2" style={{ pointerEvents: 'auto' }}>
                      <Text size="2">Use custom sample size:</Text>
                      <TextField.Root
                        style={{ width: '150px' }}
                        size="2"
                        type="number"
                        min={1}
                        max={allSamples ?? undefined}
                        value={draftN}
                        onChange={(e) => setDraftN(e.target.value)}
                        placeholder="Enter your desired N"
                      />
                      <Flex align="center" style={{ minHeight: '24px' }}>
                        {selectedSampleOption === PowerCheckOption.ENTER_OWN && isEstimatingMde && (
                          <Badge color="purple" variant="soft" size="2">
                            Estimated MDE: …
                            <Spinner size="1" />
                          </Badge>
                        )}
                        {!isEstimatingMde && draftN !== '' && (
                          <Badge color="purple" variant="soft" size="2">
                            Estimated MDE: {estimatedMdePct}%
                          </Badge>
                        )}
                      </Flex>
                    </Flex>
                  </RadioCards.Item>
                </Flex>
              </RadioCards.Root>
            </Flex>
          </Flex>
        </SectionCard>
      )}
    </Flex>
  );
}
