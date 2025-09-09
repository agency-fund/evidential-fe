'use client';
import { Badge, Box, Button, Flex, Heading, Separator, Table, Tabs, Text, Tooltip } from '@radix-ui/themes';
import { useParams } from 'next/navigation';
import { CalendarIcon, CodeIcon, InfoCircledIcon, PersonIcon } from '@radix-ui/react-icons';
import { useAnalyzeExperiment, useGetExperiment, useListSnapshots } from '@/api/admin';
import { ForestPlot } from '@/components/features/experiments/forest-plot';
import { XSpinner } from '@/components/ui/x-spinner';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import { useEffect, useMemo, useState } from 'react';
import * as Toast from '@radix-ui/react-toast';
import { CodeSnippetCard } from '@/components/ui/cards/code-snippet-card';
import { ExperimentTypeBadge } from '@/components/features/experiments/experiment-type-badge';
import { ParticipantTypeBadge } from '@/components/features/participants/participant-type-badge';
import { ReadMoreText } from '@/components/ui/read-more-text';
import { SectionCard } from '@/components/ui/cards/section-card';
import {
  DesignSpecOutput,
  FreqExperimentAnalysisResponse,
  ExperimentAnalysisResponse,
  Snapshot,
  OnlineFrequentistExperimentSpecOutput,
  PreassignedFrequentistExperimentSpecOutput,
} from '@/api/methods.schemas';
import { DownloadAssignmentsCsvButton } from '@/components/features/experiments/download-assignments-csv-button';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { extractUtcHHMMLabel, formatUtcDownToMinuteLabel } from '@/services/date-utils';

// Type guard to assure TypeScript that a DesignSpec is one of two types.
function isFrequentistDesign(
  designSpec: DesignSpecOutput,
): designSpec is PreassignedFrequentistExperimentSpecOutput | OnlineFrequentistExperimentSpecOutput {
  return designSpec.experiment_type === 'freq_preassigned' || designSpec.experiment_type === 'freq_online';
}

export default function ExperimentViewPage() {
  const [openToast, setOpenToast] = useState(false);
  const params = useParams();
  const experimentId = params.experimentId as string;
  const datasourceId = params.datasourceId as string;
  const orgCtx = useCurrentOrganization();
  const organizationId = orgCtx?.current.id || '';

  const [liveReceivedAt, setLiveReceivedAt] = useState<Date | null>(null);
  const [selectedSnapshotIndex, setSelectedSnapshotIndex] = useState<number>(-1);
  const [cachedSnapshots, setCachedSnapshots] = useState<Snapshot[]>([]);
  const [selectedAnalysisData, setSelectedAnalysisData] = useState<ExperimentAnalysisResponse | undefined>(undefined);

  const {
    data: experiment,
    isLoading: isLoadingExperiment,
    error: experimentError,
  } = useGetExperiment(datasourceId || '', experimentId, {
    swr: { enabled: !!datasourceId },
  });

  const {
    data: liveAnalysisData,
    isLoading: isLoadingAnalysis,
    error: analysisError,
  } = useAnalyzeExperiment(datasourceId || '', experimentId, undefined, {
    swr: { enabled: !!datasourceId && !!experiment, shouldRetryOnError: false },
  });

  // Fetch successful snapshots and cache items
  const { data: snapshotsResp } = useListSnapshots(
    organizationId || '',
    datasourceId || '',
    experimentId || '',
    { status: ['success'] },
    { swr: { enabled: !!organizationId && !!datasourceId && !!experimentId } },
  );

  useEffect(() => {
    if (snapshotsResp?.items) {
      setCachedSnapshots(snapshotsResp.items);
    }
  }, [snapshotsResp]);

  // Track when we receive fresh live analysis data
  useEffect(() => {
    if (liveAnalysisData) {
      setLiveReceivedAt(new Date());
    }
  }, [liveAnalysisData]);

  // Make human-readable labels for the dropdown, showing UTC down to the minute
  const snapshotDropdownOptions = useMemo(() => {
    const opts: { key: number; index: number; label: string }[] = [];
    if (!cachedSnapshots.length) return opts;
    for (let i = 0; i < cachedSnapshots.length; i++) {
      const s = cachedSnapshots[i];
      const d = new Date(s.updated_at);
      opts.push({ key: d.getTime(), index: i, label: formatUtcDownToMinuteLabel(d) });
    }
    return opts;
  }, [cachedSnapshots]);

  const selectedSnapshotData: ExperimentAnalysisResponse | undefined = useMemo(() => {
    if (cachedSnapshots.length <= 0 || selectedSnapshotIndex < 0 || selectedSnapshotIndex >= cachedSnapshots.length) {
      return undefined;
    }
    return cachedSnapshots[selectedSnapshotIndex].data as ExperimentAnalysisResponse;
  }, [cachedSnapshots, selectedSnapshotIndex]);

  useEffect(() => {
    if (selectedSnapshotIndex == -1 && liveAnalysisData) return setSelectedAnalysisData(liveAnalysisData);
    if (selectedSnapshotIndex >= 0 && selectedSnapshotData) return setSelectedAnalysisData(selectedSnapshotData);
    setSelectedAnalysisData(undefined);
  }, [selectedSnapshotIndex, selectedSnapshotData, liveAnalysisData]);

  if (isLoadingExperiment) {
    return <XSpinner message="Loading experiment details..." />;
  }

  if (experimentError) {
    return <GenericErrorCallout title="Error loading experiment" error={experimentError} />;
  }

  if (!experiment) {
    return <Text>No experiment data found</Text>;
  }

  const { design_spec, assign_summary } = experiment;
  const { experiment_name, description, start_date, end_date, arms } = design_spec;

  return (
    <Flex direction="column" gap="6">
      <Flex align="start" direction="column" gap="3">
        <Flex direction="row" gap="2" align="center">
          <Heading size="8">{experiment_name}</Heading>
          <CopyToClipBoard content={experimentId} tooltipContent="Copy experiment ID" />
        </Flex>

        <Flex gap="4" align="center">
          <Flex align="center" gap="1">
            <Text weight="bold">Type:</Text>
            <ExperimentTypeBadge type={design_spec.experiment_type} />
          </Flex>
          <Separator orientation="vertical" />

          <Flex align="center" gap="1">
            <Text weight="bold">Participants:</Text>
            <ParticipantTypeBadge
              datasourceId={experiment.datasource_id}
              participantType={experiment.design_spec.participant_type}
            />
          </Flex>
          <Separator orientation="vertical" />
          <Flex align="center" gap="2">
            <CalendarIcon />
            <Text>{new Date(start_date).toLocaleDateString()}</Text>
            <Text>→</Text>
            <Text>{new Date(end_date).toLocaleDateString()}</Text>
          </Flex>
        </Flex>
      </Flex>
      <Flex direction="column" gap="4">
        {/* Hypothesis Section */}
        <SectionCard title="Hypothesis">
          <ReadMoreText text={description} />
        </SectionCard>

        {/* Arms & Allocations Section */}
        {assign_summary && (
          <SectionCard
            title="Arms & Allocations"
            headerRight={
              <Flex justify="between" width="100%">
                <DownloadAssignmentsCsvButton datasourceId={experiment.datasource_id} experimentId={experimentId} />
                <Badge>
                  <PersonIcon />
                  <Text size="2">{assign_summary.sample_size.toLocaleString()} participants</Text>
                </Badge>
              </Flex>
            }
          >
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {arms.map((arm) => {
                  const armSize = assign_summary.arm_sizes?.find((a) => a.arm.arm_id === arm.arm_id)?.size || 0;
                  const percentage = (armSize / assign_summary.sample_size) * 100;
                  return (
                    <Table.Row key={arm.arm_id}>
                      <Table.Cell>
                        <Flex direction="column" gap="4" align="start">
                          <Flex gap="2" align="center">
                            <Heading size="2">{arm.arm_name}</Heading>
                            <CopyToClipBoard content={arm.arm_id || ''} tooltipContent="Copy arm ID" />
                          </Flex>
                          <Flex direction="column" gap="3" align="start">
                            <Badge>
                              <PersonIcon />
                              <Text>{armSize.toLocaleString()} participants</Text>
                            </Badge>
                            <Badge>{percentage.toFixed(1)}%</Badge>
                          </Flex>
                        </Flex>
                      </Table.Cell>
                      <Table.Cell>
                        <ReadMoreText text={arm.arm_description || 'No description'} />
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          </SectionCard>
        )}

        {/* Analysis Section */}
        <SectionCard
          title="Analysis"
          headerRight={
            (design_spec?.experiment_type === 'freq_online' || design_spec?.experiment_type === 'freq_preassigned') && (
              <Flex gap="3" wrap="wrap">
                <Flex gap="3" wrap="wrap" align="center" justify="between">
                  <Badge size="2">
                    <Flex gap="2" align="center">
                      <Heading size="2">Viewing:</Heading>
                      {snapshotDropdownOptions.length == 0 ? (
                        <Text>
                          {liveReceivedAt ? `LIVE (as of ${extractUtcHHMMLabel(liveReceivedAt)})` : 'No data yet'}
                        </Text>
                      ) : (
                        <select
                          value={selectedSnapshotIndex}
                          onChange={(e) => setSelectedSnapshotIndex(Number(e.target.value))}
                          style={{ border: '1px solid var(--gray-6)' }}
                        >
                          <option key="live" value="-1">
                            {liveReceivedAt ? `LIVE (as of ${extractUtcHHMMLabel(liveReceivedAt)})` : 'No data yet'}
                          </option>
                          {snapshotDropdownOptions.map((opt) => (
                            <option key={opt.key} value={opt.index}>
                              {' '}
                              {opt.label}{' '}
                            </option>
                          ))}
                        </select>
                      )}
                    </Flex>
                  </Badge>
                </Flex>
                <Flex gap="3" wrap="wrap">
                  <Badge size="2">
                    <Flex gap="4" align="center">
                      <Heading size="2">Confidence:</Heading>
                      <Flex gap="2" align="center">
                        <Text>{(1 - (design_spec.alpha || 0.05)) * 100}%</Text>
                        <Tooltip content="Chance that our test correctly shows no significant difference, if there truly is none. (The probability of avoiding a false positive.)">
                          <InfoCircledIcon />
                        </Tooltip>
                      </Flex>
                    </Flex>
                  </Badge>
                  <Badge size="2">
                    <Flex gap="4" align="center">
                      <Heading size="2">Power:</Heading>
                      <Flex gap="2" align="center">
                        <Text>{design_spec.power ? `${design_spec.power * 100}%` : '?'}</Text>
                        <Tooltip content="Chance of detecting a difference at least as large as the pre-specified minimum effect for the metric, if that difference truly exists. (The probability of avoiding a false negative.)">
                          <InfoCircledIcon />
                        </Tooltip>
                      </Flex>
                    </Flex>
                  </Badge>
                </Flex>
              </Flex>
            )
          }
        >
          {isLoadingAnalysis && <XSpinner message="Loading analysis data..." />}

          {analysisError && (
            <GenericErrorCallout
              title="Error loading analysis"
              message="Analysis may not be available yet or the experiment hasn't collected enough data."
            />
          )}

          {!isLoadingAnalysis && !analysisError && selectedAnalysisData && (
            <Flex direction="column" gap="3">
              <Tabs.Root defaultValue="visualization">
                <Tabs.List>
                  <Tabs.Trigger value="visualization">Visualization</Tabs.Trigger>
                  <Tabs.Trigger value="raw">
                    <Flex gap="2" align="center">
                      Raw Data <CodeIcon />
                    </Flex>
                  </Tabs.Trigger>
                </Tabs.List>
                <Box px="4">
                  <Tabs.Content value="visualization">
                    <Flex direction="column" gap="3" py="3">
                      {isFrequentistDesign(design_spec) &&
                        assign_summary &&
                        (selectedAnalysisData as FreqExperimentAnalysisResponse).metric_analyses.map(
                          (metric_analysis, index) => (
                            <ForestPlot
                              key={index}
                              analysis={metric_analysis}
                              designSpec={design_spec}
                              assignSummary={assign_summary}
                            />
                          ),
                        )}
                    </Flex>
                  </Tabs.Content>

                  <Tabs.Content value="raw">
                    <Flex direction="column" gap="3" py="3">
                      <CodeSnippetCard
                        title="Raw Data"
                        content={JSON.stringify(selectedAnalysisData, null, 2)}
                        height="200px"
                        tooltipContent="Copy raw data"
                        variant="ghost"
                      />
                    </Flex>
                  </Tabs.Content>
                </Box>
              </Tabs.Root>
            </Flex>
          )}
        </SectionCard>

        <Toast.Root
          open={openToast}
          onOpenChange={setOpenToast}
          duration={2000}
          style={{
            background: 'white',
            padding: '12px 16px',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Toast.Title style={{ margin: 0 }}>🚧 Nothing to do here yet... 🚧</Toast.Title>
        </Toast.Root>
      </Flex>
    </Flex>
  );
}
