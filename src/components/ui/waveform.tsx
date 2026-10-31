import { memo, useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import {
  CSS_EASE_OUT,
  EASE_OUT,
  MOTION_DURATION_MS,
  useMotionAllowed,
} from "@/components/screening/motion";
import { copy } from "@/constants/copy";

const BAR_COUNT = 32;
const BAR_HEIGHT = 72;
const MIN_SCALE = 2 / BAR_HEIGHT;
const BAR_INDICES = Array.from({ length: BAR_COUNT }, (_, index) => index);

const LiveWaveformBar = memo(function LiveWaveformBar({
  index,
  liveSamples,
  animate,
  variant,
}: {
  index: number;
  liveSamples: SharedValue<readonly number[]>;
  animate: boolean;
  variant: "normal" | "risk";
}) {
  const scaleY = useSharedValue(MIN_SCALE);

  useEffect(() => {
    if (!animate) {
      cancelAnimation(scaleY);
    }
    return () => cancelAnimation(scaleY);
  }, [animate, scaleY]);

  useAnimatedReaction(
    () => {
      const list = liveSamples.get();
      if (!list.length) return MIN_SCALE;
      const step = Math.max(1, Math.ceil(list.length / BAR_COUNT));
      const sampleIndex = index * step;
      const raw = sampleIndex < list.length ? list[sampleIndex] : 0;
      const clamped = Number.isFinite(raw)
        ? Math.max(0, Math.min(1, raw))
        : 0;
      return Math.max(MIN_SCALE, clamped);
    },
    (target, previous) => {
      if (target === previous) return;
      if (animate) {
        scaleY.set(
          withTiming(target, {
            duration: MOTION_DURATION_MS,
            easing: EASE_OUT,
          }),
        );
      } else {
        cancelAnimation(scaleY);
        scaleY.set(target);
      }
    },
    [animate, index, liveSamples],
  );

  const style = useAnimatedStyle(() => ({
    height: BAR_HEIGHT,
    transform: [{ scaleY: scaleY.get() }],
  }));

  return (
    <View className="min-w-0 flex-1">
      <Animated.View style={style}>
        <View
          className={`w-full rounded-pill ${variant === "risk" ? "bg-risk dark:bg-risk-light" : "bg-brand dark:bg-brand-light"}`}
          style={{ height: BAR_HEIGHT }}
        />
      </Animated.View>
    </View>
  );
});

export const Waveform = memo(function Waveform({
  samples = [],
  liveSamples,
  mode = "static",
  variant = "normal",
}: {
  samples?: readonly number[];
  liveSamples?: SharedValue<readonly number[]>;
  mode?: "static" | "live";
  variant?: "normal" | "risk";
}) {
  const motionAllowed = useMotionAllowed();
  const animateLive = mode === "live" && motionAllowed;
  const useSharedLiveBars = mode === "live" && liveSamples !== undefined;

  // Limit bars to keep each sample visible on narrow screens.
  const step = Math.max(1, Math.ceil(samples.length / BAR_COUNT));
  const bars = samples.length
    ? samples.filter((_, index) => index % step === 0)
    : Array.from({ length: BAR_COUNT }, () => 0);

  return (
    <View
      className={`gap-2 rounded-card p-4 ${variant === "risk" ? "bg-risk-surface dark:bg-risk-surface-dark" : "bg-surface-brand dark:bg-surface-brand-dark"}`}
    >
      <View
        accessible
        accessibilityLabel={
          mode === "live" ? copy.ui.liveWaveform : copy.ui.waveform
        }
        className="h-20 flex-row items-center justify-center gap-1"
      >
        {useSharedLiveBars
          ? BAR_INDICES.map((index) => (
              <LiveWaveformBar
                key={index}
                index={index}
                liveSamples={liveSamples}
                animate={animateLive}
                variant={variant}
              />
            ))
          : bars.map((sample, index) => (
              <View key={index} className="min-w-0 flex-1">
                <Animated.View
                  style={{
                    height: BAR_HEIGHT,
                    transform: [
                      {
                        scaleY: Math.max(
                          MIN_SCALE,
                          Number.isFinite(sample)
                            ? Math.max(0, Math.min(1, sample))
                            : 0,
                        ),
                      },
                    ],
                    transitionProperty: "transform",
                    transitionDuration: animateLive ? MOTION_DURATION_MS : 0,
                    transitionTimingFunction: CSS_EASE_OUT,
                  }}
                >
                  <View
                    className={`w-full rounded-pill ${variant === "risk" ? "bg-risk dark:bg-risk-light" : "bg-brand dark:bg-brand-light"}`}
                    style={{ height: BAR_HEIGHT }}
                  />
                </Animated.View>
              </View>
            ))}
      </View>
      {!useSharedLiveBars && !samples.length && (
        <Text className="text-caption text-ink dark:text-ink-dark">
          {copy.ui.noSamples}
        </Text>
      )}
    </View>
  );
});
