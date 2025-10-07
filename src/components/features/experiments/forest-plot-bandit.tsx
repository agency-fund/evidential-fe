'use client';
import {
  AssignSummary,
  MABExperimentSpecOutput,
  CMABExperimentSpecOutput,
  BanditExperimentAnalysisResponse,
  BanditArmAnalysis,
} from '@/api/methods.schemas';
import { COLORS, truncateLabel } from '@/components/features/experiments/forest-plot';
import { Box, Card, Flex, Text } from '@radix-ui/themes';
import { scale } from 'motion';
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { ChartOffset } from 'recharts/types/util/types';

interface BanditData {
  armId: string;
  armName: string;
  sampleSize: number;
  totalSampleSize: number;
  postPredMean: number;
  postPredStd: number;
  priorPredMean: number;
  priorPredStd: number;
  ci95: number;
  ci95Upper: number;
  ci95Lower: number;
  absCI95Lower: number;
  absCI95Upper: number;
}

interface ForestPlotBanditProps {
  analysis: BanditExperimentAnalysisResponse;
  assignSummary: AssignSummary;
  designSpec: MABExperimentSpecOutput | CMABExperimentSpecOutput;
}

// Define a type for the shape props that matches what we need; leverages the fact that
// type ScatterCustomizedShape accepts an ActiveShape, which allows for the signature:
//     ((props: unknown) => React.JSX.Element)
// Just list out what we need, inferred from inspecting props to this shape function.
type CustomBanditShapeProps = {
  cx?: number;
  cy?: number;
  payload?: BanditData;
  xAxis?: {
    width?: number;
  };
  yAxis?: {
    height?: number;
  };
};

function CustomTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <Card style={{ padding: '8px' }}>
      <Flex direction="column" gap="2">
        <Text weight="bold">{data.armName}</Text>
        <Text>Mean: {data.postPredMean.toFixed(2)}</Text>
        <Text>Std: {data.postPredStd.toFixed(2)}</Text>
      </Flex>
    </Card>
  );
}

export function ForestPlotBandit({ analysis, designSpec, assignSummary }: ForestPlotBanditProps) {
  // Get total sample size from assign summary
  const availableN = assignSummary.sample_size;
  const minMean = Math.min(...analysis.arm_analyses.map((d) => d.post_pred_mean));

  const banditData: BanditData[] = analysis.arm_analyses.map((armAnalysis, index) => {
    const armId = armAnalysis.arm_id || 'MISSING_ARM_ID';
    const armName = armAnalysis.arm_name || `Arm ${index}`;
    const armSize = assignSummary.arm_sizes?.find((a) => a.arm.arm_id == armId)?.size || 0;

    const postPredMean = armAnalysis.post_pred_mean;
    const postPredStd = armAnalysis.post_pred_stdev;
    const priorPredMean = armAnalysis.prior_pred_mean;
    const priorPredStd = armAnalysis.prior_pred_stdev;
    const ci95 = 1.96 * postPredStd;
    const ci95Lower = postPredMean - ci95;
    const ci95Upper = postPredMean + ci95;
    const absCI95Lower = ci95Lower + postPredMean == minMean ? 0 : minMean;
    const absCI95Upper = ci95Upper + postPredMean == minMean ? 0 : minMean;

    return {
      armId: armId,
      armName: armName,
      sampleSize: armSize,
      totalSampleSize: availableN,
      postPredMean: postPredMean,
      postPredStd: postPredStd,
      priorPredMean: priorPredMean,
      priorPredStd: priorPredStd,
      ci95: ci95,
      ci95Lower: ci95Lower,
      ci95Upper: ci95Upper,
      absCI95Lower: absCI95Lower,
      absCI95Upper: absCI95Upper,
    };
  });

  // Only render if we have data
  if (banditData.length === 0) {
    return <Text>No treatment arms to display</Text>;
  }

  // Get the min and max x-axis values in metric units to use in our charts.
  function getMinMaxX(banditData: BanditData[]) {
    let minX = Math.min(...banditData.map((d) => d.absCI95Lower));
    let maxX = Math.max(...banditData.map((d) => d.absCI95Upper));

    const viewportWidth = maxX - minX;
    minX = minX - viewportWidth * 0.1;
    maxX = maxX + viewportWidth * 0.1;
    if (Math.abs(minX) > 1 && Math.abs(maxX) > 1) {
      minX = Math.floor(minX);
      maxX = Math.ceil(maxX);
    }
    // If the domain appears to be essentially a singular value, make it larger to avoid a 0-width.
    if (Math.abs(minX - maxX) < 0.0000001) {
      minX = minX - 1;
      maxX = maxX + 1;
    }
    return [minX, maxX];
  }

  const [minX, maxX] = getMinMaxX(banditData);
  // Space 3 ticks evenly across the domain, but filter out duplicates,
  // which can occur when the effect is 0.
  const xGridPoints = [0, 1, 2, 3, 4]
    .map((i) => minX + (i * (maxX - minX)) / 4)
    .filter((value, index, self) => self.indexOf(value) === index);

  // Scale xGridPoints to viewport units for use in drawing grid lines
  const scaleXGridPoints = (props: { xAxis: unknown; width: number; height: number; offset: ChartOffset }) => {
    const { width, offset } = props;
    if (maxX - minX === 0) return []; // zero effect size so no grid lines
    return xGridPoints.map((x) =>
      Math.round((offset.left || 0) + ((x - minX) / (maxX - minX)) * (offset.width || width)),
    );
  };

  // Scale a half-confidence interval to a width in viewport units to be used for drawing the error bars
  const scaleHalfIntervalToViewport = (x: number, width: number | undefined) => {
    if (!width) return 0;
    if (maxX - minX === 0) return 0;
    return (x / (maxX - minX)) * width;
  };

  const commonAxisStyle = {
    fontSize: '16px',
    fontFamily: 'Arial, sans-serif',
  };

  // Adjust plot height based on the number of arms.
  const plotHeightPx = Math.max(160, 64 * banditData.length);
  // Coarse adjustment of the width of the left Y-axis based on the length of the arm names.
  const maxArmNameLength = banditData.reduce((max, e) => Math.max(max, e.armName.length), 0);
  const yRightAxisWidthPx = 80;
  const yLeftAxisWidthPx = maxArmNameLength > 20 ? 180 : 80;

  return (
    <Flex direction="column" gap="3">
      <Box height={`${plotHeightPx}px`}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            {/* Supply our own coordinates generator since default rendering is off for ratio metrics */}
            <CartesianGrid strokeDasharray="3 3" verticalCoordinatesGenerator={scaleXGridPoints} />
            <XAxis
              type="number"
              dataKey="postPredMean"
              interval="preserveStartEnd"
              scale="linear"
              domain={[minX, maxX]}
              style={commonAxisStyle}
              ticks={xGridPoints} // use our own ticks due to auto rendering issues
              tickFormatter={(value) =>
                // Show <= 2 decimal places only for values < 10
                Math.abs(value) >= 10 || value === 0
                  ? value.toFixed()
                  : Math.abs(value) >= 1
                    ? value.toFixed(1)
                    : value.toFixed(2)
              }
            />
            <YAxis
              type="category"
              domain={banditData.map((e, i) => i)}
              // hide={true} - use ticks for arm names
              width={yLeftAxisWidthPx}
              style={commonAxisStyle}
              tickFormatter={(index) => {
                const name = index >= 0 && index < banditData.length ? banditData[index].armName : '';
                return truncateLabel(name);
              }}
              allowDataOverflow={true} // bit of a hack since the ErrorBar is internally messing with the y-axis domain
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Confidence intervals - place under points */}
            <Scatter
              data={banditData}
              fill="none"
              shape={(props: CustomBanditShapeProps) => {
                if (!props.payload || !props.xAxis?.width) {
                  return <g />;
                }

                const { ci95 } = props.payload;
                const {
                  cx: centerX,
                  cy: centerY,
                  xAxis: { width: xAxisWidth },
                } = props;
                const strokeColor: string = COLORS.DEFAULT_CI;
                return (
                  <line
                    x1={(centerX || 0) - scaleHalfIntervalToViewport(ci95, xAxisWidth)}
                    y1={centerY}
                    x2={(centerX || 0) + scaleHalfIntervalToViewport(ci95, xAxisWidth)}
                    y2={centerY}
                    stroke={strokeColor}
                    strokeWidth={5}
                    strokeLinecap="round"
                  />
                );
              }}
            />

            {/* All arms */}
            <Scatter
              data={banditData}
              shape={(props: CustomBanditShapeProps) => {
                // Always return an element even if empty.
                if (!props.payload) return <g />;
                const { cx: centerX, cy: centerY } = props;
                const fillColor: string = COLORS.DEFAULT;
                return <circle cx={centerX} cy={centerY} r={5} fill={fillColor} stroke={COLORS.DEFAULT_CI} />;
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </Box>
    </Flex>
  );
}
