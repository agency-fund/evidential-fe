'use client';

import { Button, Flex, Grid, Text, TextField, Tooltip } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { ExperimentFormData } from './experiment-form-types';
import { EditableTextField } from '@/components/ui/inputs/editable-text-field';

export type ClusterStatisticsSectionAction =
  | { type: 'set-cluster-icc'; value: number | undefined }
  | { type: 'set-cluster-cv'; value: number | undefined }
  | { type: 'set-cluster-avg-size'; value: number | undefined }
  | { type: 'clear-cluster-stats' };

const parseStatValue = (input: string, { min, max }: { min?: number; max?: number } = {}): number | undefined => {
  const parsed = input === '' ? undefined : Number(input);
  if (parsed === undefined || isNaN(parsed)) return undefined;
  if (min !== undefined && parsed < min) return min;
  if (max !== undefined && parsed > max) return max;
  return parsed;
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

interface ClusterStatisticsSectionProps {
  data: ExperimentFormData;
  dispatch: (action: ClusterStatisticsSectionAction) => void;
}

export function ClusterStatisticsSection({ data, dispatch }: ClusterStatisticsSectionProps) {
  const hasClusterStatValues =
    data.clusterIcc !== undefined || data.clusterCv !== undefined || data.clusterAvgClusterSize !== undefined;

  return (
    <Flex direction="column" gap="3">
      <Text size="2" color="gray">
        Cluster statistics are needed to estimate sample size. These will be derived from your data source, but you can
        enter your own values below. The Intracluster Correlation Coefficient (ICC) from the primary metric or entered
        here is also applied to all other metrics.
      </Text>

      <Flex align="center" gap="2">
        <Text as="label" size="2" weight="bold">
          Cluster ID field:
        </Text>
        <TextField.Root value={data.clusterKey ?? ''} readOnly />
        <Button
          type="button"
          variant="soft"
          disabled={!hasClusterStatValues}
          onClick={() => dispatch({ type: 'clear-cluster-stats' })}
        >
          Reset stats
        </Button>
      </Flex>

      <Grid columns={{ initial: '1', sm: '3' }} gap="4">
        <Flex direction="column" gap="1">
          <LabelWithTooltip label="Average Cluster Size" tooltip="The average number of participants per cluster." />
          <EditableTextField
            value={formatStatValue(data.clusterAvgClusterSize, 2)}
            onSubmit={(value) => {
              dispatch({ type: 'set-cluster-avg-size', value: parseStatValue(value, { min: 0 }) });
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
            tooltip="How similar individual primary metric values are within the same cluster. Values range from 0 to 1; higher values mean more similarity within clusters, which increases the total sample size you need."
          />
          <EditableTextField
            value={formatStatValue(data.clusterIcc, 3)}
            onSubmit={(value) => {
              dispatch({ type: 'set-cluster-icc', value: parseStatValue(value, { min: 0, max: 1 }) });
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
            tooltip="How much your cluster sizes vary from one another. Higher values mean more variability, which increases the total sample size you need."
          />
          <EditableTextField
            value={formatStatValue(data.clusterCv, 2)}
            onSubmit={(value) => {
              dispatch({ type: 'set-cluster-cv', value: parseStatValue(value, { min: 0 }) });
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
