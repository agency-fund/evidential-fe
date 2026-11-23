import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { stubChartLayout } from './chart-test-utils';
import { ForestPlot } from './forest-plot';
import { BanditEffectData, EffectSizeData } from './forest-plot-utils';

stubChartLayout();
afterEach(cleanup);

function freqArm(armName: string, absDifference: number, ci95Lower: number, ci95Upper: number): EffectSizeData {
  const isBaseline = absDifference === 0;
  return {
    isBaseline,
    armId: armName,
    armName,
    baselineEffect: 10,
    absDifference,
    absEffect: 10 + absDifference,
    relEffectPct: absDifference * 10,
    stdError: 0.5,
    ci95: (ci95Upper - ci95Lower) / 2,
    ci95Lower,
    ci95Upper,
    meanCILower: 10 + ci95Lower,
    meanCIUpper: 10 + ci95Upper,
    pValue: isBaseline ? null : 0.01,
    significant: !isBaseline && (ci95Lower > 0 || ci95Upper < 0),
    invalidStatTest: false,
    isMissingAllValues: false,
  };
}

function banditArm(armName: string, mean: number, std: number): BanditEffectData {
  const ci = 1.96 * std;
  return {
    armId: armName,
    armName,
    postPredMean: mean,
    postPredStd: std,
    postPredCI95Lower: mean - ci,
    postPredCI95Upper: mean + ci,
    postPredCI95: ci,
    postPredabsCI95Lower: mean - ci,
    postPredabsCI95Upper: mean + ci,
    priorPredMean: 0.5,
    priorPredStd: 0.2,
    priorPredCI95Lower: 0.1,
    priorPredCI95Upper: 0.9,
    priorPredCI95: 0.4,
    priorPredabsCI95Lower: 0.1,
    priorPredabsCI95Upper: 0.9,
  };
}

const CONTROL = freqArm('Control', 0, -1, 1);
const TREATMENT_A = freqArm('Treatment A', 1.5, 0.4, 2.6);
const TREATMENT_B = freqArm('Treatment B', -1.2, -2.3, -0.1);

/** Asserts that the arm's CI bar is drawn at the same height as its point. */
function expectBarOnPoint(armName: string) {
  const pointY = Number(screen.getByTestId(`point-${armName}`).getAttribute('cy'));
  const bar = screen.getByTestId(`ci-${armName}`).querySelector('line');
  expect(Number.isFinite(pointY)).toBe(true);
  expect(Number(bar?.getAttribute('y1'))).toBe(pointY);
}

describe('ForestPlot', () => {
  it('draws a row, a point and a CI bar for every frequentist arm', async () => {
    render(<ForestPlot effectSizes={[CONTROL, TREATMENT_A, TREATMENT_B]} />);

    // Each arm's name heads its row in the stats table beside the plot.
    for (const arm of [CONTROL, TREATMENT_A, TREATMENT_B]) {
      await screen.findByTitle(arm.armName);
    }
    // The control arm is drawn as a diamond, without a CI bar of its own.
    screen.getByTestId('point-Control');
    expect(screen.queryByTestId('ci-Control')).toBeNull();
    expectBarOnPoint('Treatment A');
    expectBarOnPoint('Treatment B');
  });

  it('draws a row, a point and a CI bar for every bandit arm', async () => {
    const arms = [banditArm('Arm X', 0.3, 0.05), banditArm('Arm Y', 0.45, 0.08)];
    render(<ForestPlot banditEffects={arms} />);

    for (const arm of arms) {
      await screen.findByTitle(arm.armName);
      expectBarOnPoint(arm.armName);
    }
  });

  it("shows an arm's details when its CI bar is hovered", async () => {
    render(<ForestPlot effectSizes={[CONTROL, TREATMENT_A]} />);
    const bar = await screen.findByTestId('ci-Treatment A');
    // Treatment A's CI, which only the tooltip shows.
    expect(screen.queryByText('[0.40, 2.60]')).toBeNull();

    fireEvent.mouseEnter(bar);

    await screen.findByText('[0.40, 2.60]');
  });
});
