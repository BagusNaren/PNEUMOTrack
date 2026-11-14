import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { copy } from "@/constants/copy";
import { UI } from "@/constants/theme";

const images = [
  require("../../assets/images/image_children.png"),
  require("../../assets/images/image_doctor.png"),
] as const;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const slide = copy.onboarding.slides[index];
  const isLast = index === copy.onboarding.slides.length - 1;

  const finish = () => router.replace("/(auth)/sign-in");

  return (
    <View
      className="flex-1 bg-surface px-5"
      style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }}
    >
      <View className="flex-row justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.onboarding.skip}
          onPress={finish}
          className="min-h-12 justify-center px-3 active:opacity-70"
        >
          <Text className="text-label font-semibold text-ink-muted">
            {copy.onboarding.skip}
          </Text>
        </Pressable>
      </View>

      <View className="flex-1 justify-center gap-8">
        <View className="items-center">
          {index < 2 ? (
            <View
              className="items-center justify-center rounded-[32px] bg-surface-brand-soft"
              style={{ width: "100%", height: 300 }}
            >
              <Image
                source={images[index]}
                contentFit="contain"
                accessibilityLabel={slide.title}
                style={{ width: 240, height: 260 }}
              />
            </View>
          ) : (
            <View
              className="items-center justify-center rounded-[32px] bg-surface-brand"
              style={{ width: "100%", height: 300 }}
            >
              <View className="h-40 w-40 items-center justify-center rounded-full bg-surface">
                <Icon name="hospital" size={96} tone="brand" />
              </View>
            </View>
          )}
        </View>

        <View className="gap-3">
          <Text
            accessibilityRole="header"
            className="text-center text-display font-bold text-brand"
          >
            {slide.title}
          </Text>
          <Text className="mx-auto max-w-[330px] text-center text-body text-ink-muted">
            {slide.body}
          </Text>
        </View>
      </View>

      <View className="gap-5">
        <View className="flex-row justify-center gap-2">
          {copy.onboarding.slides.map((item, itemIndex) => (
            <View
              key={item.title}
              className={`h-2 rounded-full ${
                itemIndex === index ? "w-8 bg-brand" : "w-2 bg-border"
              }`}
            />
          ))}
        </View>
        <Button
          label={isLast ? copy.onboarding.start : copy.onboarding.next}
          onPress={() => {
            if (isLast) {
              finish();
              return;
            }
            setIndex((current) => current + 1);
          }}
          className="w-full"
          style={{ minHeight: UI.touchTarget }}
        />
      </View>
    </View>
  );
}
