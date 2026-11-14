import { Image, type ImageSource } from "expo-image";
import { useState } from "react";
import { Text, View } from "react-native";
import { copy } from "@/constants/copy";

export function Avatar({
  name,
  source,
  size = "lg",
  accessibilityLabel = copy.ui.avatarFallback,
}: {
  name?: string;
  source?: ImageSource;
  size?: "sm" | "md" | "lg" | "xl";
  accessibilityLabel?: string;
}) {
  const [failedSource, setFailedSource] = useState<ImageSource>();
  const initials =
    name
      ?.replace(/^((dr|drg|prof|ir|h|hj)\.?\s+)+/i, "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => Array.from(part)[0])
      .join("")
      .toLocaleUpperCase("id-ID") || "?";
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      className={`shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-brand ${ { sm: "h-10 w-10", md: "h-12 w-12", lg: "h-16 w-16", xl: "h-20 w-20" }[size]}`}
    >
      {source && source !== failedSource ? (
        <Image
          source={source}
          contentFit="cover"
          style={{ width: "100%", height: "100%" }}
          onError={() => setFailedSource(source)}
        />
      ) : (
        <Text className={`font-semibold text-brand ${ { sm: "text-label", md: "text-body", lg: "text-subtitle", xl: "text-title" }[size]}`}>
          {initials}
        </Text>
      )}
    </View>
  );
}
