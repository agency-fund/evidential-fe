import {
  Arm,
  BayesABExperimentSpecInputExperimentType,
  BayesABExperimentSpecOutput,
  CMABExperimentSpecInputExperimentType,
  CMABExperimentSpecOutput,
  ContextType,
  DesignSpecOutput,
  GetExperimentResponse,
  GetMetricsResponseElement,
  MABExperimentSpecInput,
  MABExperimentSpecInputExperimentType,
  MABExperimentSpecOutput,
  OnlineFrequentistExperimentSpecInputExperimentType,
  OnlineFrequentistExperimentSpecOutput,
  PreassignedFrequentistExperimentSpecInputExperimentType,
  PreassignedFrequentistExperimentSpecOutput,
} from '@/api/methods.schemas';

// export type ContextVariableType2 = ContextSpec['value_type'];
export type ContextVariableType = ContextType;

// Context variable configuration for CMAB
export type Context = {
  name: string;
  description: string;
  type: ContextVariableType;
};
export type PriorType = MABExperimentSpecInput['prior_type'];

// MAB-specific arm configuration with prior parameters
export type BanditArm = Omit<Arm, 'arm_id'> & {
  // For Beta distribution
  alpha_prior?: number;
  beta_prior?: number;
  // For Normal distribution
  mean_prior?: number;
  stddev_prior?: number;
};

export type Stratum = {
  fieldName: string;
};

export type MetricWithMDE = {
  metric: GetMetricsResponseElement;
  mde: string; // desired minimum detectable effect as a percentage of the metric's baseline value
};

// Define the type alias using imported types
export function isFreqExperimentType(type: string): boolean {
  return (
    type in PreassignedFrequentistExperimentSpecInputExperimentType ||
    type in OnlineFrequentistExperimentSpecInputExperimentType
  );
}

export function isBanditExperimentType(type: string): boolean {
  return (
    type in MABExperimentSpecInputExperimentType ||
    type in CMABExperimentSpecInputExperimentType ||
    type in BayesABExperimentSpecInputExperimentType
  );
}

export const isFrequentistSpec = (
  spec: DesignSpecOutput | undefined,
): spec is OnlineFrequentistExperimentSpecOutput | PreassignedFrequentistExperimentSpecOutput =>
  !!spec && isFreqExperimentType(spec.experiment_type);

export const isBanditSpec = (
  spec: DesignSpecOutput | undefined,
): spec is MABExperimentSpecOutput | CMABExperimentSpecOutput | BayesABExperimentSpecOutput =>
  !!spec && isBanditExperimentType(spec.experiment_type);

export const isCmabExperiment = (experiment: GetExperimentResponse | undefined): boolean =>
  !!experiment && experiment.design_spec.experiment_type === CMABExperimentSpecInputExperimentType.cmab_online;
