import type { PropsWithChildren } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function Screen({
  children,
  scroll = true,
  bottomInset = true,
}: PropsWithChildren<{
  scroll?: boolean;
  bottomInset?: boolean;
}>) {
  const insets = useSafeAreaInsets();
  const content = (
    <View
      role="main"
      className="w-full max-w-content gap-6 self-center px-5 pt-2"
    >
      {children}
    </View>
  );
  const paddingBottom = (bottomInset ? insets.bottom : 0) + 24;
  return (
    <View
      className="flex-1 bg-surface dark:bg-surface-dark"
      style={{ paddingTop: insets.top }}
    >
      {scroll ? (
        <ScrollView
          contentInsetAdjustmentBehavior="never"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingBottom }}
        >
          {content}
        </ScrollView>
      ) : (
        <View className="flex-1 justify-center" style={{ paddingBottom }}>
          {content}
        </View>
      )}
    </View>
  );
}
