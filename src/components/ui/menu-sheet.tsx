import { BottomSheet, Host, RNHostView } from "@expo/ui";
import { router, type Href } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { copy } from "@/constants/copy";
import { useTheme } from "@/hooks/use-theme";
import { UI, Spacing } from "@/constants/theme";
import { ListRow } from "./list-row";
import { Card } from "./card";
import { Icon } from "./icon";
import { Button } from "./button";

const entries = [
  { label: copy.nav.children, icon: "profile", href: "/(tabs)/children" },
  { label: copy.nav.monitoring, icon: "mic", href: "/(tabs)/monitoring" },
  { label: copy.nav.articles, icon: "article", href: "/articles" },
  { label: copy.nav.more, icon: "menu", href: "/(tabs)/more" },
] as const satisfies readonly {
  label: string;
  href: Href;
  icon: import("./icon").IconName;
}[];

export function MenuSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // An empty Compose host can still intercept Android taps while the sheet is closed.
  if (!open) return null;

  function navigate(href: Href) {
    onClose();
    router.navigate(href);
  }
  return (
    <Host
      seedColor={theme.brand}
      pointerEvents="none"
      style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
    >
      <BottomSheet
        isPresented={open}
        onDismiss={onClose}
        containerColor={theme.surfaceCard}
        scrimColor={theme.scrim}
        contentPadding={0}
        snapPoints={["half", "full"]}
      >
        <RNHostView style={{ width: "100%", height: "100%" }}>
          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              padding: UI.gutter,
              paddingBottom: insets.bottom + Spacing.four,
            }}
          >
            <View className="gap-3">
              <View className="mb-4 h-1 w-10 self-center rounded-pill bg-subtle" />
              <Text
                accessibilityRole="header"
                className="text-title font-bold text-ink"
              >
                {copy.nav.menu}
              </Text>
              <Card className="overflow-hidden p-0">
                {entries.map((item, idx) => (
                  <ListRow
                    key={item.href}
                    title={item.label}
                    leading={<Icon name={item.icon} tone="brand" />}
                    onPress={() => navigate(item.href)}
                    className={`px-4 ${idx === entries.length - 1 ? "border-b-0" : ""}`}
                  />
                ))}
              </Card>
              {__DEV__ && (
                <Button
                  label={copy.nav.gallery}
                  variant="secondary"
                  onPress={() => navigate("/dev/components")}
                />
              )}
              <Button
                label={copy.common.close}
                variant="secondary"
                onPress={onClose}
              />
            </View>
          </ScrollView>
        </RNHostView>
      </BottomSheet>
    </Host>
  );
}
