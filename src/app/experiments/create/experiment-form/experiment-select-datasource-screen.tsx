'use client';
import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData } from '@/app/experiments/create/experiment-form/experiment-form-def';
import { Wizard } from '@/services/wizard/Wizard';
import { DatasourceForm, DatasourceFormData, DatasourceFormInputData } from '../datasource-form/datasource-form-def';
import { WizardBreadcrumbs } from '@/services/wizard/wizard-breadcrumbs-context';
import { Card, Flex } from '@radix-ui/themes';
import { useMemo } from 'react';

type ExperimentSelectDatasourceMessages = {
  type: 'set-datasource';
  datasourceId: string;
  tableName: string;
};

export const ExperimentSelectDatasourceScreen = ({
  data,
  dispatch,
  navigateNext,
  navigatePrev,
}: ScreenProps<ExperimentFormData, ExperimentSelectDatasourceMessages>) => {
  const handleSubmit = (formData: DatasourceFormData) => {
    dispatch({
      type: 'set-datasource',
      datasourceId: formData.datasourceId!,
      tableName: formData.tableName!,
    });
    navigateNext();
  };

  const inputData: DatasourceFormInputData = useMemo(
    () => ({
      datasourceId: data.datasourceId,
      tableName: data.tableName,
    }),
    [data.datasourceId, data.tableName],
  );

  return (
    <Flex direction="column" gap="3">
      <WizardBreadcrumbs />
      <Card>
        <Wizard form={DatasourceForm} onSubmit={handleSubmit} onPrev={navigatePrev} inputData={inputData} />
      </Card>
    </Flex>
  );
};
