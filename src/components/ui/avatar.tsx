import { Image, type ImageSource } from "expo-image";
import { useState } from "react";
import { Text, View } from "react-native";
import { copy } from "@/constants/copy";

export function Avatar({
  name,
  source,
  accessibilityLabel = copy.ui.avatarFallback,
}: {
  name?: string;
  source?: ImageSource;
  accessibilityLabel?: string;
}) {
  const [failedSource, setFailedSource] = useState<ImageSource>();
  const initials =
    name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => Array.from(part)[0])
      .join("")
      .toLocaleUpperCase("id-ID") || "?";
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      className="h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-brand dark:bg-surface-brand-dark"
    >
      {source && source !== failedSource ? (
        <Image
          source={source}
          contentFit="cover"
          style={{ width: "100%", height: "100%" }}
          onError={() => setFailedSource(source)}
        />
      ) : (
        <Text className="text-subtitle font-semibold text-brand dark:text-brand-light">
          {initials}
        </Text>
      )}
    </View>
  );
}
