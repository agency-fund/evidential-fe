import { Flex, Text } from '@radix-ui/themes';
import { MetricPowerAnalysis } from '@/api/methods.schemas';

export type MetricSampleSizeVariant = 'required' | 'available' | 'available-nonnull';

type SampleSizeColor = 'crimson' | 'green';

interface SampleSizeDisplayModel {
  participantN: number | undefined;
  clusterN: number | undefined;
  color: SampleSizeColor | undefined;
}

export const estimateParticipantNFromClusters = (clusterN: number, avgClusterSize: number): number =>
  Math.ceil(clusterN * avgClusterSize);

interface SampleSizeDisplayImplProps {
  participantN: number | undefined;
  clusterN: number | undefined;
  color: SampleSizeColor | undefined;
  isClustered: boolean;
  align: 'start' | 'center' | 'end';
}

function SampleSizeDisplayImpl({
  participantN,
  clusterN,
  color,
  isClustered,
  align = 'end',
}: SampleSizeDisplayImplProps) {
  const participantString = participantN?.toLocaleString() ?? undefined;
  const clusterString = clusterN?.toLocaleString() ?? undefined;

  if (participantString === undefined && clusterString === undefined) {
    return <>?</>;
  }
  if (clusterString === undefined) {
    if (isClustered) {
      // This case may arise when the cluster count is not available, e.g. when displaying the non-null counts.
      return (
        <Flex direction="column" align={align} gap="0">
          <Text size="1" color={color ?? 'gray'}>
            {participantString} participants
          </Text>
        </Flex>
      );
    }
    return color ? <Text color={color}>{participantString}</Text> : <>{participantString}</>;
  }
  if (participantString === undefined) {
    return (
      <Text weight="bold" color={color}>
        {clusterString} clusters
      </Text>
    );
  }

  return (
    <Flex direction="column" align={align} gap="0">
      <Text weight="bold" color={color}>
        {clusterString} clusters
      </Text>
      <Text size="1" color="gray">
        {participantString} participants
      </Text>
    </Flex>
  );
}

export interface MetricSampleSizeDisplayProps {
  analysis?: MetricPowerAnalysis;
  isClustered: boolean;
  variant: MetricSampleSizeVariant;
  align?: 'start' | 'center' | 'end';
}

const getDisplayModel = (
  isClustered: boolean,
  variant: MetricSampleSizeVariant,
  analysis?: MetricPowerAnalysis,
): SampleSizeDisplayModel => {
  if (analysis === undefined) {
    return {
      participantN: undefined,
      clusterN: undefined,
      color: undefined,
    };
  }
  const targetN = analysis.target_n;

  switch (variant) {
    case 'required': {
      const participantN = targetN ?? undefined;
      return {
        participantN,
        clusterN: isClustered ? (analysis.num_clusters_total ?? undefined) : undefined,
        color: analysis.sufficient_n ? 'green' : undefined,
      };
    }
    case 'available': {
      const participantN = analysis.metric_spec.available_n ?? undefined;
      return {
        participantN,
        clusterN: isClustered ? (analysis.metric_spec.available_n_clusters ?? undefined) : undefined,
        color:
          participantN === undefined || participantN === 0 || (targetN != null && participantN < targetN)
            ? 'crimson'
            : undefined,
      };
    }
    case 'available-nonnull': {
      const participantN = analysis.metric_spec.available_nonnull_n ?? undefined;
      return {
        participantN,
        // available_n_clusters counts clusters across all the available_n rows, not just rows where the metric is non-null, so does not apply here.
        clusterN: undefined,
        // Crimson only when the non-null count is insufficient for the required n.
        color:
          participantN === undefined || participantN === 0 || (targetN != null && participantN < targetN)
            ? 'crimson'
            : undefined,
      };
    }
  }
};

export function MetricSampleSizeDisplay({
  analysis,
  isClustered,
  variant,
  align = 'end',
}: MetricSampleSizeDisplayProps) {
  return (
    <SampleSizeDisplayImpl
      {...getDisplayModel(isClustered, variant, analysis)}
      isClustered={isClustered}
      align={align}
    />
  );
}
