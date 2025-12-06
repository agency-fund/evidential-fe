import type { ExperimentStatus } from '@/components/features/experiments/types';

export const getExperimentStatus = (startDate: string, endDate: string): ExperimentStatus => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) {
    return 'upcoming';
  } else if (now > end) {
    return 'finished';
  } else {
    return 'current';
  }
};
