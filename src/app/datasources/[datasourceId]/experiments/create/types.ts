import { 
  Arm, 
  FilterInput, 
  PowerResponseOutput, 
  CreateExperimentResponse 
} from '@/api/methods.schemas';

export type ExperimentType = 'frequent_ab' | 'multi_armed_bandit' | 'bayesian_ab' | 'contextual_bandit';
export type AssignmentType = 'preassigned' | 'online';
export type PriorType = 'beta' | 'normal';
export type OutcomeType = 'binary' | 'real_valued';
export type ContextVariableType = 'binary' | 'real_valued';

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
  experimentType: 'frequent_ab';
  assignmentType: AssignmentType;
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
  experimentType: 'multi_armed_bandit';
  arms: MABArm[];
  priorType: PriorType;
  outcomeType: OutcomeType;
  experimentId?: string;
  createExperimentResponse?: CreateExperimentResponse;
};

export type BayesianABFormData = BaseExperimentFormData & {
  experimentType: 'bayesian_ab';
  arms: BayesianABArm[];
  priorType: 'normal'; // Always normal for Bayesian A/B
  outcomeType: OutcomeType;
  experimentId?: string;
  createExperimentResponse?: CreateExperimentResponse;
};

export type CMABFormData = BaseExperimentFormData & {
  experimentType: 'contextual_bandit';
  contextVariables: ContextVariable[]; // Configured in context step
  arms: BayesianABArm[]; // Use BayesianABArm (Normal only), not MABArm
  priorType: 'normal'; // Always normal, like Bayesian A/B
  outcomeType: OutcomeType;
  experimentId?: string;
  createExperimentResponse?: CreateExperimentResponse;
};

export type ExperimentFormData = FrequentABFormData | MABFormData | BayesianABFormData | CMABFormData;

export const EXPERIMENT_STEP_FLOWS = {
  frequent_ab: ['type', 'metadata', 'design', 'summary'],
  multi_armed_bandit: ['type', 'design', 'metadata', 'summary'],
  bayesian_ab: ['type', 'design', 'metadata', 'summary'],
  contextual_bandit: ['type', 'context', 'design', 'metadata', 'summary']
} as const;

export const EXPERIMENT_TYPE_LABELS = {
  frequent_ab: 'Traditional A/B Testing',
  multi_armed_bandit: 'Multi-Armed Bandit',
  bayesian_ab: 'Bayesian A/B Testing',
  contextual_bandit: 'Contextual Bandit'
} as const;