import type { ExperimentConfig } from '@/api/methods.schemas';

export type ExperimentStatus = 'current' | 'upcoming' | 'finished';

export type ExperimentImpact = 'high' | 'medium' | 'low' | 'negative' | 'unclear';

export type ExperimentWithStatus = ExperimentConfig & {
  status: ExperimentStatus;
};
