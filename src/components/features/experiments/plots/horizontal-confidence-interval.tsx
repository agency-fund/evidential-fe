import { useChartHeight, useChartWidth, useOffset, useXAxisDomain, useYAxisDomain } from 'recharts';
import { CONTROL_COLOR, EffectSizeData, NEGATIVE_COLOR, POSITIVE_COLOR } from './forest-plot-utils';

export interface HorizontalConfidenceIntervalProps {
  data: EffectSizeData;
  defaultColor?: string;
  positiveColor?: string;
  negativeColor?: string;
  strokeWidth?: number;
  capHeight?: number; // Height of the vertical cap lines
  opacity?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  yAxisId?: string | number;
  xAxisId?: string | number;
}

/**
 * Renders horizontal confidence intervals for forest plots.
 * Assumes the Y axis is categorical and the X axis is numeric.
 */
export function HorizontalConfidenceInterval({
  data,
  defaultColor = CONTROL_COLOR,
  positiveColor = POSITIVE_COLOR,
  negativeColor = NEGATIVE_COLOR,
  strokeWidth = 12,
  capHeight = 0,
  opacity = 1,
  onMouseEnter,
  onMouseLeave,
  yAxisId,
  xAxisId,
}: HorizontalConfidenceIntervalProps) {
  // Get information from recharts in order to scale plots appropriately:
  const offset = useOffset();
  const chartWidth = useChartWidth();
  const chartHeight = useChartHeight();
  const xAxisDomain = useXAxisDomain(xAxisId);
  const yAxisDomain = useYAxisDomain(yAxisId);

  if (!offset || !chartWidth || !chartHeight || !xAxisDomain || !yAxisDomain) {
    return null;
  }

  const xMin = xAxisDomain[0];
  const xMax = xAxisDomain[xAxisDomain.length - 1];

  const [plotLeft, plotRight] = [offset.left ?? 0, offset.right ?? 0];
  const [plotTop, plotBottom] = [offset.top ?? 0, offset.bottom ?? 0];
  const plotWidth = chartWidth - plotLeft - plotRight;
  const plotHeight = chartHeight - plotTop - plotBottom;

  if (plotWidth <= 0 || plotHeight <= 0) return null;

  // Scale function for numeric X axis
  const scaleX = (x: number) => {
    if (typeof xMin !== 'number' || typeof xMax !== 'number') return NaN;
    if (xMin === xMax) return plotLeft + plotWidth / 2;
    return plotLeft + ((x - xMin) / (xMax - xMin)) * plotWidth;
  };

  // Scale function for categorical Y axis
  // Assumes yAxisDomain contains the category strings
  const scaleCategoricalY = (armName: string) => {
    // Determine the interval width for each category
    const bandSize = plotHeight / yAxisDomain.length;
    // Find the index of the arm in the domain
    const index = (yAxisDomain as string[]).indexOf(armName);

    if (index === -1) return NaN;

    // Calculate Y position such that it is placed in the middle of the appropriate band.
    // Recharts plots categorical Y axes from bottom to top by default.
    return plotTop + plotHeight - index * bandSize - bandSize / 2;
  };

  const xLower = scaleX(data.ci95Lower);
  const xUpper = scaleX(data.ci95Upper);
  const y = scaleCategoricalY(data.armName);

  if (isNaN(xLower) || isNaN(xUpper) || isNaN(y)) return null;

  // Determine stroke color
  let strokeColor = defaultColor;
  if (data.significant && !data.isBaseline) {
    strokeColor = data.absDifference > 0 ? positiveColor : negativeColor;
  }

  return (
    <g onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {/* Horizontal line from lower to upper CI */}
      <line
        x1={xLower}
        y1={y}
        x2={xUpper}
        y2={y}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={opacity}
      />
      {/* Left cap */}
      {capHeight > 0 && (
        <line
          x1={xLower}
          y1={y - capHeight / 2}
          x2={xLower}
          y2={y + capHeight / 2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={opacity}
        />
      )}
      {/* Right cap */}
      {capHeight > 0 && (
        <line
          x1={xUpper}
          y1={y - capHeight / 2}
          x2={xUpper}
          y2={y + capHeight / 2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={opacity}
        />
      )}
    </g>
  );
}
