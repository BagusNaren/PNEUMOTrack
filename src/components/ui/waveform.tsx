// src/components/ui/waveform.tsx
// Static waveform strip from amplitude data. Used in result and history screens.

import { View } from 'react-native';

type WaveformVariant = 'normal' | 'risk';

interface WaveformProps {
  data?: number[]; // 0..1 normalized amplitude values
  samples?: number[]; // alias for data
  variant?: WaveformVariant;
  height?: number;
}

export function Waveform({ data, samples, variant = 'normal', height = 64 }: WaveformProps) {
  const points = data ?? samples ?? Array(60).fill(0.1);
  const barColor = variant === 'risk' ? '#A33A3A' : '#1F4B75';
  const bgClass = variant === 'risk' ? 'bg-risk-surface' : 'bg-surface-brand';
  // Downsample to ≤ 80 bars
  const maxBars = 80;
  const step = Math.max(1, Math.floor(points.length / maxBars));
  const bars = points.filter((_, i) => i % step === 0).slice(0, maxBars);

  return (
    <View
      className={`w-full flex-row items-center justify-between overflow-hidden rounded-card px-2 py-2 ${bgClass}`}
      style={{ height }}
      accessibilityLabel="Waveform batuk"
    >
      {bars.map((amp, i) => (
        <View
          key={i}
          style={{
            width: 2,
            height: Math.max(3, amp * (height - 16)),
            backgroundColor: barColor,
            borderRadius: 1,
            opacity: 0.7 + amp * 0.3,
          }}
        />
      ))}
    </View>
  );
}

export function FlatWaveform({ variant = 'normal', height = 64 }: Omit<WaveformProps, 'data'>) {
  const flatData = Array(60).fill(0.05);
  return <Waveform data={flatData} variant={variant} height={height} />;
}
