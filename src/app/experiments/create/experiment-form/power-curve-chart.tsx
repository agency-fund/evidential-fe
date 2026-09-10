'use client';

import { Box, Card, Flex, Text } from '@radix-ui/themes';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { MetricPowerAnalysis } from '@/api/methods.schemas';
import { COMMON_AXIS_STYLE } from '@/components/features/experiments/plots/forest-plot-utils';

const CURVE_COLOR = 'var(--blue-10)';
const REFERENCE_COLOR = 'var(--gray-8)';
const UNATTAINABLE_FILL = 'var(--gray-4)';

// The largest MDE worth plotting: beyond a 100% change, points carry no information.
const MAX_PLOTTED_MDE_PCT = 100;

interface CurvePoint {
  size: number;
  mdePct: number;
  selected?: boolean;
}

/**
 * Round tick values for a log-scaled size axis: a 1-3-10 ladder restricted to the plotted range,
 * so ticks read 1K, 3K, 10K, ... instead of offsets of the smallest sample size.
 */
function logAxisTicks(min: number, max: number): number[] {
  const ticks: number[] = [];
  for (let decade = 10 ** Math.floor(Math.log10(min)); decade <= max; decade *= 10) {
    for (const mult of [1, 3]) {
      const tick = decade * mult;
      if (tick >= min && tick <= max) {
        ticks.push(tick);
      }
    }
  }
  return ticks.length >= 2 ? ticks : [min, max];
}

/** Two-line label for the available-size reference line, centered on the line. */
function AvailableSizeLabel({ viewBox, sizeLabel }: { viewBox?: { x?: number; y?: number }; sizeLabel?: string }) {
  const x = viewBox?.x ?? 0;
  const y = (viewBox?.y ?? 0) + 14;
  return (
    <text x={x} y={y} textAnchor="middle" fill="var(--gray-11)" fontSize={12}>
      <tspan x={x}>Available</tspan>
      <tspan x={x} dy={14}>
        {sizeLabel}
      </tspan>
    </text>
  );
}

/**
 * Label for the target-MDE line, anchored at its intersection with the curve, on the side away
 * from the curve: above the line to the point's right when the curve dives below the line
 * (normal case), below the line to the point's left when the curve rises above it
 * (under-powered case). The chosen side always has room: the intersection hugs the opposite
 * edge of the chart in each case.
 */
function TargetMdeLabel({ viewBox, side }: { viewBox?: { x?: number; y?: number }; side?: 'left' | 'right' }) {
  const x = (viewBox?.x ?? 0) + (side === 'left' ? -8 : 8);
  const y = (viewBox?.y ?? 0) + (side === 'left' ? 16 : -8);
  return (
    <text x={x} y={y} textAnchor={side === 'left' ? 'end' : 'start'} fill="var(--gray-11)" fontSize={12}>
      Target MDE
    </text>
  );
}

/** Line dot renderer: the user's currently selected size is drawn larger, with a surface ring. */
function CurveDot({ cx, cy, payload }: { cx?: number; cy?: number; payload?: CurvePoint }) {
  if (cx == null || cy == null || payload == null) return <g key="curve-dot-empty" />;
  if (payload.selected) {
    return (
      <circle
        key={`curve-dot-${payload.size}`}
        cx={cx}
        cy={cy}
        r={6}
        fill={CURVE_COLOR}
        stroke="var(--color-panel-solid)"
        strokeWidth={2}
      />
    );
  }
  return <circle key={`curve-dot-${payload.size}`} cx={cx} cy={cy} r={3} fill={CURVE_COLOR} />;
}

interface PowerCurveChartProps {
  /** The primary metric's analysis from the curve response; its mde_curve drives the chart. */
  curveAnalysis: MetricPowerAnalysis;
  isClustered: boolean;
  /** Minimum required size in the chart's x unit (clusters when clustered), if known. */
  minSize?: number;
  /** Available population in the chart's x unit (clusters when clustered), if known. */
  availableSize?: number;
  /** The user's target MDE in percent, drawn as a horizontal reference. */
  targetMdePct?: number;
  /** The currently selected sample size in the chart's x unit, marked with a dot. */
  selectedSize?: number;
  /** The MDE in percent at the selected size, if an estimate exists. */
  selectedMdePct?: number;
}

interface CurveTooltipProps extends TooltipContentProps<ValueType, NameType> {
  sizeLabel: string;
}

function CurveTooltip({ active, payload, sizeLabel }: CurveTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload as CurvePoint | undefined;
  if (!point) return null;

  return (
    <Card size="1" variant="surface">
      <Flex direction="column" gap="1">
        <Text size="2" weight="bold">
          {point.size.toLocaleString()} {sizeLabel}
          {point.selected ? ' (selected)' : ''}
        </Text>
        <Text size="2">Detectable effect: {point.mdePct.toFixed(1)}%</Text>
      </Flex>
    </Card>
  );
}

/**
 * Plots the minimum detectable effect against sample size for the primary metric, so users can
 * see what precision their sample buys before choosing a target size. Vertical references mark
 * the minimum required and available sizes, a horizontal reference marks the user's target MDE,
 * and a dot tracks the currently selected size. The region beyond the available population is
 * shaded as unattainable.
 */
export function PowerCurveChart({
  curveAnalysis,
  isClustered,
  minSize,
  availableSize,
  targetMdePct,
  selectedSize,
  selectedMdePct,
}: PowerCurveChartProps) {
  const points: CurvePoint[] = (curveAnalysis.mde_curve ?? [])
    .map((p) => ({
      size: (isClustered ? p.desired_n_clusters : p.desired_n) ?? 0,
      // The test is two-sided, so the MDE is a magnitude; for binary metrics the server may
      // report the detectable change with a negative sign (the downward root).
      mdePct: p.pct_change != null ? Math.abs(p.pct_change) * 100 : Number.NaN,
    }))
    .filter((p) => p.size > 0 && Number.isFinite(p.mdePct) && p.mdePct <= MAX_PLOTTED_MDE_PCT);

  if (points.length < 2) {
    return null;
  }

  const sizeLabel = isClustered ? 'clusters' : 'participants';
  const compactSize = (value: number) => Intl.NumberFormat('en', { notation: 'compact' }).format(value);

  // The selected size lies on the same curve (it comes from the same calculation), so merge it
  // into the line's data: it renders as a larger dot and shares the one tooltip layer. When the
  // selected size coincides with a computed curve point, the curve's own MDE wins — the passed
  // estimate can disagree, e.g. the target MDE at a floor-clamped minimum. A custom size below
  // the required minimum may stretch the plot down to an MDE of twice the target; anything more
  // extreme stays off-chart (footnote below) so it cannot crush the axes.
  const selectedOnCurve = selectedSize !== undefined ? points.find((p) => p.size === selectedSize) : undefined;
  const effectiveSelectedMdePct = selectedOnCurve?.mdePct ?? selectedMdePct;
  const minSelectableSize = minSize !== undefined ? Math.min(points[0].size, Math.ceil(minSize / 4)) : points[0].size;
  const selectedPoint: CurvePoint | undefined =
    selectedSize !== undefined &&
    effectiveSelectedMdePct !== undefined &&
    effectiveSelectedMdePct <= MAX_PLOTTED_MDE_PCT &&
    selectedSize >= minSelectableSize &&
    selectedSize <= points[points.length - 1].size
      ? { size: selectedSize, mdePct: effectiveSelectedMdePct, selected: true }
      : undefined;
  const plottedPoints = selectedPoint
    ? [...points.filter((p) => p.size !== selectedPoint.size), selectedPoint].sort((a, b) => a.size - b.size)
    : points;
  // A selection with an estimate but no on-chart dot gets a footnote instead of a distorted axis.
  const selectionOffChart =
    selectedSize !== undefined && effectiveSelectedMdePct !== undefined && selectedPoint === undefined;
  const maxPlottedSize = points[points.length - 1].size;
  const showUnattainableRegion = availableSize !== undefined && maxPlottedSize > availableSize;
  // Shade the under-powered region left of the required minimum — but only when the minimum is
  // within the available population; otherwise it would overlap the unattainable region and
  // tile the whole chart gray.
  const showInsufficientRegion =
    minSize !== undefined && availableSize !== undefined && minSize < availableSize && minSize > plottedPoints[0].size;
  // Where the curve crosses the target MDE: at the minimum required size, when on-chart.
  const curveStartsAboveTarget = targetMdePct !== undefined && points[0].mdePct > targetMdePct;
  const targetIntersection =
    targetMdePct !== undefined && minSize !== undefined && minSize >= points[0].size && minSize <= maxPlottedSize
      ? { size: minSize, mdePct: targetMdePct }
      : undefined;
  // Label on the side with room: the crossing hugs one edge of the log axis, so anchor the
  // label toward the opposite one (above-right of a left-edge crossing, below-left of a
  // right-edge crossing).
  const targetLabelSide: 'left' | 'right' =
    targetIntersection !== undefined && targetIntersection.size > Math.sqrt(plottedPoints[0].size * maxPlottedSize)
      ? 'left'
      : 'right';

  return (
    <Flex direction="column" gap="1" width="100%">
      <Box width="100%" height="260px">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={plottedPoints} margin={{ top: 28, right: 30, bottom: 15, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-5)" />
            <XAxis
              dataKey="size"
              type="number"
              scale="log"
              domain={['dataMin', 'dataMax']}
              ticks={logAxisTicks(points[0].size, maxPlottedSize)}
              tickFormatter={compactSize}
              label={{ value: isClustered ? 'Clusters' : 'Participants', position: 'insideBottom', offset: -10 }}
              style={COMMON_AXIS_STYLE}
            />
            <YAxis
              tickFormatter={(value: number) => `${value}%`}
              label={{ value: 'MDE', angle: -90, position: 'insideLeft' }}
              style={COMMON_AXIS_STYLE}
              width={70}
            />
            <Tooltip content={(props) => <CurveTooltip {...props} sizeLabel={sizeLabel} />} />
            {showUnattainableRegion ? (
              <ReferenceArea x1={availableSize} x2={maxPlottedSize} fill={UNATTAINABLE_FILL} fillOpacity={0.35} />
            ) : null}
            {showInsufficientRegion ? (
              <ReferenceArea x1={plottedPoints[0].size} x2={minSize} fill={UNATTAINABLE_FILL} fillOpacity={0.35} />
            ) : null}
            {availableSize !== undefined ? (
              <ReferenceLine
                x={availableSize}
                stroke={REFERENCE_COLOR}
                strokeDasharray="4 4"
                label={<AvailableSizeLabel sizeLabel={sizeLabel} />}
              />
            ) : null}
            {targetMdePct !== undefined ? (
              <ReferenceLine
                y={targetMdePct}
                stroke={REFERENCE_COLOR}
                strokeDasharray="4 4"
                label={
                  targetIntersection === undefined
                    ? {
                        value: 'Target MDE',
                        position: curveStartsAboveTarget ? 'insideBottomLeft' : 'insideTopRight',
                        fill: 'var(--gray-11)',
                        fontSize: 12,
                      }
                    : undefined
                }
              />
            ) : null}
            {targetIntersection !== undefined ? (
              <ReferenceDot
                x={targetIntersection.size}
                y={targetIntersection.mdePct}
                r={0}
                label={<TargetMdeLabel side={targetLabelSide} />}
              />
            ) : null}
            <Line
              type="monotone"
              dataKey="mdePct"
              stroke={CURVE_COLOR}
              strokeWidth={2}
              dot={CurveDot}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
      {selectionOffChart ? (
        <Text size="1" color="gray" align="center">
          Your selected size of {selectedSize?.toLocaleString()} {sizeLabel} is outside the plotted range.
        </Text>
      ) : null}
    </Flex>
  );
}
