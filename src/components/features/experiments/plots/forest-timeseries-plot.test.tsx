import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { stubChartLayout } from './chart-test-utils';
import ForestTimeseriesPlot from './forest-timeseries-plot';
import { ArmMetadata, Significance, TimeSeriesDataPoint } from './forest-plot-utils';

stubChartLayout();
afterEach(cleanup);

const ARMS: ArmMetadata[] = [
  { id: 'control', name: 'Control', isBaseline: true },
  { id: 'treatment', name: 'Treatment', isBaseline: false },
];

function snapshot(date: string, key: string): TimeSeriesDataPoint {
  return {
    date,
    dateTimestampMs: Date.parse(`${date}T00:00:00Z`),
    key,
    armEffects: new Map([
      ['control', { absMean: 10, lowerCI: 9, upperCI: 11, significance: Significance.No }],
      ['treatment', { absMean: 11, lowerCI: 10, upperCI: 12, significance: Significance.No }],
    ]),
  };
}

describe('ForestTimeseriesPlot', () => {
  it('reports the snapshot of a clicked CI bar', async () => {
    const onPointClick = vi.fn();
    render(
      <ForestTimeseriesPlot
        data={[snapshot('2026-11-01', 'snap-1'), snapshot('2026-11-02', 'snap-2')]}
        armMetadata={ARMS}
        minDate={new Date('2026-11-01T00:00:00Z')}
        maxDate={new Date('2026-11-02T00:00:00Z')}
        onPointClick={onPointClick}
      />,
    );

    fireEvent.click(await screen.findByTestId('ci-treatment-snap-2'));

    expect(onPointClick).toHaveBeenCalledExactlyOnceWith('snap-2');
  });
});
