import { DataType } from '@/api/methods.schemas';

export const isNumericDataType = (dataType: DataType) => {
  return [DataType.integer, DataType.double_precision, DataType.numeric, DataType.bigint].includes(dataType);
};
