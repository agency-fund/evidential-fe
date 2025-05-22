'use client';
import { Badge, Card, Flex, Heading, Separator, Table, Tabs, Text, Tooltip } from '@radix-ui/themes';
import { useParams } from 'next/navigation';
import { CodeIcon, InfoCircledIcon, PersonIcon, CalendarIcon } from '@radix-ui/react-icons';
import { BackButton } from '@/components/ui/buttons/back-button';
import { useAnalyzeExperiment, useGetExperiment } from '@/api/admin';
import { ForestPlot } from '@/components/features/experiments/forest-plot';
import { XSpinner } from '@/components/ui/x-spinner';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import { useState } from 'react';
import * as Toast from '@radix-ui/react-toast';
import { CodeSnippetCard } from '@/components/ui/cards/code-snippet-card';
import { ExperimentTypeBadge } from '@/components/features/experiments/experiment-type-badge';
import Link from 'next/link';
import { ReadMoreText } from '@/components/ui/read-more-text';
import { SectionCard } from '@/components/ui/cards/section-card';

export default function ExperimentViewPage() {
  const [openToast, setOpenToast] = useState(false);
  const params = useParams();
  const experimentId = params.experimentId as string;
  const datasourceId = params.datasourceId as string;

  const {
    data: experiment,
    isLoading: isLoadingExperiment,
    error: experimentError,
  } = useGetExperiment(datasourceId || '', experimentId, {
    swr: { enabled: !!datasourceId },
  });

  const {
    data: analysisData,
    isLoading: isLoadingAnalysis,
    error: analysisError,
  } = useAnalyzeExperiment(
    datasourceId || '',
    experimentId,
    {},
    {
      swr: { enabled: !!datasourceId && !!experiment, shouldRetryOnError: false },
    },
  );

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
      <Flex align="start" direction="column" gap="5">
        <BackButton href="/" label="Back to Experiments" />
        <Separator my="3" size="4" />
        <Flex direction="row" gap="2" align="center">
          <Heading size="8">{experiment_name}</Heading>
          <CopyToClipBoard content={experimentId} tooltipContent="Copy experiment ID" />
        </Flex>
        <Flex gap="4" align="center">
          <Flex align="center" gap="1">
            <Text weight="bold">Type:</Text>
            <ExperimentTypeBadge type={design_spec.experiment_type} />
          </Flex>

          <Text color="gray">|</Text>

          <Flex align="center" gap="1">
            <Text weight="bold">Participants:</Text>
            <Link
              href={`/datasources/${experiment.datasource_id}/participants/${experiment.design_spec.participant_type}`}
            >
              {experiment.design_spec.participant_type}
            </Link>
          </Flex>

          <Text color="gray">|</Text>

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
        <SectionCard
          title="Arms & Allocations"
          headerRight={
            <Badge>
              <PersonIcon />
              <Text size="2">{assign_summary.sample_size.toLocaleString()} participants</Text>
            </Badge>
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

        {/* Analysis Section */}
        <SectionCard
          title="Analysis"
          headerRight={
            analysisData && (
              <Flex gap="3" align="center" justify="between">
                <Card>
                  <Flex gap="4" align="center">
                    <Heading size="2">Confidence:</Heading>
                    <Flex gap="2" align="center">
                      <Text>{(1 - (design_spec.alpha || 0.05)) * 100}%</Text>
                      <Tooltip content="Chance that our test correctly shows no significant difference, if there truly is none. (The probability of avoiding a false positive.)">
                        <InfoCircledIcon />
                      </Tooltip>
                    </Flex>
                  </Flex>
                </Card>
                <Card>
                  <Flex gap="4" align="center">
                    <Heading size="2">Power:</Heading>
                    <Flex gap="2" align="center">
                      <Text>{design_spec.power ? `${design_spec.power * 100}%` : '?'}</Text>
                      <Tooltip content="Chance of detecting a difference at least as large as the pre-specified minimum effect for the metric, if that difference truly exists. (The probability of avoiding a false negative.)">
                        <InfoCircledIcon />
                      </Tooltip>
                    </Flex>
                  </Flex>
                </Card>
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

          {!isLoadingAnalysis && !analysisError && analysisData && (
            <Flex direction="column" gap="3">
              <Tabs.Root defaultValue="visualization">
                <Tabs.List>
                  <Tabs.Trigger value="visualization">Visualization</Tabs.Trigger>
                  <Tabs.Trigger value="raw">
                    Raw Data <CodeIcon />
                  </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="visualization">
                  <Flex direction="column" gap="3" py="3">
                    {analysisData.metric_analyses.map((metric_analysis, index) => (
                      <ForestPlot key={index} analysis={metric_analysis} experiment={experiment} />
                    ))}
                  </Flex>
                </Tabs.Content>

                <Tabs.Content value="raw">
                  <Flex direction="column" gap="3" py="3">
                    <CodeSnippetCard
                      title="Raw Data"
                      content={JSON.stringify(analysisData, null, 2)}
                      height="200px"
                      tooltipContent="Copy raw data"
                    />
                  </Flex>
                </Tabs.Content>
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
