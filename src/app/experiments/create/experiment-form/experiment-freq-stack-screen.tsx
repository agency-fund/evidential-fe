import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData, ExperimentScreenId } from '@/app/experiments/create/experiment-form/experiment-form-def';
import { Card, Flex, Heading } from '@radix-ui/themes';
import { MetricBuilder, MetricBuilderAction } from '@/components/features/experiments/metric-builder';
import { FilterBuilder } from '@/components/features/experiments/querybuilder/filter-builder';
import { StrataBuilder } from '@/components/features/experiments/strata-builder';
import { useCreateExperiment, useInspectTableInDatasource } from '@/api/admin';
import { CreateExperimentResponse, FilterInput, PowerResponseOutput } from '@/api/methods.schemas';
import { PowerCheckSection } from './power-check-section';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import { convertToDesignSpec } from '@/app/experiments/create/experiment-form/experiment-form-helpers';
import { createExperimentBody } from '@/api/admin.zod';
import { ErrorType } from '@/services/orval-fetch';
import { GenericErrorCallout } from '@/components/ui/generic-error';

export type ExperimentFreqStackScreenMessage =
  | MetricBuilderAction
  | { type: 'set-filters'; filters: FilterInput[] }
  | { type: 'set-strata'; strata: string[] }
  | { type: 'set-confidence'; value: string }
  | { type: 'set-power'; value: string }
  | { type: 'set-power-check-response'; response: PowerResponseOutput; desiredN?: number }
  | { type: 'set-create-response'; response: CreateExperimentResponse }
  | { type: 'set-create-error'; response: ErrorType<unknown> }
  | { type: 'set-chosen-n'; value: number | undefined };

const isNextEnabled = (data: ExperimentFormData) => {
  const isFreqPreassigned = data.experimentType === 'freq_preassigned';

  // Must have primary metric selected
  if (!data.primaryMetric) return false;
  // Must have valid confidence value (50-99)
  const confidence = Number(data.confidence);
  if (isFreqPreassigned && (isNaN(confidence) || confidence < 50 || confidence > 99)) return false;
  // Must have valid power value (50-99) for pre-assigned frequentist experiment
  const power = Number(data.power);
  if (isFreqPreassigned && (isNaN(power) || power < 50 || power > 99)) return false;
  // Must have run power check for pre-assigned frequentist experiment
  if (isFreqPreassigned && !data.powerCheckResponse) return false;
  // Must have selected a sample size for pre-assigned frequentist experiment
  if (isFreqPreassigned && data.desiredN === undefined) return false;
  return true;
};

/** ExperimentFreqStackScreen allows users to define the primary key, metrics, filters, strata, confidence, power,
 * and run a power check on the selected values.
 *
 * The behavior of this file will ultimately be VERY similar to src/app/datasources/[datasourceId]/experiments/create/containers/frequent_ab/design-form.tsx
 * so please look to that for behavioral and component re-use guidance.
 */
export const ExperimentFreqStackScreen = ({
  data,
  dispatch,
  navigatePrev,
  navigateNext,
}: ScreenProps<ExperimentFormData, ExperimentFreqStackScreenMessage, ExperimentScreenId>) => {
  const { data: tableData } = useInspectTableInDatasource(data.datasourceId ?? '', data.tableName ?? '', {
    refresh: false,
  });
  const { trigger: triggerCreate, isMutating: triggerLoading } = useCreateExperiment(
    data.datasourceId!,
    {
      desired_n: data.desiredN,
    },
    {
      swr: {
        onSuccess: async (response) => {
          dispatch({ type: 'set-create-response', response: response });
          navigateNext();
        },
        onError: async (response) => {
          dispatch({ type: 'set-create-error', response: response });
        },
      },
    },
  );

  const fields = tableData?.fields ?? [];

  // Filter numeric and boolean fields for metrics
  const metricFields = fields.filter((f) =>
    ['integer', 'bigint', 'double precision', 'numeric', 'boolean'].includes(f.data_type),
  );

  const nextEnabled = isNextEnabled(data);

  const handleCreate = async () => {
    const designSpec = convertToDesignSpec(data);
    const createExperimentRequest = createExperimentBody.strict().parse({
      design_spec: designSpec,
      power_analyses: data.powerCheckResponse,
      primary_key: data.primaryKey,
      table_name: data.tableName,
      webhooks: data.selectedWebhookIds && data.selectedWebhookIds.length > 0 ? data.selectedWebhookIds : [],
    });
    console.log('converted', createExperimentRequest);
    await triggerCreate(createExperimentRequest, { throwOnError: false });
  };

  return (
    <>
      <Flex direction="column" gap={'3'}>
        <Heading as="h3" size="3">
          Metrics
        </Heading>
        <Card>
          <MetricBuilder
            primaryMetric={data.primaryMetric}
            secondaryMetrics={data.secondaryMetrics ?? []}
            dispatch={dispatch}
            metricFields={metricFields}
          />
        </Card>

        <Heading as="h3" size="3">
          Filters
        </Heading>
        <Card>
          <FilterBuilder
            availableFields={fields}
            initialFilters={data.filters ?? []}
            onChange={(filters) => dispatch({ type: 'set-filters', filters })}
          />
        </Card>

        <Heading as="h3" size="3">
          Strata
        </Heading>
        <Card>
          <StrataBuilder
            availableStrata={fields}
            selectedStrata={data.strata?.map((s) => s.fieldName) ?? []}
            onStrataChange={(strata) => dispatch({ type: 'set-strata', strata })}
          />
        </Card>

        {data.experimentType == 'freq_preassigned' && (
          <Flex direction="column" gap={'3'}>
            <Heading as="h3" size="3">
              Power Analysis
            </Heading>
            <PowerCheckSection data={data} dispatch={dispatch} />
          </Flex>
        )}
      </Flex>

      {data.createExperimentError && (
        <GenericErrorCallout title={'Failed to create experiment'} error={data.createExperimentError} />
      )}
      <NavigationButtons
        onPrev={navigatePrev}
        onNext={handleCreate}
        nextDisabled={!nextEnabled}
        nextLoading={triggerLoading}
      />
    </>
  );
};
