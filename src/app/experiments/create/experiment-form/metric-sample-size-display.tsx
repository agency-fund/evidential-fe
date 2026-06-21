import { Flex, Text } from '@radix-ui/themes';
import { MetricPowerAnalysis } from '@/api/methods.schemas';

export type MetricSampleSizeVariant = 'required' | 'available' | 'available-nonnull';

const getAvailableParticipantColor = (
  available: number | null | undefined,
  target: number | null | undefined,
): 'crimson' | undefined => {
  if (available == null || available === 0 || (target != null && available < target)) {
    return 'crimson';
  }
  return undefined;
};

const getAvailableNonnullParticipantColor = (
  availableNonnull: number | null | undefined,
  available: number | null | undefined,
  target: number | null | undefined,
): 'crimson' | undefined => {
  if (
    availableNonnull == null ||
    availableNonnull === 0 ||
    (target != null && availableNonnull < target) ||
    (available != null && availableNonnull < available)
  ) {
    return 'crimson';
  }
  return undefined;
};

const getDisplayColor = (
  analysis: MetricPowerAnalysis,
  variant: MetricSampleSizeVariant,
): 'crimson' | 'green' | undefined => {
  switch (variant) {
    case 'required':
      return analysis.sufficient_n ? 'green' : undefined;
    case 'available':
      return getAvailableParticipantColor(analysis.metric_spec.available_n, analysis.target_n);
    case 'available-nonnull':
      return getAvailableNonnullParticipantColor(
        analysis.metric_spec.available_nonnull_n,
        analysis.metric_spec.available_n,
        analysis.target_n,
      );
  }
};

const getParticipantN = (analysis: MetricPowerAnalysis, variant: MetricSampleSizeVariant): number | undefined => {
  switch (variant) {
    case 'required':
      return analysis.target_n ?? undefined;
    case 'available':
      return analysis.metric_spec.available_n ?? undefined;
    case 'available-nonnull':
      return analysis.metric_spec.available_nonnull_n ?? undefined;
  }
};

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
  color?: 'crimson' | 'green';
  align?: 'center' | 'end';
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
  align?: 'center' | 'end';
}

export function MetricSampleSizeDisplay({
  analysis,
  isClustered,
  variant,
  align = 'end',
}: MetricSampleSizeDisplayProps) {
  const participantN = getParticipantN(analysis, variant);
  const color = getDisplayColor(analysis, variant);

  if (!isClustered) {
    return <SampleSizeDisplayImpl participantN={participantN} clusterN={undefined} color={color} align={align} />;
  }

  const clusterN =
    variant === 'required'
      ? analysis.num_clusters_total
      : estimateClusterN(participantN, analysis.metric_spec.avg_cluster_size ?? undefined);

  return (
    <SampleSizeDisplayImpl participantN={participantN} clusterN={clusterN ?? undefined} color={color} align={align} />
  );
}
