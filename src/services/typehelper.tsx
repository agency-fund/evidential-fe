import { HTTPValidationError } from '@/api/methods.schemas';

// Like keyof, but for the values of an object instead of the keys.
export type ValueOf<T> = T[keyof T];

// Type of the elements of an array
export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[]
  ? ElementType
  : never;

export function isHttpOk<T>(response?: {
  data: T | HTTPValidationError;
  status: number;
}): response is { data: T; status: number } {
  return response !== undefined && response.status === 200;
}
