import { DataType } from '@/api/methods.schemas';

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
