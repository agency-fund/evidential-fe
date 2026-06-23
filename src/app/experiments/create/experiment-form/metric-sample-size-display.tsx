import { Flex, Text } from '@radix-ui/themes';
import { MetricPowerAnalysis } from '@/api/methods.schemas';

export type MetricSampleSizeVariant = 'required' | 'available' | 'available-nonnull';

type SampleSizeColor = 'crimson' | 'green';

interface SampleSizeDisplayModel {
  participantN: number | undefined;
  clusterN: number | undefined;
  color: SampleSizeColor | undefined;
}

export const estimateClusterN = (
  participantN: number | undefined,
  avgClusterSize: number | undefined,
): number | undefined => {
  if (participantN === undefined || avgClusterSize === undefined || avgClusterSize <= 0) {
    return undefined;
  }
  return Math.floor(participantN / avgClusterSize);
};

export const estimateParticipantNFromClusters = (clusterN: number, avgClusterSize: number): number =>
  Math.ceil(clusterN * avgClusterSize);

interface SampleSizeDisplayImplProps {
  participantN: number | undefined;
  clusterN: number | undefined;
  color?: SampleSizeColor;
  align?: 'start' | 'center' | 'end';
}

function SampleSizeDisplayImpl({ participantN, clusterN, color, align = 'end' }: SampleSizeDisplayImplProps) {
  const participantString = participantN?.toLocaleString() ?? undefined;
  const clusterString = clusterN?.toLocaleString() ?? undefined;

  if (participantString === undefined && clusterString === undefined) {
    return <>?</>;
  }
  if (clusterString === undefined) {
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
  analysis: MetricPowerAnalysis;
  isClustered: boolean;
  variant: MetricSampleSizeVariant;
  align?: 'start' | 'center' | 'end';
}

const getDisplayModel = (
  analysis: MetricPowerAnalysis,
  isClustered: boolean,
  variant: MetricSampleSizeVariant,
): SampleSizeDisplayModel => {
  const avgClusterSize = analysis.metric_spec.avg_cluster_size ?? undefined;
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
        clusterN: isClustered ? estimateClusterN(participantN, avgClusterSize) : undefined,
        color:
          participantN === undefined || participantN === 0 || (targetN != null && participantN < targetN)
            ? 'crimson'
            : undefined,
      };
    }
    case 'available-nonnull': {
      const participantN = analysis.metric_spec.available_nonnull_n ?? undefined;
      const availableN = analysis.metric_spec.available_n;
      return {
        participantN,
        clusterN: isClustered ? estimateClusterN(participantN, avgClusterSize) : undefined,
        color:
          participantN === undefined ||
          participantN === 0 ||
          (targetN != null && participantN < targetN) ||
          (availableN != null && participantN < availableN)
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
  return <SampleSizeDisplayImpl {...getDisplayModel(analysis, isClustered, variant)} align={align} />;
}
