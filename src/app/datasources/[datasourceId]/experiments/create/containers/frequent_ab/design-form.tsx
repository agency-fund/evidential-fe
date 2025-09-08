'use client';
import { Button, Callout, Flex, Spinner, Text, TextField } from '@radix-ui/themes';
import { FrequentABFormData } from '@/app/datasources/[datasourceId]/experiments/create/types';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useCreateExperiment, useInspectParticipantTypes } from '@/api/admin';
import { FilterInput, GetFiltersResponseElement, GetMetricsResponseElement } from '@/api/methods.schemas';
import { PowerCheckSection } from '@/components/features/experiments/power-check-section';
import { convertFormDataToCreateExperimentRequest } from '@/app/datasources/[datasourceId]/experiments/create/helpers';
import { FilterBuilder } from '@/components/features/experiments/querybuilder/filter-builder';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { PRODUCT_NAME } from '@/services/constants';
import { MetricBuilder } from '@/components/features/experiments/metric-builder';
import { SectionCard } from '@/components/ui/cards/section-card';
import { StrataBuilder } from '@/components/features/experiments/strata-builder';

interface DesignFormProps {
  formData: FrequentABFormData;
  onFormDataChange: (data: FrequentABFormData) => void;
  onNext: () => void;
  onBack: () => void;
}

export function DesignForm({ formData, onFormDataChange, onNext, onBack }: DesignFormProps) {
  const { data: participantTypesData, isLoading: loadingParticipantTypes } = useInspectParticipantTypes(
    formData.datasourceId || '',
    formData.participantType || '',
    undefined,
    {
      swr: {
        enabled: !!(formData.datasourceId && formData.participantType),
      },
    },
  );
  const {
    trigger: triggerCreateExperiment,
    isMutating,
    error: createExperimentError,
  } = useCreateExperiment(formData.datasourceId!, {
    chosen_n: formData.chosenN!,
  });

  // Extract metrics and filters from the API response
  const metricFields: GetMetricsResponseElement[] =
    participantTypesData !== undefined ? participantTypesData.metrics : [];

  const filterFields: GetFiltersResponseElement[] =
    participantTypesData !== undefined ? participantTypesData.filters : [];

  // 2. Get the available strata fields
  const strataFields = participantTypesData?.strata || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const request = convertFormDataToCreateExperimentRequest(formData);
      const response = await triggerCreateExperiment(request);
      onFormDataChange({
        ...formData,
        experimentId: response.experiment_id,
        createExperimentResponse: response,
      });
      onNext();
    } catch (error) {
      // TODO
      console.error('Failed to create experiment:', error);
      throw new Error('failed to create experiment');
    }
  };

  const supportsPowerCheck = formData.experimentType === 'freq_preassigned';
  const isNextButtonDisabled =
    !formData.primaryMetric?.metric.field_name ||
    !formData.primaryMetric?.mde ||
    (supportsPowerCheck && (formData.powerCheckResponse === undefined || isMutating));

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="4">
        <SectionCard title="Metrics">
          {loadingParticipantTypes ? (
            <Flex align="center" gap="2">
              <Spinner size="1" />
              <Text size="2">Loading metrics...</Text>
            </Flex>
          ) : (
            <MetricBuilder formData={formData} onFormDataChange={onFormDataChange} metricFields={metricFields} />
          )}
        </SectionCard>

        <SectionCard title="Filters">
          <Flex direction="column" gap="3">
            <FilterBuilder
              availableFields={filterFields}
              filters={formData.filters}
              onChange={(filters: FilterInput[]) => onFormDataChange({ ...formData, filters })}
            />
          </Flex>
        </SectionCard>

        {/* 3. Conditionally render the StrataBuilder */}
        {strataFields.length > 0 && (
          <SectionCard title="Strata">
            <StrataBuilder
              availableStrata={strataFields}
              selectedStrata={formData.strata.map((stratum) => stratum.fieldName) || []}
              onStrataChange={(newStrata) => {
                onFormDataChange({ ...formData, strata: [...newStrata.map((fieldName) => ({ fieldName }))] });
              }}
            />
          </SectionCard>
        )}

        <SectionCard title="Experiment Parameters">
          <Flex direction="row" gap="3">
            <Flex direction="column" gap="2">
              <Text as="label" size="2" weight="bold">
                Confidence (%)
              </Text>
              <TextField.Root
                type="number"
                value={formData.confidence}
                onChange={(e) => onFormDataChange({ ...formData, confidence: e.target.value })}
              />
            </Flex>

            <Flex direction="column" gap="2">
              <Text as="label" size="2" weight="bold">
                Power (%)
              </Text>
              <TextField.Root
                type="number"
                value={formData.power}
                onChange={(e) => onFormDataChange({ ...formData, power: e.target.value })}
              />
            </Flex>
          </Flex>
        </SectionCard>

        <SectionCard title="Power Check">
          {supportsPowerCheck ? (
            <PowerCheckSection formData={formData} onFormDataChange={onFormDataChange} />
          ) : (
            <Callout.Root>
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                ️ Power calculations are not required to set up an online experiment, but if desired should be computed
                outside {PRODUCT_NAME}.
              </Callout.Text>
            </Callout.Root>
          )}
        </SectionCard>

        {createExperimentError && (
          <GenericErrorCallout title="Failed to create experiment" error={createExperimentError} />
        )}

        <Flex gap="3" justify="end">
          <Button type="button" variant="soft" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" disabled={isNextButtonDisabled}>
            {isMutating && <Spinner size="1" />}
            Next
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}
