'use client';
import { Badge, Button, Card, Flex, Grid, Heading, Separator, Table, Tabs, Text } from '@radix-ui/themes';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, CodeIcon, PersonIcon } from '@radix-ui/react-icons';
import { useAnalyzeExperiment, useGetExperiment } from '@/api/admin';
import { ForestPlot } from '@/components/features/experiments/forest-plot';
import { XSpinner } from '@/components/ui/x-spinner';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { ExperimentStatusBadge } from '@/components/features/experiments/experiment-status-badge';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import { useState } from 'react';
import * as Toast from '@radix-ui/react-toast';
import { CodeSnippetCard } from '@/components/ui/cards/code-snippet-card';
import { ExperimentTypeBadge } from '@/components/features/experiments/experiment-type-badge';
import Link from 'next/link';

export default function ExperimentViewPage() {
  const [openToast, setOpenToast] = useState(false);
  const params = useParams();
  const router = useRouter();
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

  const { design_spec, state, assign_summary } = experiment;
  const { experiment_name, description, start_date, end_date, arms } = design_spec;

  return (
    <Flex direction="column" gap="4">
      <Flex align="center" gap="2" justify="between">
        <Flex align="center" gap="2">
          <Button variant="soft" onClick={() => router.back()}>
            <ArrowLeftIcon /> Back
          </Button>
          <Flex gap="2" align="center">
            <Heading>{experiment_name}</Heading>
            <CopyToClipBoard content={experimentId} tooltipContent="Copy experiment ID" />
            <ExperimentStatusBadge status={state} />
          </Flex>
          <Flex direction={'column'}>
            <Text color={'gray'}>
              This <ExperimentTypeBadge type={design_spec.experiment_type} /> experiment is on{' '}
              <Link
                href={`/datasources/${experiment.datasource_id}/participants/${experiment.design_spec.participant_type}`}
              >
                {experiment.design_spec.participant_type}
              </Link>
              .
            </Text>
          </Flex>
        </Flex>
      </Flex>

      <Card>
        <Heading size="3">Hypothesis</Heading>
        <Separator my="3" size="4" />
        <Text color="gray" size="3" style={{ whiteSpace: 'pre-wrap' }}>
          {description}
        </Text>
      </Card>

      <Grid columns="2" gap="4">
        {/* Timeline Section */}
        <Card>
          <Heading size="3">Timeline</Heading>
          <Separator my="3" size="4" />
          <Table.Root>
            <Table.Body>
              <Table.Row>
                <Table.RowHeaderCell>Start Date</Table.RowHeaderCell>
                <Table.Cell>{new Date(start_date).toLocaleDateString()}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.RowHeaderCell>End Date</Table.RowHeaderCell>
                <Table.Cell>{new Date(end_date).toLocaleDateString()}</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>
        </Card>

        {/* Parameters Section */}
        <Card>
          <Heading size="3">Parameters</Heading>
          <Separator my="3" size="4" />
          <Table.Root>
            <Table.Body>
              <Table.Row>
                <Table.RowHeaderCell>Sample Size</Table.RowHeaderCell>
                <Table.Cell>{assign_summary.sample_size.toLocaleString()}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.RowHeaderCell>Confidence Level</Table.RowHeaderCell>
                <Table.Cell>{(1 - (design_spec.alpha || 0.05)) * 100}%</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.RowHeaderCell>Power</Table.RowHeaderCell>
                <Table.Cell>{design_spec.power ? `${design_spec.power * 100}%` : '?'}</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>
        </Card>
      </Grid>

      {/* Arms & Balance Section */}
      <Card>
        <Heading size="3">Arms & Balance</Heading>
        <Separator my="3" size="4" />
        <Flex gap="4">
          {arms.map((arm) => {
            const armSize = assign_summary.arm_sizes?.find((a) => a.arm.arm_id === arm.arm_id)?.size || 0;
            const percentage = (armSize / assign_summary.sample_size) * 100;
            return (
              <Card key={arm.arm_id} style={{ flex: 1 }}>
                <Flex direction="column" gap="2">
                  <Flex justify="between" align="center">
                    <Flex gap="2" align="center">
                      <Heading size="4">{arm.arm_name}</Heading>
                      <CopyToClipBoard content={arm.arm_id || ''} tooltipContent="Copy arm ID" />
                    </Flex>
                    <Text color="gray" weight="bold">
                      {percentage.toFixed(1)}%
                    </Text>
                  </Flex>
                  <Flex gap="2" align="center" justify="end">
                    <Badge>
                      <PersonIcon />
                      <Text size="2">{armSize.toLocaleString()} participants</Text>
                    </Badge>
                  </Flex>
                  <Flex justify="between" align="center">
                    <Text color="gray" style={{ whiteSpace: 'pre-wrap' }}>
                      {arm.arm_description || 'No description'}
                    </Text>
                  </Flex>
                </Flex>
              </Card>
            );
          })}
        </Flex>
      </Card>

      {/* Analysis Section */}
      <Card>
        <Heading size="3">Analysis</Heading>
        <Separator my="3" size="4" />

        {isLoadingAnalysis && <XSpinner message="Loading analysis data..." />}

        {analysisError && (
          <GenericErrorCallout
            title="Error loading analysis"
            message="Analysis may not be available yet or the experiment hasn't collected enough data."
          />
        )}

        {analysisData && (
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
        )}
      </Card>

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
  );
}
