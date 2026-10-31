import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export async function triggerRecordStartHaptic(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    if (Platform.OS === "android") {
      await Haptics.performAndroidHapticsAsync(
        Haptics.AndroidHaptics.Gesture_Start,
      );
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    /* Devices without haptic hardware fail silently; visual state leads. */
  }
}

export async function triggerRecordStopHaptic(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    if (Platform.OS === "android") {
      await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    /* Devices without haptic hardware fail silently; visual state leads. */
  }
}

export async function triggerRiskResultHaptic(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    if (Platform.OS === "android") {
      await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject);
      return;
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    /* Devices without haptic hardware fail silently; visual state leads. */
  }
}
