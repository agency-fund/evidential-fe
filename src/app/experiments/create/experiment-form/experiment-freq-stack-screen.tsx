import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData } from '@/app/experiments/create/experiment-form/experiment-form-def';
import { Card, Flex, Heading } from '@radix-ui/themes';
import { WizardBreadcrumbs } from '@/services/wizard/wizard-breadcrumbs-context';
import { SelectPrimaryKey } from '@/app/experiments/create/experiment-form/select-primary-key';
import { MetricBuilder, MetricBuilderAction } from '@/components/features/experiments/metric-builder';
import { FilterBuilder } from '@/components/features/experiments/querybuilder/filter-builder';
import { StrataBuilder } from '@/components/features/experiments/strata-builder';
import { useInspectTableInDatasource } from '@/api/admin';
import { FilterInput, PowerResponseOutput } from '@/api/methods.schemas';
import { PowerCheckSection } from './power-check-section';

export type ExperimentFreqStackScreenMessage =
  | { type: 'set-primary-key'; value: string }
  | MetricBuilderAction
  | { type: 'set-filters'; filters: FilterInput[] }
  | { type: 'set-strata'; strata: string[] }
  | { type: 'set-confidence'; value: string }
  | { type: 'set-power'; value: string }
  | { type: 'set-power-check-response'; response: PowerResponseOutput; chosenN?: number }
  | { type: 'set-chosen-n'; value: number | undefined };

/** ExperimentFreqStackScreen allows users to define the primary key, metrics, filters, strata, confidence, power,
 * and run a power check on the selected values.
 *
 * The behavior of this file will ultimately be VERY similar to src/app/datasources/[datasourceId]/experiments/create/containers/frequent_ab/design-form.tsx
 * so please look to that for behavioral and component re-use guidance.
 */
export const ExperimentFreqStackScreen = ({
  data,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentFreqStackScreenMessage>) => {
  const { data: tableData } = useInspectTableInDatasource(data.datasourceId ?? '', data.tableName ?? '', {
    refresh: false,
  });

  const fields = tableData?.fields ?? [];

  // Filter numeric and boolean fields for metrics
  const metricFields = fields.filter((f) =>
    ['integer', 'bigint', 'double precision', 'numeric', 'boolean'].includes(f.data_type),
  );

  return (
    <Flex direction="column" gap="4">
      <WizardBreadcrumbs />

      <SelectPrimaryKey
        datasourceId={data.datasourceId ?? ''}
        tableName={data.tableName ?? ''}
        value={data.primaryKey}
        onChange={(v) => dispatch({ type: 'set-primary-key', value: v })}
      />

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
          filters={data.filters ?? []}
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

      <Heading as="h3" size="3">
        Power Analysis
      </Heading>
      <PowerCheckSection data={data} dispatch={dispatch} />
    </Flex>
  );
};
