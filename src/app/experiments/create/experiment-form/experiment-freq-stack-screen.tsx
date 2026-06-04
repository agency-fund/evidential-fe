import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData, ExperimentScreenId } from '@/app/experiments/create/experiment-form/experiment-form-def';
import { PowerCheckOption } from '@/app/experiments/create/experiment-form/experiment-form-types';
import { Card, Flex, Heading } from '@radix-ui/themes';
import { MetricBuilder, MetricBuilderAction } from '@/components/features/experiments/metric-builder';
import { FilterBuilder } from '@/components/features/experiments/querybuilder/filter-builder';
import { StrataBuilder } from '@/components/features/experiments/strata-builder';
import { useCreateExperiment, useInspectTableInDatasource } from '@/api/admin';
import { CreateExperimentResponse, FieldMetadata, FilterInput, PowerResponseOutput } from '@/api/methods.schemas';
import { PowerCheckSection } from './power-check-section';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import {
  convertToFrequentistDesignSpec,
  removeFieldByName,
} from '@/app/experiments/create/experiment-form/experiment-form-helpers';
import { createExperimentBody } from '@/api/admin.zod';
import { ErrorType } from '@/services/orval-fetch';
import { GenericErrorCallout } from '@/components/ui/generic-error';

export type ExperimentFreqStackScreenMessage =
  | MetricBuilderAction
  | { type: 'set-filters'; filters: FilterInput[] }
  | { type: 'set-strata'; strata: FieldMetadata[] }
  | { type: 'set-confidence'; value: string }
  | { type: 'set-power'; value: string }
  | { type: 'set-power-check-response'; response: PowerResponseOutput; desiredN?: number }
  | { type: 'set-create-response'; response: CreateExperimentResponse }
  | { type: 'set-create-error'; response: ErrorType<unknown> }
  | { type: 'set-chosen-n'; value: number | undefined }
  | { type: 'set-sample-size-option'; value: PowerCheckOption };

const isNextEnabled = (data: ExperimentFormData) => {
  const isFreqPreassigned = data.experimentType === 'freq_preassigned';

  // Must have primary metric selected
  if (!data.primaryMetric) return false;
  // Must have valid confidence value (50-99)
  if (isFreqPreassigned) {
    const confidence = Number(data.confidence);
    if (isNaN(confidence) || confidence < 50 || confidence > 99) return false;
    // Must have valid power value (50-99) for pre-assigned frequentist experiment
    const power = Number(data.power);
    if (isNaN(power) || power < 50 || power > 99) return false;
    // Must have run power check for pre-assigned frequentist experiment
    if (!data.powerCheckResponse) return false;
    // Must have selected a sample size for pre-assigned frequentist experiment
    if (data.desiredN === undefined || data.desiredN === 0) return false;
  }
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
  const { trigger: triggerCreate, isMutating: triggerLoading } = useCreateExperiment(data.datasourceId!, undefined, {
    swr: {
      onSuccess: async (response) => {
        dispatch({ type: 'set-create-response', response: response });
        navigateNext();
      },
      onError: async (response) => {
        dispatch({ type: 'set-create-error', response: response });
      },
    },
  });

  const allTableFields = tableData?.fields ?? [];

  // Filter numeric and boolean fields for metrics
  const metricFields = allTableFields.filter((f) =>
    ['integer', 'bigint', 'double precision', 'numeric', 'boolean'].includes(f.data_type),
  );
  // Exclude primary key from stratum options.
  const availableStrata = removeFieldByName(allTableFields, data.primaryKey).toSorted((a, b) =>
    a.field_name.localeCompare(b.field_name),
  );
  // Reconfirm that the selected strata are still valid options and filter out any undefined if not.
  const selectedStrata = (data.strata ?? [])
    .map((s) => availableStrata.find((f) => f.field_name === s.field_name))
    .filter((f): f is FieldMetadata => Boolean(f));

  const nextEnabled = isNextEnabled(data);

  const handleCreate = async () => {
    const designSpec = convertToFrequentistDesignSpec(data);
    const createExperimentRequest = createExperimentBody.strict().parse({
      design_spec: designSpec,
      power_analyses: data.powerCheckResponse,
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
            availableFields={allTableFields}
            initialFilters={data.filters ?? []}
            onChange={(filters) => dispatch({ type: 'set-filters', filters })}
          />
        </Card>

        <Heading as="h3" size="3">
          Strata
        </Heading>
        <Card>
          <StrataBuilder
            availableStrata={availableStrata}
            selectedStrata={selectedStrata}
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
