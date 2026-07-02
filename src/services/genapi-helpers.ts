import { DataType, DatasourceSummary } from '@/api/methods.schemas';

/** A datasource backed by a real warehouse, not the API-only "none" placeholder. */
export const isUsableDatasource = (ds: DatasourceSummary): boolean => ds.driver !== 'none';

export const isEligibleForUseAsMetric = (data_type: DataType): boolean => {
  const numericTypes: DataType[] = [
    DataType.bigint,
    DataType.boolean,
    DataType.double_precision,
    DataType.integer,
    DataType.numeric,
  ];

  return numericTypes.includes(data_type);
};
