import {
  Arm,
  FilterInput,
  PowerResponseOutput,
  CreateExperimentResponse
} from '@/api/methods.schemas';

export type ExperimentType = 'freq_preassigned' | 'freq_online' | 'mab_online' | 'bayes_ab_online' | 'cmab_online';
export type FreqExperimentType = 'freq_preassigned' | 'freq_online'
export type AssignmentType = 'preassigned' | 'online'
export type PriorType = 'beta' | 'normal';
export type OutcomeType = 'binary' | 'real-valued';
export type ContextVariableType = 'binary' | 'real-valued';

export type MetricWithMDE = {
  metricName: string;
  mde: string; // desired minimum detectable effect as a percentage of the metric's baseline value
};

// Context variable configuration for CMAB
export type ContextVariable = {
  name: string;
  description: string;
  type: ContextVariableType;
};

// MAB-specific arm configuration with prior parameters
export type MABArm = Omit<Arm, 'arm_id'> & {
  // For Beta distribution
  alpha_prior?: number;
  beta_prior?: number;
  // For Normal distribution
  mean_prior?: number;
  stddev_prior?: number;
};

// Bayesian A/B arm configuration (only uses Normal distribution)
export type BayesianABArm = Omit<Arm, 'arm_id'> & {
  mean_prior: number;
  stddev_prior: number;
};

export type BaseExperimentFormData = {
  datasourceId?: string;
  participantType?: string;
  name: string;
  hypothesis: string;
  startDate: string;
  endDate: string;
  // Selected webhook IDs for notifications
  selectedWebhookIds: string[];
};

export type FrequentABFormData = BaseExperimentFormData & {
  experimentType: FreqExperimentType;
  arms: Omit<Arm, 'arm_id'>[];
  primaryMetric?: MetricWithMDE;
  secondaryMetrics: MetricWithMDE[];
  filters: FilterInput[];
  // These next 2 Experiment Parameters are strings to allow for empty values,
  // which should be converted to numbers when making power or experiment creation requests.
  confidence: string;
  power: string;
  // Populated when user clicks "Power Check" on DesignForm
  chosenN?: number;
  powerCheckResponse?: PowerResponseOutput;
  // Populated when assignments are created
  experimentId?: string;
  createExperimentResponse?: CreateExperimentResponse;
};

export type MABFormData = BaseExperimentFormData & {
  experimentType: 'mab_online';
  arms: MABArm[];
  priorType: PriorType;
  outcomeType: OutcomeType;
  experimentId?: string;
  createExperimentResponse?: CreateExperimentResponse;
  chosenN?: number;
};

export type ExperimentFormData = FrequentABFormData | MABFormData

export const EXPERIMENT_STEP_FLOWS = {
  freq_online: ['type', 'metadata', 'design', 'summary'],
  freq_preassigned: ['type', 'metadata', 'design', 'summary'],
  mab_online: ['type', 'design', 'metadata', 'summary'],
  bayes_ab_online: ['type', 'design', 'metadata', 'summary'],
  cmab_online: ['type', 'context', 'design', 'metadata', 'summary']
} as const;

export const EXPERIMENT_TYPE_LABELS = {
  freq_online: 'Traditional A/B Testing',
  freq_preassigned: 'Traditional A/B Testing',
  mab_online: 'Multi-Armed Bandit',
  bayes_ab_online: 'Bayesian A/B Testing',
  cmab_online: 'Contextual Bandit'
} as const;
