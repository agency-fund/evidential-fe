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

export interface AnalysisState {
  key: string;
  data: ExperimentAnalysisResponse | undefined;
  updated_at: Date;
  label: string;
  effectSizesByMetric?: Map<string, EffectSizeData[]>;
}

/**
 * Data structures for timeseries visualization
 */
export interface ArmDataPoint {
  estimate: number; // if baseline, this is an absolute estimate
  absEstimate: number;
  upper: number;
  lower: number;
  significant: boolean;
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
