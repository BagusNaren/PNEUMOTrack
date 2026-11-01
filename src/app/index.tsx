import { Image } from "expo-image";
import { Redirect } from "expo-router";
import { Text, View } from "react-native";
import { Screen } from "@/components/ui/screen";
import { copy } from "@/constants/copy";
import { UI } from "@/constants/theme";
import { useSession } from "@/hooks/use-session";

export default function EntryScreen() {
  const { user, isLoading } = useSession();
  if (!isLoading) {
    return <Redirect href={user ? "/(tabs)" : "/(auth)/sign-in"} />;
  }
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
