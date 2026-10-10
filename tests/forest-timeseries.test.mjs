import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dependencyRequire = createRequire(import.meta.url);
const moduleCache = new Map();

// Exercise the actual TSX modules without introducing a separate test compiler or framework.
function loadModule(relativePath) {
  if (moduleCache.has(relativePath)) return moduleCache.get(relativePath).exports;
  const source = readFileSync(path.join(root, relativePath), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const compiledModule = { exports: {} };
  moduleCache.set(relativePath, compiledModule);
  const localRequire = (specifier) => {
    if (specifier === 'react') {
      return { ...dependencyRequire('react'), useState: (initial) => [initial, () => {}] };
    }
    if (specifier === './use-chart-scales') {
      return { useRechartScales: () => ({ scaleX: (value) => value, scaleY: (value) => -value, isValid: true }) };
    }
    if (!specifier.startsWith('.') && !specifier.startsWith('@/')) return dependencyRequire(specifier);
    const base = specifier.startsWith('@/')
      ? 'src/' + specifier.slice(2)
      : path.posix.join(path.posix.dirname(relativePath), specifier);
    for (const extension of ['.ts', '.tsx']) {
      if (existsSync(path.join(root, base + extension))) return loadModule(base + extension);
    }
    throw new Error(`Cannot resolve ${specifier} from ${relativePath}`);
  };
  new Function('require', 'module', 'exports', compiled)(localRequire, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}

const plotDirectory = 'src/components/features/experiments/plots/';
const utils = loadModule(plotDirectory + 'forest-plot-utils.tsx');
const Timeline = loadModule(plotDirectory + 'forest-timeseries-plot.tsx').default;
const ConfidenceInterval = loadModule(plotDirectory + 'confidence-interval.tsx').ConfidenceInterval;
const { YAxis, Tooltip } = dependencyRequire('recharts');
const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/frequentist-mean-intervals.json', import.meta.url), 'utf8'),
);

function prepare(analysis, alpha = 0.05) {
  const state = {
    key: 'snapshot',
    data: analysis,
    updated_at: new Date(analysis.created_at),
    label: 'snapshot',
    effectSizesByMetric: utils.precomputeFreqEffectsByMetric(analysis, alpha),
  };
  return { state, ...utils.transformAnalysisForForestTimeseriesPlot([state], 'onboarded') };
}

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== 'object') return [];
  return [node, ...elements(node.props?.children)];
}

function textContent(node) {
  if (Array.isArray(node)) return node.map(textContent).join(' ');
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  return node && typeof node === 'object' ? textContent(node.props?.children) : '';
}

function renderTimeline(prepared, confidenceLevel = 0.95) {
  const tree = Timeline({
    data: prepared.timeseriesData,
    armMetadata: prepared.armMetadata,
    minDate: prepared.minDate,
    maxDate: prepared.maxDate,
    confidenceLevel,
  });
  const nodes = elements(tree);
  const tooltip = nodes
    .find((node) => node.type === Tooltip)
    .props.content({
      active: true,
      payload: [{ payload: { userPayload: prepared.timeseriesData[0] } }],
    });
  return { nodes, tooltipText: textContent(tooltip.type(tooltip.props)) };
}

test('uses the treatment mean interval, independently checked against the observation counts', () => {
  const totalN = Object.values(fixture.observations).reduce((sum, arm) => sum + arm.n, 0);
  const hc1Factor = totalN / (totalN - Object.keys(fixture.observations).length);
  for (const { analysis, alpha } of fixture.cases) {
    const { timeseriesData } = prepare(analysis, alpha);
    const point = timeseriesData[0];
    const z = alpha === 0.05 ? 1.959963984540054 : 1.6448536269514722;
    for (const arm of analysis.metric_analyses[0].arm_analyses.filter((item) => !item.is_baseline)) {
      const { n, successes } = fixture.observations[arm.arm_id];
      const mean = successes / n;
      const variance = (hc1Factor * mean * (1 - mean)) / n;
      const plotted = point.armEffects.get(arm.arm_id);
      assert(Math.abs(plotted.absMean - mean) < 1e-12);
      assert(Math.abs(plotted.lowerCI - (mean - z * Math.sqrt(variance))) < 1e-12);
      assert(Math.abs(plotted.upperCI - (mean + z * Math.sqrt(variance))) < 1e-12);
      assert.equal(plotted.lowerCI, arm.mean_ci_lower);
      assert.equal(plotted.upperCI, arm.mean_ci_upper);
    }
  }
});

test('does not change the difference chart intervals or significance decisions', () => {
  for (const { analysis, alpha } of fixture.cases) {
    const { state } = prepare(analysis, alpha);
    for (const arm of analysis.metric_analyses[0].arm_analyses) {
      const effect = state.effectSizesByMetric.get('onboarded').find((item) => item.armId === arm.arm_id);
      const difference = arm.is_baseline ? 0 : arm.estimate;
      assert.equal(effect.ci95Lower, difference - 1.96 * arm.std_error);
      assert.equal(effect.ci95Upper, difference + 1.96 * arm.std_error);
      assert.equal(effect.significant, !arm.is_baseline && arm.p_value < alpha);
    }
  }
});

test('uses the experiment confidence level in timeline tooltips', () => {
  for (const { analysis, alpha } of fixture.cases) {
    const { tooltipText } = renderTimeline(prepare(analysis, alpha), 1 - alpha);
    assert(tooltipText.includes(`${Math.round((1 - alpha) * 100)}% CI:`));
  }
});

test('keeps mean points, finite axes, and honest tooltips when mean intervals are missing', () => {
  for (const absentValue of [undefined, null]) {
    const analysis = structuredClone(fixture.cases[0].analysis);
    for (const arm of analysis.metric_analyses[0].arm_analyses) {
      arm.mean_ci_lower = absentValue;
      arm.mean_ci_upper = absentValue;
    }
    const prepared = prepare(analysis);
    const { nodes, tooltipText } = renderTimeline(prepared);
    const domain = nodes.find((node) => node.type === YAxis).props.domain;
    assert(domain.every(Number.isFinite));
    assert.match(tooltipText, /Confidence interval unavailable/);
    assert.doesNotMatch(tooltipText, /NaN/);
    for (const arm of prepared.armMetadata) {
      const mean = prepared.timeseriesData[0].armEffects.get(arm.id).absMean;
      assert(domain[0] < mean && domain[1] > mean);
      const interval = ConfidenceInterval({ chartData: prepared.timeseriesData, armId: arm.id, baseColor: 'blue' });
      assert.equal(elements(interval).filter((node) => node.type === 'line').length, 0);
    }
  }
});

test('renders genuinely zero-valued, zero-width intervals', () => {
  const analysis = structuredClone(fixture.cases[0].analysis);
  const arms = analysis.metric_analyses[0].arm_analyses;
  const baseline = arms.find((arm) => arm.is_baseline);
  const treatment = arms.find((arm) => !arm.is_baseline);
  treatment.estimate = -baseline.estimate;
  treatment.mean_ci_lower = 0;
  treatment.mean_ci_upper = 0;
  const prepared = prepare(analysis);
  const point = prepared.timeseriesData[0].armEffects.get(treatment.arm_id);
  assert.equal(point.absMean, 0);
  assert(utils.hasConfidenceInterval(point));
  const interval = ConfidenceInterval({
    chartData: prepared.timeseriesData,
    armId: treatment.arm_id,
    baseColor: 'blue',
  });
  const lines = elements(interval).filter((node) => node.type === 'line');
  assert.equal(lines.length, 1);
  assert(lines[0].props.y1 === 0);
  assert(lines[0].props.y2 === 0);
});

test('rejects partial, nonfinite, and reversed interval bounds', () => {
  for (const [lowerCI, upperCI] of [
    [NaN, 1],
    [0, NaN],
    [-Infinity, Infinity],
    [1, 0],
  ]) {
    assert.equal(utils.hasConfidenceInterval({ absMean: 0.5, lowerCI, upperCI }), false);
  }
});
