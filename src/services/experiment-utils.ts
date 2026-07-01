import type { ExperimentStatus } from '@/components/features/experiments/types';
import {
  AnyFrequentistDesignSpecExperimentType,
  CMABExperimentSpec,
  CMABExperimentSpecExperimentType,
  DesignSpec,
  ExperimentConfig,
  GetExperimentResponse,
  MABDwhExperimentSpecExperimentType,
  MABExperimentSpec,
  MABExperimentSpecExperimentType,
  MetricPowerAnalysis,
  OnlineFrequentistExperimentSpec,
  OnlineFrequentistExperimentSpecExperimentType,
  PowerResponse,
  PreassignedFrequentistExperimentSpec,
  PreassignedFrequentistExperimentSpecExperimentType,
} from '@/api/methods.schemas';

export type ExperimentType = DesignSpec['experiment_type'];

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

export const getPowerAnalysis = (
  powerAnalyses: Pick<PowerResponse, 'analyses'> | null | undefined,
  metricName: string | undefined,
): MetricPowerAnalysis | undefined => {
  const analyses = powerAnalyses?.analyses;
  if (!analyses?.length || !metricName) return undefined;

  return analyses.find((analysis) => analysis.metric_spec.field_name === metricName);
};

export const isFreqExperimentType = (
  experimentType?: ExperimentType,
): experimentType is AnyFrequentistDesignSpecExperimentType =>
  experimentType === PreassignedFrequentistExperimentSpecExperimentType.freq_preassigned ||
  experimentType === OnlineFrequentistExperimentSpecExperimentType.freq_online;

export const isCmabExperimentType = (
  experimentType?: ExperimentType,
): experimentType is CMABExperimentSpecExperimentType =>
  experimentType === CMABExperimentSpecExperimentType.cmab_online;

// The plain MAB type selectable in the creation wizard (a DWH-target MAB is derived from this plus a
// target column, so it never appears as the wizard's experimentType — hence mab_online only here).
export const isMabExperimentType = (
  experimentType?: ExperimentType,
): experimentType is MABExperimentSpecExperimentType => experimentType === MABExperimentSpecExperimentType.mab_online;

export const isBanditExperimentType = (
  experimentType?: ExperimentType,
): experimentType is MABExperimentSpecExperimentType | CMABExperimentSpecExperimentType =>
  experimentType === MABExperimentSpecExperimentType.mab_online ||
  // A DWH-target MAB is a MAB for every read/display purpose (arms, priors, contexts).
  experimentType === MABDwhExperimentSpecExperimentType.mab_online_dwh ||
  experimentType === CMABExperimentSpecExperimentType.cmab_online;

export const isFrequentistSpec = (
  spec: DesignSpec | undefined,
): spec is OnlineFrequentistExperimentSpec | PreassignedFrequentistExperimentSpec =>
  !!spec && isFreqExperimentType(spec.experiment_type);

export const isFreqPreassignedSpec = (spec: DesignSpec | undefined): spec is PreassignedFrequentistExperimentSpec =>
  !!spec && spec.experiment_type === PreassignedFrequentistExperimentSpecExperimentType.freq_preassigned;

export const isClusteredPreassignedSpec = (
  spec: DesignSpec | undefined,
): spec is PreassignedFrequentistExperimentSpec => isFreqPreassignedSpec(spec) && !!spec.cluster_key;

export function isMabSpec(spec: DesignSpec | undefined): spec is MABExperimentSpec {
  return (
    !!spec &&
    (spec.experiment_type === MABExperimentSpecExperimentType.mab_online ||
      // A DWH-target MAB is structurally a MAB for display (same arms/priors/contexts).
      spec.experiment_type === MABDwhExperimentSpecExperimentType.mab_online_dwh)
  );
}

export function isCmabSpec(spec: DesignSpec | undefined): spec is CMABExperimentSpec {
  return !!spec && spec.experiment_type === CMABExperimentSpecExperimentType.cmab_online;
}

export const isBanditSpec = (spec: DesignSpec | undefined): spec is MABExperimentSpec | CMABExperimentSpec =>
  isMabSpec(spec) || isCmabSpec(spec);

export const isCmabExperiment = (experiment: GetExperimentResponse | ExperimentConfig | undefined): boolean =>
  !!experiment && isCmabSpec(experiment.design_spec);
