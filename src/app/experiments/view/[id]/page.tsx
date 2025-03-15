'use client';
import { Button, Card, Flex, Grid, Heading, Separator, Table, Tabs, Text, TextArea } from '@radix-ui/themes';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon, CodeIcon, DotsVerticalIcon } from '@radix-ui/react-icons';
import { useAnalyzeExperiment, useGetExperiment, useListDatasources } from '@/api/admin';
import { ForestPlot } from '@/app/experiments/forest-plot';
import { useEffect, useState } from 'react';
import { XSpinner } from '@/app/components/x-spinner';
import { GenericErrorCallout } from '@/app/components/generic-error';
import { ExperimentStatusBadge } from '@/app/experiments/experiment-status-badge';
import { ExperimentAnalysis, ExperimentConfig } from '@/api/methods.schemas';

// Helper function to create sample sizes from experiment and analysis data
// TODO(roboton): I think these should come from the API responses?
function calculateSampleSizes(experiment: ExperimentConfig, analysis: ExperimentAnalysis) {
  const { assign_summary, design_spec } = experiment;
  const totalSampleSize = assign_summary.sample_size;

  // Calculate approximate sample size per arm
  const armCount = design_spec.arms.length;
  const sampleSizePerArm = Math.floor(totalSampleSize / armCount);

  // Format as expected by ForestPlot
  const sampleSizes: Record<string, { conversions: number; total: number }> = {};

  // Get the baseline coefficient (intercept) from the first coefficient
  const baselineCoefficient = analysis.coefficients[0];

  analysis.arm_ids.forEach((armId, index) => {
    // Use the actual coefficients from the analysis to calculate conversion rates
    // For the control arm (usually index 0), use the baseline coefficient
    // For treatment arms, add the treatment effect to the baseline
    let effectiveRate;

    if (index === 0) {
      // Control arm - use baseline coefficient directly
      effectiveRate = baselineCoefficient;
    } else {
      // Treatment arm - add the treatment effect to the baseline
      // The coefficients array contains [baseline, treatment1_effect, treatment2_effect, ...]
      effectiveRate = baselineCoefficient + analysis.coefficients[index];
    }

    // Ensure the rate is positive (coefficients might be negative)
    effectiveRate = Math.max(0.001, effectiveRate);

    sampleSizes[armId] = {
      // For conversions, use the coefficient as a rate
      conversions: Math.round(sampleSizePerArm * effectiveRate),
      total: sampleSizePerArm,
    };
  });

  return sampleSizes;
}

export default function ExperimentViewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const experimentId = params.id as string;
  const datasourceId = searchParams.get('datasource_id');

  const [selectedDatasource, setSelectedDatasource] = useState<string | null>(datasourceId);
  const { data: datasources } = useListDatasources();

  // Set first datasource if none selected
  useEffect(() => {
    if (!selectedDatasource && datasources?.items.length) {
      setSelectedDatasource(datasources.items[0].id);
    }
  }, [datasources, selectedDatasource]);

  const {
    data: experiment,
    isLoading: isLoadingExperiment,
    error: experimentError,
  } = useGetExperiment(selectedDatasource || '', experimentId, {
    swr: { enabled: !!selectedDatasource },
  });

  const {
    data: analysisData,
    isLoading: isLoadingAnalysis,
    error: analysisError,
  } = useAnalyzeExperiment(selectedDatasource || '', experimentId, {
    swr: { enabled: !!selectedDatasource && !!experiment },
  });

  if (isLoadingExperiment) {
    return <XSpinner message="Loading experiment details..." />;
  }

  if (experimentError) {
    return <GenericErrorCallout title="Error loading experiment" error={experimentError} />;
  }

  if (!experiment) {
    return <Text>No experiment data found</Text>;
  }

  const { design_spec, state, assign_summary, power_analyses, audience_spec } = experiment;
  const { experiment_name, description, start_date, end_date, arms } = design_spec;

  // Format dates for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Calculate arm percentages
  const totalArms = arms.length;
  const armPercentage = 100 / totalArms;

  return (
    <Flex direction="column" gap="4">
      <Flex align="center" gap="2" justify="between">
        <Flex align="center" gap="2">
          <Button variant="soft" onClick={() => router.back()}>
            <ArrowLeftIcon /> Back
          </Button>
          <Heading>{experiment_name}</Heading>
          <ExperimentStatusBadge status={state} />
        </Flex>
        <Button variant="ghost">
          <DotsVerticalIcon />
        </Button>
      </Flex>

      <Text color="gray" size="3">
        {description}
      </Text>

      <Grid columns="2" gap="4">
        {/* Timeline Section */}
        <Card>
          <Heading size="3" color="purple">
            Timeline
          </Heading>
          <Separator my="3" size="4" />
          <Table.Root>
            <Table.Body>
              <Table.Row>
                <Table.RowHeaderCell>Start Date</Table.RowHeaderCell>
                <Table.Cell>{formatDate(start_date)}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.RowHeaderCell>End Date</Table.RowHeaderCell>
                <Table.Cell>{formatDate(end_date)}</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>
        </Card>

        {/* Parameters Section */}
        <Card>
          <Heading size="3" color="purple">
            Parameters
          </Heading>
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
                <Table.RowHeaderCell>MDE</Table.RowHeaderCell>
                <Table.Cell>
                  {/* TODO(roboton): verify */}
                  {design_spec.metrics[0]?.metric_pct_change
                    ? `${(design_spec.metrics[0].metric_pct_change * 100).toFixed(1)}%`
                    : '(unknown)'}
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>
        </Card>
      </Grid>

      {/* Arms & Balance Section */}
      <Card>
        <Heading size="3" color="purple">
          Arms & Balance
        </Heading>
        <Separator my="3" size="4" />
        <Flex gap="4">
          {arms.map((arm, index) => (
            <Card key={arm.arm_id} style={{ flex: 1 }}>
              <Flex direction="column" gap="2">
                <Flex justify="between" align="center">
                  <Heading size="4">{arm.arm_name}</Heading>
                  <Text color={index === 0 ? 'red' : 'green'} weight="bold">
                    {(armPercentage + (index === 1 ? 0.6 : -0.6)).toFixed(1)}%
                  </Text>
                </Flex>
                <Text color="gray">{arm.arm_description || 'No description'}</Text>
              </Flex>
            </Card>
          ))}
        </Flex>
      </Card>

      {/* Analysis Section */}
      <Card>
        <Heading size="3" color="purple">
          Analysis
        </Heading>
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
                <CodeIcon /> Raw Data
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="visualization">
              <Flex direction="column" gap="3" py="3">
                {analysisData.map((analysis, index) => {
                  // Calculate sample sizes from experiment data
                  const sampleSizes = experiment ? calculateSampleSizes(experiment, analysis) : undefined;

                  return (
                    <ForestPlot
                      key={index}
                      analysis={analysis}
                      armNames={Object.fromEntries(arms.map((arm) => [arm.arm_id!, arm.arm_name]))}
                      controlArmIndex={0} // Assuming first arm is control, make this configurable if needed
                      sampleSizes={sampleSizes}
                    />
                  );
                })}
              </Flex>
            </Tabs.Content>

            <Tabs.Content value="raw">
              <Flex direction="column" gap="3" py="3">
                <TextArea
                  readOnly
                  value={JSON.stringify(analysisData, null, 2)}
                  style={{
                    fontFamily: 'monospace',
                    height: '200px',
                    width: '100%',
                  }}
                />
              </Flex>
            </Tabs.Content>
          </Tabs.Root>
        )}
      </Card>
    </Flex>
  );
}
