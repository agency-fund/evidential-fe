import { ExperimentAnalysisResponse } from '@/api/methods.schemas';

export interface EffectSizeData {
  isBaseline: boolean;
  armId: string;
  armName: string;
  baselineEffect: number;
  absDifference: number; // absolute difference from baseline effect, or 0 if it's the baseline itself
  absEffect: number;
  relEffectPct: number; // change as a % of the baseline
  ci95: number; // for symmetric ErrorBars
  ci95Lower: number;
  ci95Upper: number;
  absCI95Lower: number;
  absCI95Upper: number;
  pValue: number | null;
  significant: boolean; // whether this non-baseline arm's effect is statistically significant
  invalidStatTest: boolean;
  isMissingAllValues: boolean;
}

export interface BanditEffectData {
  armId: string;
  armName: string;

  postPredMean: number;
  postPredStd: number;
  postPredCI95Lower: number;
  postPredCI95Upper: number;
  postPredCI95: number;
  postPredabsCI95Lower: number;
  postPredabsCI95Upper: number;

  priorPredMean: number;
  priorPredStd: number;
  priorPredCI95Lower: number;
  priorPredCI95Upper: number;
  priorPredCI95: number;
  priorPredabsCI95Lower: number;
  priorPredabsCI95Upper: number;
}

export interface AnalysisState {
  key: string;
  data: ExperimentAnalysisResponse | undefined;
  updated_at: Date;
  label: string;
  effectSizesByMetric?: Map<string, EffectSizeData[]>;
  banditEffects?: BanditEffectData[];
}

/**
 * Significance enum for indicating effect direction relative to baseline
 */
export enum Significance {
  No = 'no',
  Positive = 'pos',
  Negative = 'neg',
}

/**
 * Unified data structure for timeseries visualization
 * Works for both frequentist and bandit experiments
 */
export interface ArmDataPoint {
  absMean: number;
  lowerCI: number;
  upperCI: number;
  significance: Significance;
}

export interface TimeSeriesDataPoint {
  date: string; // YYYY-MM-DD format
  dateTimestampMs: number; // Timestamp in milliseconds for numeric axis
  armEffects: Map<string, ArmDataPoint>; // armId => ArmDataPoint
  key: string; // Key to identify an analysis snapshot backing this data
}

export interface ArmMetadata {
  id: string;
  name: string;
  isBaseline: boolean;
}
