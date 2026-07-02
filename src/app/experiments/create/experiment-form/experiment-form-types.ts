import {
  Arm,
  ContextType,
  CreateExperimentResponse,
  DataType,
  FieldMetadata,
  Filter,
  GetFiltersResponseElement,
  GetMetricsResponseElement,
  MABExperimentSpec,
  PowerResponse,
  PreassignedFrequentistExperimentSpecExperimentType,
} from '@/api/methods.schemas';
import { ErrorType } from '@/services/orval-fetch';
import { type ExperimentType, isMabExperimentType } from '@/services/experiment-utils';

export type ContextVariableType = ContextType;

// Context variable configuration for CMAB
export type Context = {
  name: string;
  description: string;
  type: ContextVariableType;
};
export type PriorType = MABExperimentSpec['prior_type'];
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
  // mab-select-datasource-screen options
  dwhMode?: 'none' | 'existing' | 'create';
  // mab-select-datasource-screen: the DWH column read as each participant's outcome. When set, a MAB
  // experiment is created as mab_online_dwh instead of mab_online. Left undefined for API-only MAB.
  targetFieldName?: string;
  // The target column's data type, captured at selection. Drives (and locks) the binary/real outcome
  // choice on the Outcomes step, so the two can't disagree.
  targetFieldType?: DataType;

  // experiment-freq-stack-screen
  primaryMetric?: MetricWithMDE;
  secondaryMetrics?: MetricWithMDE[];
  filters?: Filter[];
  // Cache of available filter fields (and their data types) for lookup/display/search
  availableFilterFields?: GetFiltersResponseElement[];
  strata?: FieldMetadata[];
  // These next 2 Experiment Parameters are strings to allow for empty values,
  // which should be converted to numbers when making power or experiment creation requests.
  confidence?: string;
  power?: string;
  // Populated when user clicks "Power Check" on DesignForm
  desiredN?: number;
  // Cluster count to sample for cluster-randomized preassigned experiments.
  desiredNClusters?: number;
  sampleSizeOption?: PowerCheckOption;
  powerCheckResponse?: PowerResponse;
  // Populated by the MDE estimate for the currently-active custom N (ENTER_OWN or USE_ALL_NON_NULL_SAMPLES).
  mdePowerCheckResponse?: PowerResponse;
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
  | 'mab-select-datasource'
  | 'bandit-binary-or-real'
  | 'describe-contexts'
  | 'describe-arms'
  | 'describe-bandit-arms'
  | 'freq-stack'
  | 'summarize-freq'
  | 'summarize-bandit';

export const isClusteredExperimentFormData = (data: ExperimentFormData): boolean =>
  data.experimentType === PreassignedFrequentistExperimentSpecExperimentType.freq_preassigned && !!data.clusterKey;

/** The resolved DWH-target binding for a wizard form. */
export type MabDwhTarget = {
  datasourceId: string;
  tableName: string;
  primaryKey: string;
  targetFieldName: string;
  targetFieldType: DataType;
};

// Single source of truth for the MAB DWH-target binding. Null unless it's a MAB with every field set,
// so stale fields from a since-changed type are ignored. undefined (not empty/0) means "not selected".
export function getMabDwhTarget(data: ExperimentFormData): MabDwhTarget | null {
  if (!isMabExperimentType(data.experimentType)) return null;
  const { datasourceId, tableName, primaryKey, targetFieldName, targetFieldType } = data;
  if (
    datasourceId === undefined ||
    tableName === undefined ||
    primaryKey === undefined ||
    targetFieldName === undefined ||
    targetFieldType === undefined
  ) {
    return null;
  }
  return { datasourceId, tableName, primaryKey, targetFieldName, targetFieldType };
}
