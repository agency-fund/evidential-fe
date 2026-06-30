'use client';
import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData, ExperimentScreenId } from '@/app/experiments/create/experiment-form/experiment-form-types';
import { Wizard } from '@/services/wizard/Wizard';
import { DatasourceForm, DatasourceFormData, DatasourceFormInputData } from '../datasource-form/datasource-form-def';
import { DataType } from '@/api/methods.schemas';
import { Callout, Card, Flex } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useMemo } from 'react';

export type ExperimentMabSelectDatasourceMessages =
  | {
      type: 'set-datasource';
      datasourceId: string;
      tableName: string;
      primaryKey?: string;
      targetFieldName?: string;
      targetFieldType?: DataType;
    }
  | { type: 'skip-dwh-target' };

/**
 * Optional MAB step for binding the bandit to a data-warehouse target column. Reuses the nested
 * DatasourceForm (datasource → table → primary key → target column); completing it emits the
 * mab_online_dwh spec. The "Skip" affordance leaves the experiment API-only (mab_online).
 */
export const ExperimentMabSelectDatasourceScreen = ({
  data,
  dispatch,
  navigateNext,
  navigatePrev,
}: ScreenProps<ExperimentFormData, ExperimentMabSelectDatasourceMessages, ExperimentScreenId>) => {
  const handleSubmit = (formData: DatasourceFormData) => {
    dispatch({
      type: 'set-datasource',
      datasourceId: formData.datasourceId!,
      tableName: formData.tableName!,
      primaryKey: formData.primaryKey,
      targetFieldName: formData.targetFieldName,
      targetFieldType: formData.targetFieldType,
    });
    navigateNext();
  };

  const handleSkip = () => {
    dispatch({ type: 'skip-dwh-target' });
    navigateNext();
  };

  const inputData: DatasourceFormInputData = useMemo(
    () => ({
      datasourceId: data.datasourceId,
      tableName: data.tableName,
      primaryKey: data.primaryKey,
      targetFieldName: data.targetFieldName,
      targetFieldType: data.targetFieldType,
      experimentType: data.experimentType,
    }),
    [
      data.datasourceId,
      data.experimentType,
      data.primaryKey,
      data.tableName,
      data.targetFieldName,
      data.targetFieldType,
    ],
  );

  return (
    <Flex direction="column" gap={'3'}>
      <Callout.Root>
        <Callout.Icon>
          <InfoCircledIcon />
        </Callout.Icon>
        <Callout.Text>
          Optionally bind this bandit to a data-warehouse target column. Select a datasource, table, unique ID, and the
          column whose value will be read as each participant&apos;s outcome. Skip this step to report outcomes through
          the API instead.
        </Callout.Text>
      </Callout.Root>

      <Card>
        <Wizard
          form={DatasourceForm}
          onSubmit={handleSubmit}
          onPrev={navigatePrev}
          inputData={inputData}
          onSkip={handleSkip}
          skipLabel="Skip (I do not want to connect a data warehouse)"
        />
      </Card>
    </Flex>
  );
};
