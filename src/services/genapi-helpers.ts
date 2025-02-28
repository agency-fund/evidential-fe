import { DataType } from '@/api/methods.schemas';

export const isNumericDataType = (data_type: DataType): boolean => {
  const numericTypes: DataType[] = [DataType.integer, DataType.double_precision, DataType.numeric, DataType.bigint];

  return numericTypes.includes(data_type);
};
