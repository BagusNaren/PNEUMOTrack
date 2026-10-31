import { router } from "expo-router";
import { Text } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { ScreenHeader } from "@/components/ui/screen-header";
import { copy } from "@/constants/copy";

// TODO Member C: replace this Sprint 1 placeholder with Dashboard data and states.
export default function HomeScreen() {
  return (
    <Screen bottomInset={false}>
      <ScreenHeader title={copy.common.appName} back={false} />
      <Card variant="brand">
        <Text className="text-title font-bold text-brand dark:text-brand-light">
          {copy.placeholder.homeTitle}
        </Text>
        <Text className="text-body text-ink dark:text-ink-dark">
          {copy.placeholder.homeDescription}
        </Text>
        <Button
          label={copy.placeholder.guideLink}
          onPress={() => router.push("/screening/guide")}
        />
      </Card>
    </Screen>
  );
}
