import {
  TabList,
  TabSlot,
  TabTrigger,
  Tabs,
  type TabTriggerSlotProps,
} from "expo-router/ui";
import { type ComponentProps, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, type IconName } from "@/components/ui/icon";
import { MenuSheet } from "@/components/ui/menu-sheet";
import { copy } from "@/constants/copy";

type TabButtonProps = Omit<TabTriggerSlotProps, "ref"> &
  Pick<ComponentProps<typeof Pressable>, "ref"> & {
    icon: IconName;
    label: string;
  };
function TabButton({
  icon,
  label,
  isFocused,
  style,
  ...props
}: TabButtonProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      aria-selected={!!isFocused}
      style={(state) => [
        typeof style === "function" ? style(state) : style,
        { flexDirection: "column", justifyContent: "center" },
      ]}
      className="min-h-12 flex-1 items-center justify-center gap-1 rounded-card active:opacity-70"
    >
      <Icon
        name={icon}
        tone={isFocused ? "brand" : "muted"}
        selected={isFocused}
      />
      <Text
        className={`text-caption ${isFocused ? "font-bold text-brand" : "text-ink-muted"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <Tabs className="flex-1 bg-surface dark:bg-surface-dark">
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <View
          className="min-h-16 w-full max-w-content flex-row items-center self-center border-t border-border bg-surface-card px-3 dark:border-border-dark dark:bg-surface-card-dark"
          style={{
            paddingBottom: insets.bottom,
            paddingLeft: insets.left + 12,
            paddingRight: insets.right + 12,
            minHeight: 64 + insets.bottom,
          }}
        >
          <TabTrigger name="home" href="/(tabs)" asChild>
            <TabButton label={copy.nav.home} icon="home" />
          </TabTrigger>
          <TabTrigger name="history" href="/(tabs)/history" asChild>
            <TabButton label={copy.nav.history} icon="history" />
          </TabTrigger>
          <TabTrigger name="children" href="/(tabs)/children" asChild>
            <TabButton label={copy.nav.profile} icon="profile" />
          </TabTrigger>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.nav.menu}
            accessibilityState={{ expanded: menuOpen }}
            aria-expanded={menuOpen}
            onPress={() => setMenuOpen(true)}
            className="min-h-12 flex-1 items-center justify-center gap-1 rounded-card active:opacity-70"
          >
            <Icon name="menu" tone="muted" />
            <Text className="text-caption text-ink-muted">{copy.nav.menu}</Text>
          </Pressable>
          <TabTrigger
            name="monitoring"
            href="/(tabs)/monitoring"
            style={{ display: "none" }}
          />
          <TabTrigger
            name="more"
            href="/(tabs)/more"
            style={{ display: "none" }}
          />
        </View>
      </TabList>
      <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </Tabs>
  );
}
