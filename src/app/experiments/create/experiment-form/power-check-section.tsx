'use client';

import {
  Badge,
  Box,
  Button,
  Callout,
  Card,
  DataList,
  Flex,
  Grid,
  Heading,
  Spinner,
  Table,
  Text,
  TextField,
  Tooltip,
} from '@radix-ui/themes';
import {
  PowerCheckResponseChange,
  PowerCheckSampleOptionChange,
  PowerCheckSampleSizeSelector,
} from './power-check-sample-size-selector';
import { CheckCircledIcon, CrossCircledIcon, ExclamationTriangleIcon, LightningBoltIcon } from '@radix-ui/react-icons';
import { ExperimentFormData, isClusteredExperimentFormData, PowerCheckOption } from './experiment-form-types';
import { usePowerCheck } from '@/api/admin';
import { convertToFrequentistDesignSpec } from './experiment-form-helpers';
import { getPowerAnalysis } from '@/services/experiment-utils';
import { MetricSampleSizeDisplay } from './metric-sample-size-display';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { ZodError } from 'zod';
import { useState } from 'react';
import { SectionCard } from '@/components/ui/cards/section-card';
import { ClusterStatisticsSection, ClusterStatisticsSectionAction } from './cluster-statistics-section';

export type PowerCheckSectionAction =
  | { type: 'set-confidence'; value: string }
  | { type: 'set-power'; value: string }
  | ({ type: 'set-chosen-n' } & PowerCheckSampleOptionChange)
  | ({ type: 'set-power-check-response' } & PowerCheckResponseChange);

interface PowerCheckSectionProps {
  data: ExperimentFormData;
  dispatch: (action: PowerCheckSectionAction | ClusterStatisticsSectionAction) => void;
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
  onClick: () => Promise<void>;
  loading: boolean;
  disabledReason?: string;
}

function RunPowerCheckButton({ enabled, onClick, loading, disabledReason }: PowerCheckButtonProps) {
  const button = (
    <Button type="button" disabled={!enabled} onClick={onClick} style={{ minWidth: '25%' }}>
      <Spinner loading={loading}>
        <LightningBoltIcon />
      </Spinner>
      Estimate Sample Size
    </Button>
  );

  const tooltipContent = !enabled
    ? disabledReason
    : "Calculates the minimum number of participants needed to be able to detect your primary metric's minimum effect.";

  return (
    <Tooltip content={tooltipContent} side="top" align="center">
      {button}
    </Tooltip>
  );
}

export function PowerCheckSection({ data, dispatch }: PowerCheckSectionProps) {
  const [validationError, setValidationError] = useState<ZodError | null>(null);
  const { trigger: triggerEstimateSampleSize, isMutating, error } = usePowerCheck(data.datasourceId!);
  const { enabled, reason } = isPowerCheckButtonEnabled(isMutating, data);

  const handlePowerCheck = async () => {
    setValidationError(null);

    if (!data.tableName || !data.primaryKey || !data.primaryMetric) {
      return;
    }

    try {
      // We always estimate the minimum sample size with this handler, so clear out desiredN.
      const designSpec = convertToFrequentistDesignSpec({ ...data, desiredN: undefined });
      const response = await triggerEstimateSampleSize({ design_spec: designSpec });

      const primary = getPowerAnalysis(response, data.primaryMetric.metric.field_name);
      const desiredN = primary?.sufficient_n ? (primary.target_n ?? undefined) : undefined;
      const sampleSizeOption = desiredN === undefined ? PowerCheckOption.NONE : PowerCheckOption.USE_POWER_CHECK;
      dispatch({ type: 'set-power-check-response', response, desiredN, sampleSizeOption, designSpec });
    } catch (err) {
      if (err instanceof ZodError) {
        setValidationError(err);
        return;
      }
      throw err;
    }
  };

  const handleEstimatedMDEChange = ({ sampleSizeOption, desiredN, response, designSpec }: PowerCheckResponseChange) => {
    dispatch({ type: 'set-power-check-response', sampleSizeOption, desiredN, response, designSpec });
  };

  const handleSampleOptionChange = ({ sampleSizeOption, desiredN, response }: PowerCheckSampleOptionChange) => {
    dispatch({ type: 'set-chosen-n', sampleSizeOption, desiredN, response });
  };

  const primaryMetricFieldName = data.primaryMetric?.metric.field_name ?? '';
  const isClustered = isClusteredExperimentFormData(data);
  const primaryPower =
    data.powerCheckResponse !== undefined && !validationError
      ? getPowerAnalysis(data.powerCheckResponse, primaryMetricFieldName)
      : undefined;
  const restPower =
    data.powerCheckResponse !== undefined && !validationError
      ? data.powerCheckResponse.analyses.filter((a) => a.metric_spec.field_name !== primaryMetricFieldName)
      : undefined;
  const primaryPowerClusterSizeCv = primaryPower?.msg?.values?.cluster_size_cv ?? primaryPower?.metric_spec.cv;

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

      {data.clusterKey && (
        <SectionCard title="Cluster Statistics">
          <ClusterStatisticsSection data={data} dispatch={dispatch} />
        </SectionCard>
      )}

      <SectionCard title="Analysis">
        <Flex direction="column" gap="3" align="center">
          <RunPowerCheckButton
            enabled={enabled}
            onClick={handlePowerCheck}
            loading={isMutating}
            disabledReason={reason}
          />

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
              <Flex direction="column" gap="2">
                <Callout.Text>
                  {primaryPower.msg?.msg ||
                    (primaryPower.sufficient_n
                      ? 'The experiment has sufficient power.'
                      : 'The experiment does not have sufficient power.')}
                </Callout.Text>
                {primaryPower.msg?.high_cluster_variation && primaryPowerClusterSizeCv != null && (
                  <Box
                    p="2"
                    style={{
                      backgroundColor: 'var(--amber-a3)',
                      border: '1px solid var(--amber-a5)',
                      borderRadius: 'var(--radius-3)',
                    }}
                  >
                    <Flex gap="2" align="start">
                      <Flex flexShrink="0">
                        <ExclamationTriangleIcon color="var(--amber-11)" />
                      </Flex>
                      <Text size="2" color="amber">
                        Because your cluster sizes vary so widely, your experiment is sensitive to enrolling fewer
                        participants or clusters. Consider adding filters to exclude extreme cluster sizes or adding
                        more clusters to be safer.
                      </Text>
                    </Flex>
                  </Box>
                )}
              </Flex>
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
                            <Badge color={'green'}>OK</Badge>
                          ) : (
                            <Badge color={'red'}>Too Few</Badge>
                          )}
                        </DataList.Value>
                      </DataList.Item>
                      <DataList.Item>
                        <DataList.Label>Required</DataList.Label>
                        <DataList.Value>
                          <MetricSampleSizeDisplay
                            analysis={primaryPower}
                            isClustered={isClustered}
                            variant="required"
                          />
                        </DataList.Value>
                      </DataList.Item>
                      <DataList.Item>
                        <DataList.Label>Available</DataList.Label>
                        <DataList.Value>
                          <MetricSampleSizeDisplay
                            analysis={primaryPower}
                            isClustered={isClustered}
                            variant="available"
                          />
                        </DataList.Value>
                      </DataList.Item>
                      <DataList.Item>
                        <DataList.Label>Available (non-null)</DataList.Label>
                        <DataList.Value>
                          <MetricSampleSizeDisplay
                            analysis={primaryPower}
                            isClustered={isClustered}
                            variant="available-nonnull"
                          />
                        </DataList.Value>
                      </DataList.Item>
                      {primaryPower.pct_change_possible !== null && primaryPower.pct_change_possible !== undefined && (
                        <DataList.Item>
                          <DataList.Label>MDE</DataList.Label>
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
                              <Badge color={'green'}>OK</Badge>
                            ) : (
                              <Badge color={'red'}>Too Few</Badge>
                            )}
                          </Table.Cell>
                          <Table.Cell align={'right'}>
                            <MetricSampleSizeDisplay
                              analysis={metricAnalysis}
                              isClustered={isClustered}
                              variant="required"
                            />
                          </Table.Cell>
                          <Table.Cell align={'right'}>
                            <MetricSampleSizeDisplay
                              analysis={metricAnalysis}
                              isClustered={isClustered}
                              variant="available"
                            />
                          </Table.Cell>
                          <Table.Cell align={'right'}>
                            <MetricSampleSizeDisplay
                              analysis={metricAnalysis}
                              isClustered={isClustered}
                              variant="available-nonnull"
                            />
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
          <Flex direction="column" gap="3" align="start" width="100%">
            <Text>Choose the total number of participants to distribute across all arms:</Text>
            <Flex direction="column" gap="2" align="center" width="100%">
              {!data.powerCheckResponse.analyses.map((a) => a.sufficient_n).every((sufficient) => sufficient) && (
                <Callout.Root color="orange">
                  <Callout.Icon>
                    <CrossCircledIcon />
                  </Callout.Icon>
                  <Callout.Text>
                    You don&apos;t have a sufficient sample size for one or more metrics. You can still proceed with a
                    custom sample size, but consider adjusting your experiment design.
                  </Callout.Text>
                </Callout.Root>
              )}
              <PowerCheckSampleSizeSelector
                datasourceId={data.datasourceId!}
                isClustered={isClustered}
                powerCheckResponse={data.powerCheckResponse}
                primaryMetricFieldName={primaryMetricFieldName}
                targetMde={data.primaryMetric?.mde}
                selectedSampleOption={data.sampleSizeOption ?? PowerCheckOption.USE_POWER_CHECK}
                desiredN={data.desiredN}
                mdePowerCheckResponse={data.mdePowerCheckResponse}
                makeDesignSpec={(desiredN) => convertToFrequentistDesignSpec({ ...data, desiredN })}
                onOptionChange={handleSampleOptionChange}
                onEstimatedMDEChange={handleEstimatedMDEChange}
              />
            </Flex>
          </Flex>
        </SectionCard>
      )}
    </Flex>
  );
}
