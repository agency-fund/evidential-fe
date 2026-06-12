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
        Information on how your data is clustered is required to estimate sample size. We will derive them from your
        data source, but you can enter your own below if desired. (NOTE: The ICC estimate entered or derived from the
        primary metric will also be applied to all other metrics whether appropriate or not!)
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
