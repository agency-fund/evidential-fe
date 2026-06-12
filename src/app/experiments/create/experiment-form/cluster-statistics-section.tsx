'use client';

import { Button, Flex, Grid, Spinner, Text, TextField, Tooltip } from '@radix-ui/themes';
import { InfoCircledIcon, Share1Icon } from '@radix-ui/react-icons';
import { ExperimentFormData } from './experiment-form-types';
import { usePowerCheck } from '@/api/admin';
import { convertToFrequentistDesignSpec } from './experiment-form-helpers';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { EditableTextField } from '@/components/ui/inputs/editable-text-field';
import { ZodError } from 'zod';
import { useState } from 'react';

export type ClusterStatisticsSectionAction =
  | { type: 'set-cluster-icc'; value: number | undefined }
  | { type: 'set-cluster-cv'; value: number | undefined }
  | { type: 'set-cluster-avg-size'; value: number | undefined }
  | {
      type: 'set-cluster-stats-from-datasource';
      icc?: number;
      cv?: number;
      avgClusterSize?: number;
    };

const parseStatValue = (input: string): number | undefined => {
  const parsed = input === '' ? undefined : Number(input);
  return parsed !== undefined && !isNaN(parsed) ? parsed : undefined;
};

const formatStatValue = (value: number | undefined, decimalPlaces?: number): string => {
  if (value === undefined) return '';
  return decimalPlaces !== undefined ? value.toFixed(decimalPlaces) : String(value);
};

const formatStatDisplay = (value: number | undefined, decimalPlaces: number = 2): string => {
  if (value === undefined) return '—';
  return value.toFixed(decimalPlaces);
};

interface LabelWithTooltipProps {
  label: string;
  tooltip: string;
}

function LabelWithTooltip({ label, tooltip }: LabelWithTooltipProps) {
  return (
    <Flex align="center" gap="1">
      <Text as="label" size="2" weight="bold">
        {label}
      </Text>
      <Tooltip content={tooltip}>
        <InfoCircledIcon />
      </Tooltip>
    </Flex>
  );
}

interface CalculateFromDatasourceButtonProps {
  onClick: () => Promise<void>;
  loading: boolean;
  disabledReason?: string;
}

function CalculateFromDatasourceButton({ onClick, loading, disabledReason }: CalculateFromDatasourceButtonProps) {
  const disabled = disabledReason !== undefined;
  const button = (
    <Button type="button" disabled={disabled || loading} onClick={onClick}>
      <Spinner loading={loading}>
        <Share1Icon />
      </Spinner>
      Calculate from your Datasource
    </Button>
  );

  return disabled ? (
    <Tooltip content={disabledReason} side="top" align="start">
      {button}
    </Tooltip>
  ) : (
    button
  );
}

interface ClusterStatisticsSectionProps {
  data: ExperimentFormData;
  dispatch: (action: ClusterStatisticsSectionAction) => void;
}

export function ClusterStatisticsSection({ data, dispatch }: ClusterStatisticsSectionProps) {
  const [validationError, setValidationError] = useState<ZodError | null>(null);
  const { trigger: triggerPowerCheck, isMutating, error } = usePowerCheck(data.datasourceId!);

  const handleCalculate = async () => {
    setValidationError(null);

    if (!data.clusterKey || !data.primaryMetric) {
      return;
    }

    try {
      const designSpec = convertToFrequentistDesignSpec({ ...data, desiredN: undefined });
      const response = await triggerPowerCheck({ design_spec: designSpec });
      const primary = response.analyses.find((a) => a.metric_spec.field_name === data.primaryMetric?.metric.field_name);
      const metricSpec = primary?.metric_spec;

      dispatch({
        type: 'set-cluster-stats-from-datasource',
        icc: metricSpec?.icc ?? undefined,
        cv: metricSpec?.cv ?? undefined,
        avgClusterSize: metricSpec?.avg_cluster_size ?? undefined,
      });
    } catch (err) {
      if (err instanceof ZodError) {
        setValidationError(err);
        return;
      }
      throw err;
    }
  };

  return (
    <Flex direction="column" gap="3">
      <Text size="2" color="gray">
        Information on how your data is clustered is required to estimate sample size. We will derive them from your
        data source, but you can enter your own below if desired. (NOTE: The ICC estimate entered or derived from the
        primary metric will also be applied to all other metrics whether appropriate or not!)
      </Text>

      <Flex align="center" gap="2">
        <Text as="label" size="2" weight="bold">
          Cluster ID field:
        </Text>
        <TextField.Root value={data.clusterKey ?? ''} readOnly />
        <CalculateFromDatasourceButton
          onClick={handleCalculate}
          loading={isMutating}
          disabledReason={data.primaryMetric === undefined ? 'Select a primary metric.' : undefined}
        />
      </Flex>

      {error && <GenericErrorCallout title="Failed to calculate cluster statistics" error={error} />}

      {validationError && (
        <GenericErrorCallout
          title="Validation failed"
          message={validationError.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n')}
        />
      )}

      <Grid columns={{ initial: '1', sm: '3' }} gap="4">
        <Flex direction="column" gap="1">
          <LabelWithTooltip label="Avg cluster size" tooltip="The average number of participants per cluster." />
          <EditableTextField
            value={formatStatValue(data.clusterAvgClusterSize, 2)}
            onSubmit={(value) => {
              dispatch({ type: 'set-cluster-avg-size', value: parseStatValue(value) });
            }}
            type="number"
            min={0}
            size="2"
          >
            <Text size="2">{formatStatDisplay(data.clusterAvgClusterSize)}</Text>
          </EditableTextField>
        </Flex>

        <Flex direction="column" gap="1">
          <LabelWithTooltip
            label="Intracluster Correlation Coefficient"
            tooltip="How similar individual Primary Metric values are within the same cluster, ranging from [0, 1]. Higher ICC means participants in a cluster tend to have similar results, which increases the total sample size you need."
          />
          <EditableTextField
            value={formatStatValue(data.clusterIcc, 3)}
            onSubmit={(value) => {
              dispatch({ type: 'set-cluster-icc', value: parseStatValue(value) });
            }}
            type="number"
            min={0}
            max={1}
            step={0.005}
            size="2"
            minWidth="7ch"
          >
            <Text size="2">{formatStatDisplay(data.clusterIcc, 3)}</Text>
          </EditableTextField>
        </Flex>

        <Flex direction="column" gap="1">
          <LabelWithTooltip
            label="Coefficient of Variation"
            tooltip="How much your cluster sizes vary from one another, ranging from [0, infinity]. Higher CV means more variability, which increases the total sample size you need."
          />
          <EditableTextField
            value={formatStatValue(data.clusterCv, 2)}
            onSubmit={(value) => {
              dispatch({ type: 'set-cluster-cv', value: parseStatValue(value) });
            }}
            type="number"
            min={0}
            step={0.05}
            size="2"
          >
            <Text size="2">{formatStatDisplay(data.clusterCv)}</Text>
          </EditableTextField>
        </Flex>
      </Grid>
    </Flex>
  );
}
