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

// Roughly the width of a curve label as a fraction of the plot width: labels anchored closer
// together than this can overlap.
const LABEL_WIDTH_AXIS_FRACTION = 0.12;

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

/** Where a label sits relative to its anchor point: which way the text runs, and above or below. */
interface LabelPlacement {
  anchor: 'start' | 'end';
  below: boolean;
}

/**
 * Text label next to an anchor point, offset diagonally so it clears the point: text running
 * right ('start') or left ('end') of the point, above or below it.
 */
function PointLabel({
  viewBox,
  placement,
  text,
  fill,
}: {
  viewBox?: { x?: number; y?: number };
  placement?: LabelPlacement;
  text?: string;
  fill?: string;
}) {
  const x = (viewBox?.x ?? 0) + (placement?.anchor === 'end' ? -8 : 8);
  const y = (viewBox?.y ?? 0) + (placement?.below ? 16 : -10);
  return (
    <text x={x} y={y} textAnchor={placement?.anchor ?? 'start'} fill={fill} fontSize={12}>
      {text}
    </text>
  );
}

/**
 * Line dot renderer: the user's currently selected size is drawn larger, with a surface ring.
 */
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
        </Text>
        <Text size="2">Detectable effect: {point.mdePct.toFixed(1)}%</Text>
      </Flex>
    </Card>
  );
}

/**
 * Plots the minimum detectable effect against sample size for the primary metric, so users can
 * see what precision their sample buys before choosing a target size. A vertical reference marks
 * the available size, a horizontal reference marks the user's target MDE, and a labeled dot tracks
 * the currently selected size. The region beyond the available population is shaded as
 * unattainable.
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
  // estimate can disagree, e.g. the target MDE at a floor-clamped minimum. A custom size left of
  // the curve may stretch the plot down to a quarter of its first point, i.e. an MDE of twice the
  // curve's highest (MDE scales with 1/sqrt(n)), which bounds the stretch of both axes in normal
  // and under-powered designs alike; anything more extreme stays off-chart (footnote below) so
  // it cannot crush the axes.
  const selectedOnCurve = selectedSize !== undefined ? points.find((p) => p.size === selectedSize) : undefined;
  const effectiveSelectedMdePct = selectedOnCurve?.mdePct ?? selectedMdePct;
  const minSelectableSize = Math.ceil(points[0].size / 4);
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
  // Where the curve crosses the target MDE: at the minimum required size, when on-chart.
  const curveStartsAboveTarget = targetMdePct !== undefined && points[0].mdePct > targetMdePct;
  const targetIntersection =
    targetMdePct !== undefined && minSize !== undefined && minSize >= points[0].size && minSize <= maxPlottedSize
      ? { size: minSize, mdePct: targetMdePct }
      : undefined;
  // Position of a size along the log axis, from 0 (left edge) to 1 (right edge).
  const axisFraction = (size: number) =>
    Math.log(size / plottedPoints[0].size) / Math.log(maxPlottedSize / plottedPoints[0].size);
  // The curve descends, so the space above-right of any point on it is free. Only when the text
  // would run past the right edge does it run leftward instead, where the flattened curve leaves
  // room above it. The same
  // placement serves the bottom-of-plot variant below: above-right of the leader line's foot.
  const selectionLabelPlacement: LabelPlacement = {
    anchor:
      selectedPoint !== undefined && axisFraction(selectedPoint.size) > 1 - LABEL_WIDTH_AXIS_FRACTION ? 'end' : 'start',
    below: false,
  };
  // The target line crosses the curve near one edge of the chart (left when the design is
  // adequately powered, right when under-powered), and its label marks the crossing, on the side
  // away from the curve: above-right of a left crossing, below-left of a right one. When the
  // crossing is off-chart, the label goes to the end of the line where the curve is not.
  const crossingOnLeft =
    targetIntersection !== undefined ? axisFraction(targetIntersection.size) <= 0.5 : !curveStartsAboveTarget;
  const targetLabel =
    targetIntersection !== undefined
      ? {
          ...targetIntersection,
          placement: crossingOnLeft
            ? ({ anchor: 'start', below: false } as const)
            : ({ anchor: 'end', below: true } as const),
        }
      : targetMdePct !== undefined
        ? {
            size: crossingOnLeft ? maxPlottedSize : plottedPoints[0].size,
            mdePct: targetMdePct,
            placement: { anchor: crossingOnLeft ? 'end' : 'start', below: true } as const,
          }
        : undefined;
  // A selection near a left crossing (by default the selection is the required minimum, i.e.
  // the crossing itself) would put its label on top of the target label. Its label then moves
  // to the bottom of the plot, joined to the dot by a leader line: the curve is high at the left
  // edge, so the bottom-left of the plot is always free.
  const selectionLabelAtBottom =
    selectedPoint !== undefined &&
    targetIntersection !== undefined &&
    crossingOnLeft &&
    Math.abs(axisFraction(selectedPoint.size) - axisFraction(targetIntersection.size)) < LABEL_WIDTH_AXIS_FRACTION;

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
            {availableSize !== undefined ? (
              <ReferenceLine
                x={availableSize}
                stroke={REFERENCE_COLOR}
                strokeDasharray="4 4"
                label={<AvailableSizeLabel sizeLabel={sizeLabel} />}
              />
            ) : null}
            {targetMdePct !== undefined ? (
              <ReferenceLine y={targetMdePct} stroke={REFERENCE_COLOR} strokeDasharray="4 4" />
            ) : null}
            {targetLabel !== undefined ? (
              <ReferenceDot
                x={targetLabel.size}
                y={targetLabel.mdePct}
                r={0}
                label={<PointLabel placement={targetLabel.placement} text="Target MDE" fill="var(--gray-11)" />}
              />
            ) : null}
            {selectedPoint !== undefined && selectionLabelAtBottom ? (
              <ReferenceLine
                segment={[
                  { x: selectedPoint.size, y: 0 },
                  { x: selectedPoint.size, y: selectedPoint.mdePct },
                ]}
                stroke={CURVE_COLOR}
                strokeDasharray="2 3"
              />
            ) : null}
            {selectedPoint !== undefined ? (
              <ReferenceDot
                x={selectedPoint.size}
                y={selectionLabelAtBottom ? 0 : selectedPoint.mdePct}
                r={0}
                label={<PointLabel placement={selectionLabelPlacement} text="Your selection" fill="var(--blue-11)" />}
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
