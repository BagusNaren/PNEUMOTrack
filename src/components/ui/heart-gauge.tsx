// src/components/ui/heart-gauge.tsx
// HeartGauge — SVG concentric ring heart indicator for Dashboard and Monitoring.
// Requires react-native-svg.

import Svg, { Circle, Path } from 'react-native-svg';
import { View, Text } from 'react-native';

type HeartGaugeVariant = 'normal' | 'risk' | 'pending';

interface HeartGaugeProps {
  variant: HeartGaugeVariant;
  size?: number;
}

const variantColors: Record<HeartGaugeVariant, { rings: string[]; text: string; label: string }> = {
  normal: {
    rings: ['#D9EFE7', '#6FD3AE', '#1F7A5C'],
    text: '#1F7A5C',
    label: 'Tidak ada indikasi',
  },
  risk: {
    rings: ['#F4D6D6', '#F08A8A', '#A33A3A'],
    text: '#A33A3A',
    label: 'Indikasi risiko',
  },
  pending: {
    rings: ['#EAF4F9', '#A0D1EC', '#1F4B75'],
    text: '#1F4B75',
    label: 'Belum diskrining',
  },
};

// Simple heart shape as SVG path (normalized to 100x100 viewBox)
const HEART_PATH =
  'M50 85 C50 85 15 60 15 35 C15 20 28 15 38 20 C43 22 47 27 50 30 C53 27 57 22 62 20 C72 15 85 20 85 35 C85 60 50 85 50 85Z';

export function HeartGauge({ variant, size = 120 }: HeartGaugeProps) {
  const { rings, text, label } = variantColors[variant];

  return (
    <View className="items-center gap-1">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Outer ring */}
          <Path d={HEART_PATH} fill={rings[0]} />
          {/* Middle ring — slightly inset */}
          <Path
            d="M50 78 C50 78 22 57 22 36 C22 23 32 19 41 23 C45 25 48 29 50 32 C52 29 55 25 59 23 C68 19 78 23 78 36 C78 57 50 78 50 78Z"
            fill={rings[1]}
          />
          {/* Inner ring */}
          <Path
            d="M50 71 C50 71 29 54 29 37 C29 26 37 23 44 26 C47 27 49 31 50 34 C51 31 53 27 56 26 C63 23 71 26 71 37 C71 54 50 71 50 71Z"
            fill={rings[2]}
          />
        </Svg>
      </View>
      <Text
        className="text-center text-caption font-semibold"
        style={{ color: text, maxWidth: size }}
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  );
}
