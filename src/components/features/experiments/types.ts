import type { ExperimentConfig } from '@/api/methods.schemas';

export type ExperimentStatus = 'current' | 'upcoming' | 'finished';

export type ExperimentImpact = 'high' | 'medium' | 'low' | 'unclear' | 'unknown';

export type ExperimentWithStatus = ExperimentConfig & {
  status: ExperimentStatus;
};
