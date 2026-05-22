import { useCreateExperiment, useInspectTableInDatasource, usePowerCheck } from '@/api/admin';
import { createExperimentBody } from '@/api/admin.zod';
import { CreateExperimentResponse, FieldMetadata, FilterInput, PowerResponseOutput } from '@/api/methods.schemas';
import { ExperimentFormData, ExperimentScreenId } from '@/app/experiments/create/experiment-form/experiment-form-def';
import {
  convertToFrequentistDesignSpec,
  removeFieldByName,
} from '@/app/experiments/create/experiment-form/experiment-form-helpers';
import { ClusterBuilder } from '@/components/features/experiments/cluster-builder';
import { MetricBuilder, MetricBuilderAction } from '@/components/features/experiments/metric-builder';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import { FilterBuilder } from '@/components/features/experiments/querybuilder/filter-builder';
import { StrataBuilder } from '@/components/features/experiments/strata-builder';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { ErrorType } from '@/services/orval-fetch';
import { ScreenProps } from '@/services/wizard/wizard-types';
import { Card, Flex, Heading } from '@radix-ui/themes';
import { useState } from 'react';
import { PowerCheckSection } from './power-check-section';

export type ExperimentFreqStackScreenMessage =
  | MetricBuilderAction
  | { type: 'set-filters'; filters: FilterInput[] }
  | { type: 'set-strata'; strata: FieldMetadata[] }
  | { type: 'set-randomization-type'; value: 'strata' | 'cluster' }
  | { type: 'set-cluster-field'; field?: FieldMetadata }
  | { type: 'set-cluster-icc'; value: string }
  | { type: 'set-cluster-cv'; value: string }
  | { type: 'set-cluster-avg-size'; value: string }
  | { type: 'set-confidence'; value: string }
  | { type: 'set-power'; value: string }
  | {
      type: 'set-power-check-response';
      response: PowerResponseOutput;
      desiredN?: number;
    }
  | {
      // MDE-mode response for the Max-available sample size. Fired
      // proactively after the initial Power Check completes so the
      // achievable-MDE annotation on the Max radio card is visible even
      // before the user clicks Max.
      type: 'set-achievable-max-response';
      response: PowerResponseOutput | undefined;
    }
  | {
      // MDE-mode response for the Custom sample-size value the user typed.
      // Fired (debounced) when the typed value changes; cached so the
      // Custom card's achievable-MDE line stays visible after the user
      // switches to another radio.
      type: 'set-achievable-custom-response';
      response: PowerResponseOutput;
      desiredN: number;
    }
  | { type: 'set-create-response'; response: CreateExperimentResponse }
  | { type: 'set-create-error'; response: ErrorType<unknown> }
  | { type: 'set-chosen-n'; value: number | undefined };

const isClusterFieldsComplete = (data: ExperimentFormData) => {
  if (!data.clusterField) return false;
  const icc = Number(data.clusterIcc);
  const cv = Number(data.clusterCv);
  const avg = Number(data.clusterAvgSize);
  if (data.clusterIcc === '' || data.clusterCv === '' || data.clusterAvgSize === '') {
    return false;
  }
  if (Number.isNaN(icc) || icc < 0 || icc > 1) return false;
  if (Number.isNaN(cv) || cv < 0) return false;
  if (Number.isNaN(avg) || avg < 1) return false;
  return true;
};

const isNextEnabled = (data: ExperimentFormData) => {
  const isFreqPreassigned =
    data.experimentType === 'freq_preassigned' || data.experimentType === 'freq_cluster_preassigned';
  const isCluster = data.experimentType === 'freq_cluster_preassigned';

  // Must have primary metric selected
  if (!data.primaryMetric) return false;
  // Cluster experiment type requires a cluster field + valid ICC/CV/avg cluster size.
  if (isCluster && !isClusterFieldsComplete(data)) {
    return false;
  }
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
    if (data.desiredN === undefined) return false;
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
  // desired_n used to be a query param on createExperiment but the BE moved it
  // onto design_spec (set by convertToFrequentistDesignSpec when data.desiredN
  // is defined). No query params are needed here anymore.
  const { trigger: triggerCreate, isMutating: triggerLoading } = useCreateExperiment(
    data.datasourceId!,
    {},
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

  // Auto-fill of cluster stats (issue #217). We call power_check with the
  // current design spec but with cluster ICC/CV/avg unset; the BE auto-
  // calculates them from the datasource (PR #163) and we copy the response
  // back into the form so the user sees the values and can override them.
  const { trigger: triggerPowerCheckForAutoFill } = usePowerCheck(data.datasourceId ?? '');
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [autoFillError, setAutoFillError] = useState<string | null>(null);
  const handleAutoFillCluster = async () => {
    if (!data.clusterField || !data.primaryMetric) return;
    setAutoFillLoading(true);
    setAutoFillError(null);
    try {
      const design_spec = convertToFrequentistDesignSpec({
        ...data,
        // Run the BE auto-calculation by leaving ICC/CV/avg unset.
        clusterIcc: '',
        clusterCv: '',
        clusterAvgSize: '',
      });
      const response = await triggerPowerCheckForAutoFill({ design_spec });
      const primary = response.analyses.find((a) => a.metric_spec.field_name === data.primaryMetric?.metric.field_name);
      // Cluster fields live on metric_spec (DesignSpecMetric). They're
      // typed loosely here because methods.schemas.ts hasn't been
      // regenerated to surface them on the output type — see comment in
      // experiment-form-helpers.tsx.
      const ms = primary?.metric_spec as
        | {
            icc?: number | null;
            cv?: number | null;
            avg_cluster_size?: number | null;
          }
        | undefined;
      if (ms?.icc != null) dispatch({ type: 'set-cluster-icc', value: String(ms.icc) });
      if (ms?.cv != null) dispatch({ type: 'set-cluster-cv', value: String(ms.cv) });
      if (ms?.avg_cluster_size != null)
        dispatch({
          type: 'set-cluster-avg-size',
          value: String(ms.avg_cluster_size),
        });
    } catch (err) {
      setAutoFillError(err instanceof Error ? err.message : 'Failed to calculate cluster stats from datasource.');
    } finally {
      setAutoFillLoading(false);
    }
  };

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

  // Cluster ID candidates: the same pool as strata (exclude primary key).
  const availableClusterFields = availableStrata;
  const isClusterPreassigned = data.experimentType === 'freq_cluster_preassigned';

  const nextEnabled = isNextEnabled(data);

  const handleCreate = async () => {
    const designSpec = convertToFrequentistDesignSpec(data);
    // Pick the achievable response that matches the user's chosen N. If they
    // picked Custom, use the cached custom response (only when its desired_n
    // still matches data.desiredN); if Max, the cached max response.
    // Otherwise fall back to the recommended (sample-size-mode) response.
    const achievableForChosenN =
      data.desiredN !== undefined && data.desiredN === data.achievableCustomDesiredN
        ? data.achievableCustomPowerCheckResponse
        : data.achievableMaxPowerCheckResponse;
    let powerAnalysesToSave = achievableForChosenN ?? data.powerCheckResponse;

    // The BE response's num_clusters_total / clusters_per_arm reflect the
    // MINIMUM required when sufficient_n is true — not the user's chosen N.
    // Patch them so the saved experiment header / arms section / power-balance
    // dialog display the cluster count that matches what the user committed to.
    if (
      achievableForChosenN &&
      data.desiredN !== undefined &&
      data.experimentType === 'freq_cluster_preassigned' &&
      data.clusterAvgSize !== undefined &&
      data.clusterAvgSize !== ''
    ) {
      const avg = Number(data.clusterAvgSize);
      const arms = data.arms ?? [];
      if (Number.isFinite(avg) && avg > 0 && arms.length > 0) {
        const totalClusters = Math.ceil(data.desiredN / avg);
        const perArm = Math.floor(totalClusters / arms.length);
        const remainder = totalClusters - perArm * arms.length;
        const clustersPerArm = arms.map((_, i) => perArm + (i < remainder ? 1 : 0));
        const nPerArm = clustersPerArm.map((c) => Math.round(c * avg));
        powerAnalysesToSave = {
          ...achievableForChosenN,
          analyses: achievableForChosenN.analyses.map((a, i) =>
            i === 0
              ? {
                  ...a,
                  num_clusters_total: totalClusters,
                  clusters_per_arm: clustersPerArm,
                  n_per_arm: nPerArm,
                }
              : a,
          ),
        };
      }
    }
    const createExperimentRequest = createExperimentBody.strict().parse({
      design_spec: designSpec,
      power_analyses: powerAnalysesToSave,
      webhooks: data.selectedWebhookIds && data.selectedWebhookIds.length > 0 ? data.selectedWebhookIds : [],
    });
    // Issue #217: the strict parse above strips cluster fields because
    // admin.zod.ts hasn't been regenerated to recognize them (orval
    // regeneration is currently broken locally). Re-attach the cluster
    // fields onto the parsed request so they reach the BE. Without this
    // the BE never persists cluster_column / icc / cv / avg_cluster_size
    // for the new "Cluster Preassigned A/B Testing" type.
    if (data.experimentType === 'freq_cluster_preassigned' && data.clusterField) {
      // biome-ignore lint/suspicious/noExplicitAny: orval-stripped fields, see comment above.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reqAny = createExperimentRequest as any;
      reqAny.design_spec.cluster_key = data.clusterField.field_name;
      const icc = data.clusterIcc !== undefined && data.clusterIcc !== '' ? Number(data.clusterIcc) : undefined;
      const cv = data.clusterCv !== undefined && data.clusterCv !== '' ? Number(data.clusterCv) : undefined;
      const avg =
        data.clusterAvgSize !== undefined && data.clusterAvgSize !== '' ? Number(data.clusterAvgSize) : undefined;
      if (
        icc !== undefined &&
        cv !== undefined &&
        avg !== undefined &&
        Number.isFinite(icc) &&
        Number.isFinite(cv) &&
        Number.isFinite(avg)
      ) {
        reqAny.design_spec.metrics = reqAny.design_spec.metrics.map((m: Record<string, unknown>) => ({
          ...m,
          icc,
          cv,
          avg_cluster_size: avg,
        }));
      }
    }
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

        {isClusterPreassigned ? (
          <>
            <Heading as="h3" size="3">
              Cluster
            </Heading>
            <Card>
              <ClusterBuilder
                availableFields={availableClusterFields}
                clusterField={data.clusterField}
                icc={data.clusterIcc ?? ''}
                cv={data.clusterCv ?? ''}
                avgClusterSize={data.clusterAvgSize ?? ''}
                onClusterFieldChange={(field) => dispatch({ type: 'set-cluster-field', field })}
                onIccChange={(value) => dispatch({ type: 'set-cluster-icc', value })}
                onCvChange={(value) => dispatch({ type: 'set-cluster-cv', value })}
                onAvgClusterSizeChange={(value) => dispatch({ type: 'set-cluster-avg-size', value })}
                onAutoFill={data.primaryMetric ? handleAutoFillCluster : undefined}
                autoFillLoading={autoFillLoading}
                autoFillError={autoFillError}
              />
            </Card>
          </>
        ) : (
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

        {(data.experimentType === 'freq_preassigned' || data.experimentType === 'freq_cluster_preassigned') && (
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
