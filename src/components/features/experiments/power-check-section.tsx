'use client';

import { Button, Callout, Card, Flex, Spinner, Table, Text, TextField, RadioCards } from '@radix-ui/themes';
import { CheckCircledIcon, CrossCircledIcon, LightningBoltIcon } from '@radix-ui/react-icons';
import { FrequentABFormData } from '@/app/datasources/[datasourceId]/experiments/create/types';
import { usePowerCheck } from '@/api/admin';
import { convertFormDataToCreateExperimentRequest } from '@/app/datasources/[datasourceId]/experiments/create/helpers';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { ZodError } from 'zod';
import { useState } from 'react';
import { SectionCard } from '@/components/ui/cards/section-card';
import { ApiValidationError } from '@/services/orval-fetch';

interface PowerCheckSectionProps {
  formData: FrequentABFormData;
  onFormDataChange: (data: FrequentABFormData) => void;
}

enum PowerCheckOption {
  USE_POWER_CHECK = 'use_power_check',
  USE_ALL_NON_NULL_SAMPLES = 'use_all_non_null_samples',
  ENTER_OWN = 'enter_own',
  NONE = '',
}

export function PowerCheckSection({ formData, onFormDataChange }: PowerCheckSectionProps) {
  const [validationError, setValidationError] = useState<ZodError | null>(null);
  const {
    trigger,
    isMutating,
    error: powerCheckError,
  } = usePowerCheck(formData.datasourceId!, {
    swr: {
      onSuccess: (response) => {
        const primary = response.analyses.find(
          (a) => a.metric_spec.field_name === formData.primaryMetric?.metric.field_name,
        );

        setPowerCheckTarget(primary?.target_n ?? undefined);

        setNonNullSamples(primary?.metric_spec.available_nonnull_n ?? 0);
        setAllSamples(primary?.metric_spec.available_n ?? 0);
        setSelectedSampleOption(PowerCheckOption.NONE);

        onFormDataChange({
          ...formData,
          powerCheckResponse: response,
          chosenN: undefined,
        });
      },
    },
  });

  const isButtonDisabled = isMutating || formData.primaryMetric === undefined;

  const [powerCheckTarget, setPowerCheckTarget] = useState<number | undefined>(undefined);
  const [nonNullSamples, setNonNullSamples] = useState<number | undefined>(undefined);
  const [allSamples, setAllSamples] = useState<number | undefined>(undefined);
  const [selectedSampleOption, setSelectedSampleOption] = useState<PowerCheckOption>(PowerCheckOption.NONE);

  const handlePowerCheck = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    setValidationError(null);
    try {
      const { design_spec } = convertFormDataToCreateExperimentRequest(formData);
      await trigger({ design_spec });
    } catch (err) {
      if (err instanceof ZodError) {
        setValidationError(err);
        return;
      }
      if (err instanceof ApiValidationError) {
        // Handled by usePowerCheck
        return;
      }
      throw err;
    }
  };

  return (
    <Flex direction="column" gap="4">
      <SectionCard title="Analysis">
        <Flex direction="column" gap="3" align="center">
          <Button
            disabled={isButtonDisabled}
            onClick={handlePowerCheck}
            style={{ minWidth: '25%' }}
            loading={isMutating}
          >
            <>
              <LightningBoltIcon />
              Run Power Check
            </>
          </Button>

          {powerCheckError && (
            <Flex align="center" gap="2">
              <GenericErrorCallout title={'Power check failed'} error={powerCheckError} />
            </Flex>
          )}

          {validationError && (
            <Flex align="center" gap="2">
              <GenericErrorCallout
                title={'Power check request validation failed'}
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

          {formData.powerCheckResponse !== undefined &&
            !validationError &&
            formData.powerCheckResponse.analyses.map((metricAnalysis, i) => (
              <Card key={i}>
                <Flex direction="column" gap="3">
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
                              Minimum Detectable Effect with all available samples
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
      {formData.powerCheckResponse !== undefined && !validationError && (
        <SectionCard title="Select Target Sample Size">
          <Flex direction="column" gap="3" align="start">
            <Text>Select target sample size to distribute across all arms:</Text>
            <Flex direction="column" gap="2" align="center">
              {!formData.powerCheckResponse.analyses.map((a) => a.sufficient_n).every((sufficient) => sufficient) && (
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
              <RadioCards.Root
                columns="1"
                value={selectedSampleOption}
                onValueChange={(value: PowerCheckOption) => {
                  setSelectedSampleOption(value);
                  switch (value) {
                    case PowerCheckOption.USE_POWER_CHECK:
                      onFormDataChange({
                        ...formData,
                        chosenN: powerCheckTarget,
                      });
                      break;
                    case PowerCheckOption.USE_ALL_NON_NULL_SAMPLES:
                      onFormDataChange({
                        ...formData,
                        chosenN: nonNullSamples,
                      });
                      break;
                    case PowerCheckOption.ENTER_OWN:
                    case PowerCheckOption.NONE:
                      onFormDataChange({ ...formData, chosenN: undefined });
                      break;
                  }
                }}
              >
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
                        style={{
                          // minWidth: '10%',
                          textAlign: 'start',
                          width: '250px',
                        }}
                        size="2"
                        type="number"
                        max={allSamples ?? undefined}
                        onChange={(e) =>
                          onFormDataChange({
                            ...formData,
                            chosenN: e.target.value === '' ? undefined : Number(e.target.value),
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
