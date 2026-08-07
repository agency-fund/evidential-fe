'use client';

import Link from 'next/link';
import { ActivityLogIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Badge, Box, Flex, Heading, Select, Text, Tooltip } from '@radix-ui/themes';

const SNAPSHOT_ERROR_ALERT_THRESHOLD_MS = 8 * 60 * 60 * 1000;

type AnalysisOption = {
  key: string;
  label: string;
};

interface AnalysisSnapshotSelectorProps {
  datasourceId: string;
  experimentId: string;
  liveAnalysisLabel: string;
  analysisHistory: AnalysisOption[];
  activeAnalysisKey: string;
  onSelectAnalysis: (key: string) => void;
  lastErrorTimestamp: Date | null;
}

export function AnalysisSnapshotSelector({
  datasourceId,
  experimentId,
  liveAnalysisLabel,
  analysisHistory,
  activeAnalysisKey,
  onSelectAnalysis,
  lastErrorTimestamp,
}: AnalysisSnapshotSelectorProps) {
  const isLastSnapshotErrorRelevant =
    lastErrorTimestamp !== null && Date.now() - lastErrorTimestamp.getTime() <= SNAPSHOT_ERROR_ALERT_THRESHOLD_MS;

  const snapshotsHref = `/datasources/${datasourceId}/experiments/${experimentId}/snapshots`;

  return (
    <Badge size="2" style={{ height: '26px' }}>
      <Flex gap="2" align="center">
        <Heading size="2">Viewing:</Heading>
        {analysisHistory.length == 0 ? (
          <Text>{liveAnalysisLabel}</Text>
        ) : (
          <>
            <Select.Root size="1" value={activeAnalysisKey} onValueChange={onSelectAnalysis}>
              <Select.Trigger style={{ height: 18 }} />
              <Select.Content>
                <Select.Group>
                  <Select.Item key="live" value="live">
                    <Box minWidth="136px">{liveAnalysisLabel}</Box>
                  </Select.Item>
                </Select.Group>
                <Select.Separator />
                <Select.Group>
                  {analysisHistory.map((opt) => (
                    <Select.Item key={opt.key} value={opt.key}>
                      <Box minWidth="136px">{opt.label}</Box>
                    </Select.Item>
                  ))}
                </Select.Group>
              </Select.Content>
            </Select.Root>
            {isLastSnapshotErrorRelevant ? (
              <Tooltip content={'Last snapshot error: ' + lastErrorTimestamp?.toLocaleTimeString()}>
                <Link href={snapshotsHref}>
                  <ExclamationTriangleIcon color={'red'} />
                </Link>
              </Tooltip>
            ) : (
              <Tooltip content={'View snapshot log'}>
                <Link href={snapshotsHref}>
                  <ActivityLogIcon />
                </Link>
              </Tooltip>
            )}
          </>
        )}
      </Flex>
    </Badge>
  );
}
