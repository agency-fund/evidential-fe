'use client';
import {
  Badge,
  Box,
  Flex,
  Heading,
  Separator,
  Table,
  Tabs,
  Text,
  Tooltip,
  Select,
  IconButton,
  Link,
} from '@radix-ui/themes';
import { useParams } from 'next/navigation';
import { CalendarIcon, CodeIcon, InfoCircledIcon, PersonIcon, FileTextIcon } from '@radix-ui/react-icons';
import { useAnalyzeExperiment, useGetExperimentForUi, useListSnapshots, useUpdateExperiment } from '@/api/admin';
import { ForestPlot } from '@/components/features/experiments/forest-plot';
import { XSpinner } from '@/components/ui/x-spinner';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import { useState } from 'react';
import { CodeSnippetCard } from '@/components/ui/cards/code-snippet-card';
import { ExperimentTypeBadge } from '@/components/features/experiments/experiment-type-badge';
import { ParticipantTypeBadge } from '@/components/features/participants/participant-type-badge';
import { ReadMoreText } from '@/components/ui/read-more-text';
import { SectionCard } from '@/components/ui/cards/section-card';
import {
  DesignSpecOutput,
  FreqExperimentAnalysisResponse,
  ExperimentAnalysisResponse,
  OnlineFrequentistExperimentSpecOutput,
  PreassignedFrequentistExperimentSpecOutput,
  UpdateExperimentRequest,
} from '@/api/methods.schemas';
import { DownloadAssignmentsCsvButton } from '@/components/features/experiments/download-assignments-csv-button';
import { ArmsAndAllocationsTable } from '@/components/features/experiments/arms-and-allocations-table';
import { EditableTextField } from '@/components/ui/inputs/editable/editable-text-field';
import { EditableDateField } from '@/components/ui/inputs/editable/editable-date-field';
import { EditableTextAreaSection } from '@/components/ui/inputs/editable/editable-text-area-section';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { extractUtcHHMMLabel, formatUtcDownToMinuteLabel } from '@/services/date-utils';

// Type guard to assure TypeScript that a DesignSpec is one of two types.
function isFrequentistDesign(
  designSpec: DesignSpecOutput,
): designSpec is PreassignedFrequentistExperimentSpecOutput | OnlineFrequentistExperimentSpecOutput {
  return designSpec.experiment_type === 'freq_preassigned' || designSpec.experiment_type === 'freq_online';
}

export default function ExperimentViewPage() {
  const params = useParams();
  const orgCtx = useCurrentOrganization();
  const organizationId = orgCtx?.current.id || '';
  const datasourceId = (params.datasourceId as string) || '';
  const experimentId = (params.experimentId as string) || '';

  type AnalysisState = {
    key: string;
    data: ExperimentAnalysisResponse | undefined;
    label: string;
  };
  const [snapshotDropdownOptions, setSnapshotDropdownOptions] = useState<AnalysisState[]>([]);
  const [liveAnalysis, setLiveAnalysis] = useState<AnalysisState>({
    key: 'live',
    data: undefined,
    label: 'No live data yet',
  });
  // which analysis we're actually displaying (live or a snapshot)
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisState>(liveAnalysis);

  // Editing states for date fields (description now handled by EditableSectionCard)

  const {
    data: experiment,
    isLoading: isLoadingExperiment,
    error: experimentError,
  } = useGetExperimentForUi(datasourceId, experimentId, {
    swr: { enabled: !!datasourceId },
  });

  const { isLoading: isLoadingAnalysis, error: analysisError } = useAnalyzeExperiment(
    datasourceId,
    experimentId,
    undefined,
    {
      swr: {
        enabled: !!datasourceId && !!experiment,
        shouldRetryOnError: false,
        onSuccess: (data) => {
          const d = new Date();
          const analysis = {
            key: 'live',
            data: data as ExperimentAnalysisResponse,
            label: `LIVE as of ${extractUtcHHMMLabel(d)}`,
          };
          setLiveAnalysis(analysis);
          // Only update the display if we were previously viewing live data.
          if (selectedAnalysis.key === 'live') {
            setSelectedAnalysis(analysis);
          }
        },
      },
    },
  );

  const { error: snapshotsError } = useListSnapshots(
    organizationId,
    datasourceId,
    experimentId,
    { status: ['success'] },
    {
      swr: {
        enabled: !!organizationId && !!datasourceId && !!experimentId,
        shouldRetryOnError: false,
        onSuccess: (data) => {
          // Make human-readable labels for the dropdown, showing UTC down to the minute.
          // Use the snapshot ID as the key, looking up the analysisState by ID upon selection.
          const opts: AnalysisState[] = [];
          if (data?.items) {
            for (const s of data.items) {
              opts.push({
                key: s.id,
                data: s.data as ExperimentAnalysisResponse,
                label: formatUtcDownToMinuteLabel(new Date(s.updated_at)),
              });
            }
            setSnapshotDropdownOptions(opts);
          }
        },
      },
    },
  );

  // Shared update experiment hook for all field editing
  const {
    trigger: triggerUpdateExperiment,
    isMutating: isUpdatingExperiment,
    error: updateExperimentError,
  } = useUpdateExperiment(datasourceId, experimentId);

  // Single unified update handler
  const handleExperimentUpdate = async (
    fieldKey: keyof UpdateExperimentRequest,
    newValue: string,
    currentValue: string,
  ) => {
    // Only update if value has changed and is not empty
    if (newValue.trim() && newValue !== currentValue) {
      const payload = { [fieldKey]: newValue.trim() };
      await triggerUpdateExperiment(payload);
    }
  };


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
  const { experiment_name, description, start_date, end_date, arms, design_url } = design_spec;

  return (
    <Flex direction="column" gap="6">
      <Flex align="start" direction="column" gap="3">
        <Flex direction="row" gap="2" align="center">
          <EditableTextField
            initialValue={experiment_name}
            fieldKey="name"
            headingSize="8"
            textFieldSize="2"
            onUpdate={async (formData) => {
              const newName = formData.get('name') as string;
              await handleExperimentUpdate('name', newName, experiment_name);
            }}
            isUpdating={isUpdatingExperiment}
          />
          {/* <CopyToClipBoard content={experimentId} tooltipContent="Copy experiment ID" size="1" /> */}
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

            <EditableDateField
              initialValue={start_date}
              fieldKey="start_date"
              textFieldSize="1"
              displayValue={new Date(start_date).toLocaleDateString()}
              onUpdate={async (formData) => {
                const newDate = formData.get('start_date') as string;
                await handleExperimentUpdate('start_date', newDate, start_date);
              }}
              isUpdating={isUpdatingExperiment}
            />

            <Text>→</Text>

            <EditableDateField
              initialValue={end_date}
              fieldKey="end_date"
              textFieldSize="1"
              displayValue={new Date(end_date).toLocaleDateString()}
              onUpdate={async (formData) => {
                const newDate = formData.get('end_date') as string;
                await handleExperimentUpdate('end_date', newDate, end_date);
              }}
              isUpdating={isUpdatingExperiment}
            />
          </Flex>
          {design_url && (
            <>
              <Separator orientation="vertical" />
              <Tooltip content="View design document">
                <IconButton variant="soft" color="blue" size="2" asChild>
                  <Link href={design_url} target="_blank" rel="noopener noreferrer">
                    <FileTextIcon width="16" height="16" />
                  </Link>
                </IconButton>
              </Tooltip>
            </>
          )}
        </Flex>
      </Flex>
      <Flex direction="column" gap="4">
        {/* Hypothesis Section */}
        <EditableTextAreaSection
          title="Hypothesis"
          initialValue={description}
          fieldKey="description"
          onUpdate={async (formData) => {
            const newDescription = formData.get('description') as string;
            await handleExperimentUpdate('description', newDescription, description);
          }}
          isUpdating={isUpdatingExperiment}
        />

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
            <ArmsAndAllocationsTable
              arms={arms}
              assignSummary={assign_summary}
              datasourceId={datasourceId}
              experimentId={experimentId}
            />
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
                        <Text>{liveAnalysis.label}</Text>
                      ) : (
                        <Select.Root
                          size="1"
                          value={selectedAnalysis.key}
                          onValueChange={(key) => {
                            const analysis =
                              key === 'live' ? liveAnalysis : snapshotDropdownOptions.find((opt) => opt.key === key);
                            setSelectedAnalysis(analysis || liveAnalysis); // shouldn't ever need to fall back though
                          }}
                        >
                          <Select.Trigger style={{ height: 18 }} />
                          <Select.Content>
                            <Select.Group>
                              <Select.Item key="live" value="live">
                                {liveAnalysis.label}
                              </Select.Item>
                            </Select.Group>
                            <Select.Separator />
                            <Select.Group>
                              {snapshotDropdownOptions.map((opt) => (
                                <Select.Item key={opt.key} value={opt.key}>
                                  {opt.label}
                                </Select.Item>
                              ))}
                            </Select.Group>
                          </Select.Content>
                        </Select.Root>
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

          {snapshotsError && (
            <GenericErrorCallout
              title="Error loading historical analyses"
              message="Historical analyses may not be available yet."
            />
          )}

          {updateExperimentError && (
            <GenericErrorCallout title="Error updating experiment" error={updateExperimentError} />
          )}

          {selectedAnalysis.data && (
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
                        (selectedAnalysis.data as FreqExperimentAnalysisResponse).metric_analyses.map(
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
                        content={JSON.stringify(selectedAnalysis.data, null, 2)}
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
      </Flex>
    </Flex>
  );
}
