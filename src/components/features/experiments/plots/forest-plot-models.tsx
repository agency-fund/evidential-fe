import { ExperimentAnalysisResponse } from '@/api/methods.schemas';

export interface EffectSizeData {
  isBaseline: boolean;
  armId: string;
  armName: string;
  baselineEffect: number;
  effect: number;
  absEffect: number;
  ci95Lower: number;
  ci95Upper: number;
  ci95: number;
  absCI95Lower: number;
  absCI95Upper: number;
  pValue: number | null;
  invalidStatTest: boolean;
  significant: boolean;
}

export interface BanditEffectData {
  armId: string;
  armName: string;

  postPredMean: number;
  postPredStd: number;
  postPredci95Lower: number;
  postPredci95Upper: number;
  postPredci95: number;
  postPredabsCI95Lower: number;
  postPredabsCI95Upper: number;

  priorPredMean: number;
  priorPredStd: number;
  priorPredci95Lower: number;
  priorPredci95Upper: number;
  priorPredci95: number;
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
