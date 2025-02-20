import { HTTPValidationError } from '@/api/methods.schemas';

export function isHttpOk<T>(response?: {
  data: T | HTTPValidationError;
  status: number;
}): response is { data: T; status: number } {
  return response !== undefined && response.status === 200;
}
