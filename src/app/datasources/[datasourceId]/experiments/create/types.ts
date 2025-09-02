import {
  Arm,
  FilterInput,
  PowerResponseOutput,
  CreateExperimentResponse,
  DesignSpecInput,
  PreassignedFrequentistExperimentSpecInputExperimentType,
  OnlineFrequentistExperimentSpecInputExperimentType,
  MABExperimentSpecInput,
  Context as ContextSpec,
  MABExperimentSpecInputExperimentType,
} from '@/api/methods.schemas';

export type ExperimentType = DesignSpecInput['experiment_type'];

// Define the type alias using imported types
export function isFreqExperimentType(type: string): boolean {
  return (
    type in PreassignedFrequentistExperimentSpecInputExperimentType ||
    type in OnlineFrequentistExperimentSpecInputExperimentType
  );
}

export type AssignmentType = 'preassigned' | 'online';
export type PriorType = MABExperimentSpecInput['prior_type'];
export type OutcomeType = MABExperimentSpecInput['reward_type'];
export type ContextVariableType = ContextSpec['value_type'];

export type Stratum = {
  fieldName: string;
};

export type MetricWithMDE = {
  metricName: string;
  mde: string; // desired minimum detectable effect as a percentage of the metric's baseline value
};

// Context variable configuration for CMAB
export type Context = {
  name: string;
  description: string;
  type: ContextVariableType;
};

// MAB-specific arm configuration with prior parameters
export type BanditArm = Omit<Arm, 'arm_id'> & {
  // For Beta distribution
  alpha_prior?: number;
  beta_prior?: number;
  // For Normal distribution
  mean_prior?: number;
  stddev_prior?: number;
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
  experimentType:
    | PreassignedFrequentistExperimentSpecInputExperimentType
    | OnlineFrequentistExperimentSpecInputExperimentType;
  arms: Omit<Arm, 'arm_id'>[];
  primaryMetric?: MetricWithMDE;
  secondaryMetrics: MetricWithMDE[];
  filters: FilterInput[];
  strata: Stratum[];
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
  experimentType: MABExperimentSpecInputExperimentType;
  arms: BanditArm[];
  priorType: PriorType;
  outcomeType: OutcomeType;
  experimentId?: string;
  createExperimentResponse?: CreateExperimentResponse;
  chosenN?: number;
};

export type CMABFormData = Omit<MABFormData, 'experimentType' | 'priorType'> & {
  experimentType: 'cmab_online';
  priorType: 'normal';
  contexts: Context[];
};

export type ExperimentFormData = FrequentABFormData | MABFormData | CMABFormData;

export const EXPERIMENT_STEP_FLOWS = {
  freq_online: ['type', 'metadata', 'design', 'summary'],
  freq_preassigned: ['type', 'metadata', 'design', 'summary'],
  mab_online: ['type', 'metadata', 'summary'],
  bayes_ab_online: ['type', 'design', 'metadata', 'summary'],
  cmab_online: ['type', 'metadata', 'summary'],
} as const;

export const STEP_TITLES: Record<string, string> = {
  type: 'Experiment Type',
  design: 'Experiment Design',
  metadata: 'Experiment Metadata',
  summary: 'Experiment Summary',
} as const;
