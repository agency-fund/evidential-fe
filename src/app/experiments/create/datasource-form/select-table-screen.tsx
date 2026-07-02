'use client';
import { ScreenProps } from '@/services/wizard/wizard-types';
import { DatasourceFormData, DatasourceScreenId } from './datasource-form-def';
import {
  DataType,
  MABExperimentSpecExperimentType,
  PreassignedFrequentistExperimentSpecExperimentType,
} from '@/api/methods.schemas';
import { SelectTableFields } from '@/app/experiments/create/experiment-form/select-table-fields';
import { useFeatureFlag } from '@/services/feature-flags/use-feature-flag';

type SelectTableMessages =
  | { type: 'set-table'; value: string }
  | { type: 'set-primary-key'; value: string | undefined }
  | { type: 'set-cluster-key'; value: string | undefined }
  | { type: 'set-target-field'; value: string | undefined; dataType: DataType | undefined };

export const SelectTableScreen = ({
  data,
  dispatch,
}: ScreenProps<DatasourceFormData, SelectTableMessages, DatasourceScreenId>) => {
  const ffClusterExperimentsEnabled = useFeatureFlag('cluster_experiments');
  const showClusterKeyField =
    ffClusterExperimentsEnabled &&
    data.experimentType === PreassignedFrequentistExperimentSpecExperimentType.freq_preassigned;
  const showTargetField = data.experimentType === MABExperimentSpecExperimentType.mab_online;

  return (
    <SelectTableFields
      key={data.datasourceId}
      datasourceId={data.datasourceId!}
      tableName={data.tableName}
      primaryKey={data.primaryKey}
      clusterKey={data.clusterKey}
      targetFieldName={data.targetFieldName}
      onTableChange={(tableName) => dispatch({ type: 'set-table', value: tableName })}
      onPrimaryKeyChange={(value) => dispatch({ type: 'set-primary-key', value })}
      showClusterKey={showClusterKeyField}
      onClusterKeyChange={(value) => dispatch({ type: 'set-cluster-key', value })}
      showTargetField={showTargetField}
      onTargetFieldChange={(value, dataType) => dispatch({ type: 'set-target-field', value, dataType })}
    />
  );
};
