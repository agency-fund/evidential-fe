import { useMemo } from 'react';
import { useChartHeight, useChartWidth, useOffset, useXAxisDomain, useYAxisDomain } from 'recharts';
import { CategoricalDomain, NumberDomain } from 'recharts/types/util/types';

export interface UseRehartScalesOptions {
  xAxisId?: string | number;
  yAxisId?: string | number;
}

/**
 * Hook for getting helper rechart functions and data about the chart and plot area for scaling data
 * values into plot area coordinates. Use scaleX/scaleY for numeric axes, and
 * scaleCategoricalX/scaleCategoricalY for categorical axes. You can optionally
 * specify the axis ID to use the correct domain.
 */
export function useRechartScales(options: UseRehartScalesOptions = {}) {
  // Offsets: distances from chart edges to the edges of the plot area, including margins, axes, legend, brush height.
  const offset = useOffset();
  // Width and height: size of the chart including the axes and legend.
  const chartWidth = useChartWidth();
  const chartHeight = useChartHeight();
  // Numeric domains: array of min and max
  // Categorical domains: array of categories, or indices if duplicates exist
  const xAxisDomain = useXAxisDomain(options.xAxisId);
  const yAxisDomain = useYAxisDomain(options.yAxisId);

  return useMemo(() => {
    const invalidChart = {
      scaleX: () => NaN,
      scaleY: () => NaN,
      scaleCategoricalX: () => NaN,
      scaleCategoricalY: () => NaN,
      isValid: false,
      plotWidth: 0,
      plotHeight: 0,
    };

    // Verify that all data from recharts is valid
    if (!offset || !chartWidth || !chartHeight || !xAxisDomain || !yAxisDomain) {
      return invalidChart;
    }

    const [plotLeft, plotRight] = [offset.left ?? 0, offset.right ?? 0];
    const [plotTop, plotBottom] = [offset.top ?? 0, offset.bottom ?? 0];
    const plotWidth = chartWidth - plotLeft - plotRight;
    const plotHeight = chartHeight - plotTop - plotBottom;

    if (plotWidth <= 0 || plotHeight <= 0) {
      return invalidChart;
    }

    // Helper for numeric domains
    const getNumericDomain = (domain: NumberDomain) => {
      const min = domain[0];
      const max = domain[domain.length - 1];
      return { min, max };
    };

    const scaleX = (x: number) => {
      const { min: xMin, max: xMax } = getNumericDomain(xAxisDomain as NumberDomain);
      if (typeof xMin !== 'number' || typeof xMax !== 'number') return NaN;
      // one point only so plot in the middle of the axis
      if (xMin === xMax) return plotLeft + plotWidth / 2;
      return plotLeft + ((x - xMin) / (xMax - xMin)) * plotWidth;
    };

    const scaleY = (y: number) => {
      const { min: yMin, max: yMax } = getNumericDomain(yAxisDomain as NumberDomain);
      if (typeof yMin !== 'number' || typeof yMax !== 'number') return NaN;
      // one point only so plot in the middle of the axis
      if (yMin === yMax) return plotTop + plotHeight / 2;
      // Invert Y for standard coordinate system (max at top of graph, which is min Y pixel)
      return plotTop + ((yMax - y) / (yMax - yMin)) * plotHeight;
    };

    const scaleCategoricalX = (value: string) => {
      const domain = xAxisDomain as CategoricalDomain;
      const index = domain.indexOf(value);
      if (index === -1) return NaN;
      // Determine the interval width for each category
      const bandSize = plotWidth / domain.length;
      // Calculate the position such that the value is placed in the middle of the appropriate band.
      // Recharts plots categorical X axes from Left (index 0) to Right by default.
      return plotLeft + index * bandSize + bandSize / 2;
    };

    const scaleCategoricalY = (value: string) => {
      const domain = yAxisDomain as CategoricalDomain;
      const index = domain.indexOf(value);
      if (index === -1) return NaN;
      const bandSize = plotHeight / domain.length;
      // Recharts plots categorical Y axes from Bottom (index 0) to Top by default.
      return plotTop + plotHeight - index * bandSize - bandSize / 2;
    };

    return {
      scaleX,
      scaleY,
      scaleCategoricalX,
      scaleCategoricalY,
      isValid: true,
      plotWidth,
      plotHeight,
      offset,
    };
  }, [offset, chartWidth, chartHeight, xAxisDomain, yAxisDomain]);
}
