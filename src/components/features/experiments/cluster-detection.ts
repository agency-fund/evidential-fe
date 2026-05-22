/**
 * Cluster-experiment detection helpers.
 *
 * Background (issue #217): the BE on PR #163 accepts `cluster_key` and the
 * per-metric `icc`/`cv`/`avg_cluster_size` on create-experiment requests, but
 * the storage layer (`storage_format_converters.py`) does not persist
 * `cluster_key` onto `tables.Experiment`, nor does it persist the per-
 * metric cluster stats onto `experiment_fields`. Those fields ARE preserved
 * inside the stored `power_analyses` JSON blob, because the BE writes the
 * raw PowerResponse via `_set_power_response_json`.
 *
 * The practical consequence is that when the FE re-fetches a saved cluster
 * experiment, `design_spec.cluster_key` and `design_spec.metrics[i].icc`
 * are missing — but `power_analyses.analyses[0].num_clusters_total`,
 * `clusters_per_arm`, `design_effect`, and the per-metric cluster stats on
 * `metric_spec` are all present.
 *
 * This module centralises "is this a cluster experiment?" detection and
 * "what are the cluster stats?" extraction so every surface (badge, targeting
 * modal, arms & allocations, header, summary) reads from a single source of
 * truth. Once the BE properly persists cluster_key/icc/cv/avg, these
 * helpers fall back to the design_spec path naturally — nothing else needs
 * to change in the call sites.
 */

// Internal shape that lets us safely read the fields we care about. We accept
// `unknown` at the API boundary and cast here, so any DesignSpec / PowerResponse
// variant from methods.schemas.ts can be passed without TS griping about
// missing fields on bandit types.
type LooseDesignSpec = {
  cluster_key?: string | null;
  metrics?: Array<{
    icc?: number | null;
    cv?: number | null;
    avg_cluster_size?: number | null;
  } | null> | null;
};

type LoosePowerAnalyses = {
  analyses?: Array<{
    metric_spec?: {
      icc?: number | null;
      cv?: number | null;
      avg_cluster_size?: number | null;
    } | null;
    num_clusters_total?: number | null;
    clusters_per_arm?: number[] | null;
    design_effect?: number | null;
  } | null> | null;
};

/** Returns true if the experiment has any cluster signal on the design spec or stored power analyses. */
export function isClusterDesign(designSpec: unknown, powerAnalyses: unknown): boolean {
  const ds = (designSpec ?? undefined) as LooseDesignSpec | undefined;
  const pa = (powerAnalyses ?? undefined) as LoosePowerAnalyses | undefined;
  if (ds?.cluster_key) return true;
  const firstAnalysis = pa?.analyses?.[0];
  if (firstAnalysis?.num_clusters_total != null) return true;
  if (firstAnalysis?.metric_spec?.icc != null) return true;
  if (firstAnalysis?.design_effect != null) return true;
  const firstMetric = ds?.metrics?.[0];
  if (firstMetric?.icc != null) return true;
  return false;
}

/** Returns the cluster column field name from design spec or null when not persisted. */
export function getClusterColumn(designSpec: unknown): string | null {
  const ds = (designSpec ?? undefined) as LooseDesignSpec | undefined;
  return ds?.cluster_key ?? null;
}

/**
 * Reads the primary metric's cluster stats with fallback from power_analyses.
 * Returns null if no cluster stats are available anywhere.
 */
export function getPrimaryMetricClusterStats(
  designSpec: unknown,
  powerAnalyses: unknown,
): {
  icc: number | null;
  cv: number | null;
  avg_cluster_size: number | null;
} | null {
  const ds = (designSpec ?? undefined) as LooseDesignSpec | undefined;
  const pa = (powerAnalyses ?? undefined) as LoosePowerAnalyses | undefined;
  const firstMetric = ds?.metrics?.[0];
  const firstAnalysisMetric = pa?.analyses?.[0]?.metric_spec;
  const icc = firstMetric?.icc ?? firstAnalysisMetric?.icc ?? null;
  const cv = firstMetric?.cv ?? firstAnalysisMetric?.cv ?? null;
  const avg = firstMetric?.avg_cluster_size ?? firstAnalysisMetric?.avg_cluster_size ?? null;
  if (icc == null && cv == null && avg == null) return null;
  return { icc, cv, avg_cluster_size: avg };
}
