import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { Screen } from "@/components/ui/screen";
import { copy } from "@/constants/copy";
import { UI } from "@/constants/theme";

export default function EntryScreen() {
  useEffect(() => {
    const timer = setTimeout(() => router.replace("/(tabs)"), 700);
    return () => clearTimeout(timer);
  }, []);
  return (
    <Screen scroll={false}>
      <View className="items-center gap-6">
        <Image
          source={require("../../UI_reference/logo.png")}
          accessibilityLabel={copy.common.appName}
          contentFit="contain"
          style={{ width: UI.logoSize, height: UI.logoSize }}
        />
        <Text className="text-title font-bold text-brand dark:text-brand-light">
          {copy.common.appName}
        </Text>
        <Text className="text-center text-title font-bold text-brand dark:text-brand-light">
          {copy.common.tagline}
        </Text>
      </View>
    </Screen>
  );
}
