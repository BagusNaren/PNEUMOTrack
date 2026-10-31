import { BottomSheet, Host, RNHostView } from "@expo/ui";
import { router, type Href } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { copy } from "@/constants/copy";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "./button";

const entries = [
  { label: copy.nav.children, href: "/(tabs)/children" },
  { label: copy.nav.monitoring, href: "/(tabs)/monitoring" },
  { label: copy.nav.articles, href: "/articles" },
  { label: copy.nav.more, href: "/(tabs)/more" },
] as const satisfies readonly { label: string; href: Href }[];

export function MenuSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  function navigate(href: Href) {
    onClose();
    router.navigate(href);
  }
  return (
    <Host
      seedColor={theme.brand}
      pointerEvents="box-none"
      style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
    >
      <BottomSheet
        isPresented={open}
        onDismiss={onClose}
        containerColor={theme.surfaceCard}
        contentPadding={0}
        snapPoints={["full"]}
      >
        <RNHostView style={{ width: "100%", height: "100%" }}>
          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              padding: 20,
              paddingBottom: insets.bottom + 24,
            }}
          >
            <View className="gap-3">
              <Text
                accessibilityRole="header"
                className="text-title font-bold text-ink dark:text-ink-dark"
              >
                {copy.nav.menu}
              </Text>
              <Text className="text-body text-ink-muted dark:text-ink-dark-muted">
                {copy.nav.upcoming}
              </Text>
              {entries.map((item) => (
                <Button
                  key={item.href}
                  label={item.label}
                  variant="ghost"
                  onPress={() => navigate(item.href)}
                />
              ))}
              {__DEV__ && (
                <Button
                  label={copy.nav.gallery}
                  variant="secondary"
                  onPress={() => navigate("/dev/components")}
                />
              )}
              <Button label={copy.common.close} onPress={onClose} />
            </View>
          </ScrollView>
        </RNHostView>
      </BottomSheet>
    </Host>
  );
}
