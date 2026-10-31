import { Collapsible as NativeCollapsible, Host, RNHostView } from "@expo/ui";
import { type PropsWithChildren, useState } from "react";
import { View } from "react-native";
import { UI } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function Collapsible({
  children,
  title,
}: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();

  return (
    <View className="rounded-card border border-border bg-surface-card dark:border-border-dark dark:bg-surface-card-dark">
      <Host matchContents seedColor={theme.brand} style={{ width: "100%" }}>
        <NativeCollapsible
          label={title}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          labelStyle={{ ...UI.label, color: theme.ink }}
        >
          <RNHostView
            matchContents={{ vertical: true }}
            style={{ width: "100%" }}
          >
            <View>{children}</View>
          </RNHostView>
        </NativeCollapsible>
      </Host>
    </View>
  );
}
