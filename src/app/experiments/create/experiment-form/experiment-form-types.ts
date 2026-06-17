import {
  AnyFrequentistDesignSpecInputExperimentType,
  Arm,
  CMABExperimentSpecInputExperimentType,
  CMABExperimentSpecOutput,
  ContextType,
  CreateExperimentResponse,
  DesignSpecInput,
  DesignSpecOutput,
  ExperimentConfig,
  FieldMetadata,
  FilterInput,
  GetExperimentResponse,
  GetFiltersResponseElement,
  GetMetricsResponseElement,
  MABExperimentSpecInput,
  MABExperimentSpecInputExperimentType,
  MABExperimentSpecOutput,
  OnlineFrequentistExperimentSpecInputExperimentType,
  OnlineFrequentistExperimentSpecOutput,
  PowerResponseOutput,
  PreassignedFrequentistExperimentSpecInputExperimentType,
  PreassignedFrequentistExperimentSpecOutput,
} from '@/api/methods.schemas';
import { ErrorType } from '@/services/orval-fetch';

// export type ContextVariableType2 = ContextSpec['value_type'];
export type ContextVariableType = ContextType;

// Context variable configuration for CMAB
export type Context = {
  name: string;
  description: string;
  type: ContextVariableType;
};
export type PriorType = MABExperimentSpecInput['prior_type'];
export type FormOutcomeType = 'binary' | 'real';
export type BanditExperimentType = 'mab_online' | 'cmab_online';

// Sample-size selection mode on the Power Analysis screen (power-check-section).
export enum PowerCheckOption {
  USE_POWER_CHECK = 'use_power_check',
  USE_ALL_NON_NULL_SAMPLES = 'use_all_non_null_samples',
  ENTER_OWN = 'enter_own',
  NONE = '',
}

// MAB-specific arm configuration with prior parameters
export type BanditArm = Omit<Arm, 'arm_id'> & {
  arm_weight?: number;
  // For Beta distribution
  alpha_prior?: number;
  beta_prior?: number;
  // For Normal distribution
  mean_prior?: number;
  stddev_prior?: number;
};

export type BanditParams =
  | {
      experimentType: 'mab_online';
      outcomeType: 'binary';
      priorType: 'beta';
      arms: BanditArm[];
      contexts?: never;
    }
  | {
      experimentType: 'mab_online';
      outcomeType: 'real';
      priorType: 'normal';
      arms: BanditArm[];
      contexts?: never;
    }
  | {
      experimentType: 'cmab_online';
      outcomeType: FormOutcomeType;
      priorType: 'normal';
      arms: BanditArm[];
      contexts: Context[];
    };

export type MetricWithMDE = {
  metric: GetMetricsResponseElement;
  mde: string; // desired minimum detectable effect as a percentage of the metric's baseline value
};

export type ExperimentType = DesignSpecInput['experiment_type'];

// Defines the entirety of the editable data collected via this wizard flow.
export type ExperimentFormData = {
  // experiment-metadata-screen
  name?: string;
  hypothesis?: string;
  designUrl?: string;
  startDate?: string;
  endDate?: string;

  // experiment-type-screen
  experimentType?: ExperimentType;

  // experiment-select-datasource-screen
  datasourceId?: string;
  tableName?: string;
  primaryKey?: string;
  clusterKey?: string;

  // experiment-freq-stack-screen
  primaryMetric?: MetricWithMDE;
  secondaryMetrics?: MetricWithMDE[];
  filters?: FilterInput[];
  // Cache of available filter fields (and their data types) for lookup/display/search
  availableFilterFields?: GetFiltersResponseElement[];
  strata?: FieldMetadata[];
  // These next 2 Experiment Parameters are strings to allow for empty values,
  // which should be converted to numbers when making power or experiment creation requests.
  confidence?: string;
  power?: string;
  // Populated when user clicks "Power Check" on DesignForm
  desiredN?: number;
  sampleSizeOption?: PowerCheckOption;
  powerCheckResponse?: PowerResponseOutput;
  // Populated by the MDE estimate for the currently-active custom N (ENTER_OWN or USE_ALL_NON_NULL_SAMPLES).
  mdePowerCheckResponse?: PowerResponseOutput;
  createExperimentResponse?: CreateExperimentResponse;
  createExperimentError?: ErrorType<unknown>;
  // Values needed for cluster-randomized experiments
  clusterAvgClusterSize?: number;
  clusterIcc?: number;
  clusterCv?: number;

  // experiment-describe-webhooks-screen
  selectedWebhookIds?: string[];

  // experiment-describe-arms-screen
  arms?: Omit<Arm, 'arm_id'>[];

  // bandit flow config
  bandit?: BanditParams;

  // experiment-summarize-freq-screen (populated after createExperiment API call)
  experimentId?: string;
  commitError?: ErrorType<unknown>;
};

// All known screen IDs for the experiment form wizard. Used with screen() to type-check ids
// returned by nextScreen and prevScreen.
export type ExperimentScreenId =
  | 'metadata'
  | 'experiment-type'
  | 'freq-select-datasource'
  | 'bandit-binary-or-real'
  | 'describe-contexts'
  | 'describe-arms'
  | 'describe-bandit-arms'
  | 'freq-stack'
  | 'summarize-freq'
  | 'summarize-bandit';

// Define the type alias using imported types
export const isFreqExperimentType = (
  experimentType?: ExperimentType,
): experimentType is AnyFrequentistDesignSpecInputExperimentType =>
  experimentType === PreassignedFrequentistExperimentSpecInputExperimentType.freq_preassigned ||
  experimentType === OnlineFrequentistExperimentSpecInputExperimentType.freq_online;

export const isClusteredExperiment = (data: ExperimentFormData): boolean =>
  data.experimentType === PreassignedFrequentistExperimentSpecInputExperimentType.freq_preassigned && !!data.clusterKey;

export const isCmabExperimentType = (
  experimentType?: ExperimentType,
): experimentType is CMABExperimentSpecInputExperimentType =>
  experimentType === CMABExperimentSpecInputExperimentType.cmab_online;

export const isBanditExperimentType = (experimentType?: ExperimentType): experimentType is BanditExperimentType =>
  experimentType === MABExperimentSpecInputExperimentType.mab_online ||
  experimentType === CMABExperimentSpecInputExperimentType.cmab_online;

export const isFrequentistSpec = (
  spec: DesignSpecOutput | undefined,
): spec is OnlineFrequentistExperimentSpecOutput | PreassignedFrequentistExperimentSpecOutput =>
  !!spec && isFreqExperimentType(spec.experiment_type);

export const isBanditSpec = (
  spec: DesignSpecOutput | undefined,
): spec is MABExperimentSpecOutput | CMABExperimentSpecOutput => !!spec && isBanditExperimentType(spec.experiment_type);

export function isCmabSpec(spec: DesignSpecOutput | undefined): spec is CMABExperimentSpecOutput {
  return !!spec && spec.experiment_type === CMABExperimentSpecInputExperimentType.cmab_online;
}

export const isCmabExperiment = (experiment: GetExperimentResponse | ExperimentConfig | undefined): boolean =>
  !!experiment && isCmabSpec(experiment.design_spec);
