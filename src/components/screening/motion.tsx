import { useIsFocused } from "expo-router";
import { useEffect, useState, type PropsWithChildren } from "react";
import { AccessibilityInfo, AppState } from "react-native";
import Animated, {
  cubicBezier,
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export const MOTION_DURATION_MS = 180;
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);
export const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

export function useReduceMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReduced(value);
      })
      .catch(() => {});
    const listener = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => {
      active = false;
      listener.remove();
    };
  }, []);
  return reduced;
}

export function useMotionAllowed() {
  const reduced = useReduceMotion();
  const isFocused = useIsFocused();
  const [appActive, setAppActive] = useState(
    () => !AppState.currentState || AppState.currentState === "active",
  );
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      setAppActive(next === "active");
    });
    return () => subscription.remove();
  }, []);
  return !reduced && isFocused && appActive;
}

export function AnalysisPulse({
  children,
  active,
}: PropsWithChildren<{ active: boolean }>) {
  const motionAllowed = useMotionAllowed();
  const scale = useSharedValue(1);
  useEffect(() => {
    cancelAnimation(scale);
    if (active && motionAllowed) {
      // Two gentle cycles indicate work, then settle; stops immediately on blur or reduce-motion.
      scale.set(
        withRepeat(
          withTiming(1.03, {
            duration: 900,
            easing: EASE_IN_OUT,
          }),
          4,
          true,
        ),
      );
    } else {
      scale.set(
        motionAllowed
          ? withTiming(1, { duration: MOTION_DURATION_MS, easing: EASE_OUT })
          : 1,
      );
    }
    return () => cancelAnimation(scale);
  }, [active, motionAllowed, scale]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
