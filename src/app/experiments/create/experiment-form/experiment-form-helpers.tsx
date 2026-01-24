import { formatDateUtcYYYYMMDD } from '@/services/date-utils';

export const getReasonableStartDate = (): string => {
  const date = new Date();
  date.setDate(0);
  date.setMonth(date.getMonth() + 2);
  return formatDateUtcYYYYMMDD(date);
};

export const getReasonableEndDate = (): string => {
  const date = new Date();
  date.setDate(0);
  date.setMonth(date.getMonth() + 3);
  return formatDateUtcYYYYMMDD(date);
};
