import { View } from "react-native";
import Svg, { Line, Path, Rect } from "react-native-svg";

import { useTheme } from "@/hooks/use-theme";

export function TrendChart({
  samples,
  variant = "line",
  tone = "brand",
  height = 84,
  accessibilityLabel,
}: {
  samples: readonly number[];
  variant?: "line" | "bar";
  tone?: "brand" | "risk";
  height?: number;
  accessibilityLabel: string;
}) {
  const theme = useTheme();
  const color = tone === "risk" ? theme.risk : theme.brand;
  const grid = theme.border;
  const values = samples.length ? samples : [0];

  if (variant === "bar") {
    const max = Math.max(...values, 1);
    const slot = 100 / values.length;
    const barWidth = Math.max(2, slot * 0.55);
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        style={{ height }}
      >
        <Svg width="100%" height={height} viewBox="0 0 100 40">
          <Line x1="0" y1="38" x2="100" y2="38" stroke={grid} strokeWidth="0.5" />
          {values.map((value, index) => {
            const barHeight = Math.max(1, (value / max) * 34);
            return (
              <Rect
                key={index}
                x={index * slot + (slot - barWidth) / 2}
                y={38 - barHeight}
                width={barWidth}
                height={barHeight}
                rx={1}
                fill={color}
              />
            );
          })}
        </Svg>
      </View>
    );
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = values.length > 1 ? 100 / (values.length - 1) : 100;
  const path = values
    .map((value, index) => {
      const x = index * step;
      const y = 36 - ((value - min) / range) * 30;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{ height }}
    >
      <Svg width="100%" height={height} viewBox="0 0 100 40">
        {[6, 21, 36].map((y) => (
          <Line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke={grid}
            strokeWidth="0.5"
          />
        ))}
        <Path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
