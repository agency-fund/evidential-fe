import { DwhDataType } from '@/api/methods.schemas';

export const isEligibleForUseAsMetric = (data_type: DwhDataType): boolean => {
  const numericTypes: DwhDataType[] = [
    DwhDataType.bigint,
    DwhDataType.boolean,
    DwhDataType.double_precision,
    DwhDataType.integer,
    DwhDataType.numeric,
  ];

  return numericTypes.includes(data_type);
};
