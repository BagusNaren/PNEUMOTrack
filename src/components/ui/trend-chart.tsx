import { useState } from "react";
import { View } from "react-native";
import Svg, {
  Circle,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from "react-native-svg";

import { useTheme } from "@/hooks/use-theme";

export function TrendChart({
  samples,
  variant = "line",
  tone = "brand",
  height = 84,
  showValues = false,
  accessibilityLabel,
}: {
  samples: readonly number[];
  variant?: "line" | "bar";
  tone?: "brand" | "risk";
  height?: number;
  showValues?: boolean;
  accessibilityLabel: string;
}) {
  const theme = useTheme();
  const color = tone === "risk" ? theme.risk : theme.brand;
  const grid = theme.border;
  const values = samples.length ? samples : [0];
  const [width, setWidth] = useState(0);

  const paddingX = 4;
  const plotWidth = Math.max(1, width - paddingX * 2);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      className="w-full"
      style={{ height }}
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width;
        if (nextWidth > 0 && nextWidth !== width) setWidth(nextWidth);
      }}
    >
      {width > 0 ? (
        <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
          {variant === "bar" ? (
            <BarChart
              values={values}
              width={width}
              height={height}
              paddingX={paddingX}
              plotWidth={plotWidth}
              color={color}
              grid={grid}
              inkMuted={theme.inkMuted}
              showValues={showValues}
            />
          ) : (
            <LineChart
              values={values}
              width={width}
              height={height}
              paddingX={paddingX}
              plotWidth={plotWidth}
              color={color}
              grid={grid}
            />
          )}
        </Svg>
      ) : null}
    </View>
  );
}

function LineChart({
  values,
  width,
  height,
  paddingX,
  plotWidth,
  color,
  grid,
}: {
  values: readonly number[];
  width: number;
  height: number;
  paddingX: number;
  plotWidth: number;
  color: string;
  grid: string;
}) {
  const top = 12;
  const bottom = height - 8;
  const plotHeight = Math.max(1, bottom - top);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;
  const step = values.length > 1 ? plotWidth / (values.length - 1) : 0;

  const points = values.map((value, index) => ({
    x:
      values.length > 1
        ? paddingX + index * step
        : paddingX + plotWidth / 2,
    y:
      bottom -
      (range === 0 ? 0.5 : (value - min) / range) * plotHeight,
  }));
  const path = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ");

  return (
    <>
      {[0, 0.5, 1].map((ratio) => {
        const y = top + plotHeight * ratio;
        return (
          <Line
            key={ratio}
            x1={paddingX}
            y1={y}
            x2={width - paddingX}
            y2={y}
            stroke={grid}
            strokeWidth="1"
          />
        );
      })}
      <Path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((point, index) => (
        <Circle
          key={`point-${index}`}
          cx={point.x}
          cy={point.y}
          r="2.8"
          fill={color}
        />
      ))}
    </>
  );
}

function BarChart({
  values,
  width,
  height,
  paddingX,
  plotWidth,
  color,
  grid,
  inkMuted,
  showValues,
}: {
  values: readonly number[];
  width: number;
  height: number;
  paddingX: number;
  plotWidth: number;
  color: string;
  grid: string;
  inkMuted: string;
  showValues: boolean;
}) {
  const top = 18;
  const bottom = height - 8;
  const plotHeight = Math.max(1, bottom - top);
  const max = Math.max(...values, 1);
  const slot = plotWidth / values.length;
  const barWidth = Math.min(32, Math.max(8, slot * 0.55));

  return (
    <>
      <Line
        x1={paddingX}
        y1={bottom}
        x2={width - paddingX}
        y2={bottom}
        stroke={grid}
        strokeWidth="1"
      />
      {values.map((value, index) => {
        const barHeight = Math.max(2, (value / max) * plotHeight);
        const x = paddingX + index * slot + (slot - barWidth) / 2;
        const y = bottom - barHeight;
        return (
          <Rect
            key={index}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            rx={3}
            fill={color}
          />
        );
      })}
      {showValues
        ? values.map((value, index) => {
            const barHeight = Math.max(2, (value / max) * plotHeight);
            const x = paddingX + index * slot + slot / 2;
            const y = Math.max(11, bottom - barHeight - 5);
            return (
              <SvgText
                key={`value-${index}`}
                x={x}
                y={y}
                fontSize="10"
                fontWeight="600"
                fill={inkMuted}
                textAnchor="middle"
              >
                {value}
              </SvgText>
            );
          })
        : null}
    </>
  );
}
