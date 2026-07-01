import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData, ExperimentScreenId } from '@/app/experiments/create/experiment-form/experiment-form-types';
import { PowerCheckOption } from '@/app/experiments/create/experiment-form/experiment-form-types';
import { Card, Flex, Heading } from '@radix-ui/themes';
import { MetricBuilder, MetricBuilderAction } from '@/components/features/experiments/metric-builder';
import { FilterBuilder } from '@/components/features/experiments/querybuilder/filter-builder';
import { StrataBuilder } from '@/components/features/experiments/strata-builder';
import { useCreateExperiment, useInspectTableInDatasource } from '@/api/admin';
import { CreateExperimentResponse, FieldMetadata, Filter } from '@/api/methods.schemas';
import { PowerCheckSection, PowerCheckSectionAction } from './power-check-section';
import { ClusterStatisticsSectionAction } from './cluster-statistics-section';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import {
  convertToFrequentistDesignSpec,
  removeFieldByName,
} from '@/app/experiments/create/experiment-form/experiment-form-helpers';
import { getPowerAnalysis } from '@/services/experiment-utils';
import { createExperimentBody } from '@/api/admin.zod';
import { ErrorType } from '@/services/orval-fetch';
import { GenericErrorCallout } from '@/components/ui/generic-error';

export type ExperimentFreqStackScreenMessage =
  | MetricBuilderAction
  | PowerCheckSectionAction
  | ClusterStatisticsSectionAction
  | { type: 'set-filters'; filters: Filter[] }
  | { type: 'set-strata'; strata: FieldMetadata[] }
  | { type: 'set-create-response'; response: CreateExperimentResponse }
  | { type: 'set-create-error'; response: ErrorType<unknown> };

const getPrimaryAnalysisAvailableN = (data: ExperimentFormData): number | undefined => {
  if (!data.powerCheckResponse || !data.primaryMetric) return undefined;
  const primaryAnalysis = getPowerAnalysis(data.powerCheckResponse, data.primaryMetric.metric.field_name);
  return primaryAnalysis?.metric_spec.available_n ?? undefined;
};

const getNextDisabledReasons = (data: ExperimentFormData): string[] => {
  const reasons: string[] = [];

  // Must have primary metric selected
  if (!data.primaryMetric) {
    reasons.push('Please select a primary metric.');
  }

  const isFreqPreassigned = data.experimentType === 'freq_preassigned';
  if (isFreqPreassigned) {
    // Must have valid confidence value (50-99)
    const confidence = Number(data.confidence);
    if (isNaN(confidence) || confidence < 50 || confidence > 99) {
      reasons.push('Enter a valid confidence value (50-99).');
    }

    // Must have valid power value (50-99) for pre-assigned frequentist experiment
    const power = Number(data.power);
    if (isNaN(power) || power < 50 || power > 99) {
      reasons.push('Enter a valid power value (50-99).');
    }

    // Must have run power check for pre-assigned frequentist experiment
    if (!data.powerCheckResponse) {
      reasons.push('Please perform a sample size estimation.');
    }

    // Batch the above checks into a single set of reasons if any are present.
    if (reasons.length > 0) {
      return reasons;
    }

    // desiredN must not exceed the primary metric's available samples
    const availableN = getPrimaryAnalysisAvailableN(data);
    const hasAvailableN = availableN !== undefined && availableN !== 0;
    if (!hasAvailableN) {
      reasons.push('The primary metric has no available samples per the latest power check results.');
    }

    if (data.desiredN !== undefined && hasAvailableN && data.desiredN > availableN) {
      reasons.push(
        `Desired N (${data.desiredN.toLocaleString()}) exceeds the primary metric's available samples (${availableN.toLocaleString()}).`,
      );
    }

    // Must have selected a valid sample size for pre-assigned frequentist experiments
    if (data.clusterKey && (data.desiredNClusters === undefined || data.desiredNClusters <= 1)) {
      reasons.push('Select a valid cluster sample size.');
    } else if (!data.clusterKey && (data.desiredN === undefined || data.desiredN <= 1)) {
      reasons.push('Select a valid sample size.');
    }

    // If in MDE mode, must have an MDE estimate
    if (
      (data.sampleSizeOption === PowerCheckOption.ENTER_OWN ||
        data.sampleSizeOption === PowerCheckOption.USE_ALL_NON_NULL_SAMPLES) &&
      !data.mdePowerCheckResponse
    ) {
      reasons.push('Please generate a valid MDE estimate first.');
    }
  }
  return reasons;
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

  const nextDisabledReasons = getNextDisabledReasons(data);
  const nextEnabled = nextDisabledReasons.length === 0;
  const nextTooltip = nextEnabled ? undefined : nextDisabledReasons.join('\n');

  const handleCreate = async () => {
    const designSpec = convertToFrequentistDesignSpec(data);
    const powerAnalyses =
      data.sampleSizeOption === PowerCheckOption.ENTER_OWN ||
      data.sampleSizeOption === PowerCheckOption.USE_ALL_NON_NULL_SAMPLES
        ? data.mdePowerCheckResponse
        : data.powerCheckResponse;

    const createExperimentRequest = createExperimentBody.strict().parse({
      design_spec: designSpec,
      power_analyses: powerAnalyses,
      webhooks: data.selectedWebhookIds && data.selectedWebhookIds.length > 0 ? data.selectedWebhookIds : [],
    });
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
            excludeKeys={[data.primaryKey, data.clusterKey].filter((key): key is string => key !== undefined)}
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

        {!data.clusterKey && (
          <>
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
          </>
        )}

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
        nextTooltipContent={nextTooltip}
      />
    </>
  );
};
