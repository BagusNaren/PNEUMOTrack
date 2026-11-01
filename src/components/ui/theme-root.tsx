import { vars } from "nativewind";
import type { PropsWithChildren } from "react";
import { View } from "react-native";
import palette from "@/constants/palette.json";
import { useColorScheme } from "@/hooks/use-color-scheme";

const themes = Object.fromEntries(
  Object.entries(palette).map(([scheme, colors]) => [
    scheme,
    vars(
      Object.fromEntries(
        Object.entries(colors).map(([name, hex]) => [
          `--color-${name}`,
          [1, 3, 5]
            .map((offset) => parseInt(hex.slice(offset, offset + 2), 16))
            .join(" "),
        ]),
      ),
    ),
  ]),
);

export function ThemeRoot({ children }: PropsWithChildren) {
  const scheme = useColorScheme() ?? "light";
  return (
    <View className="flex-1 bg-surface" style={themes[scheme]}>
      <View className="w-full max-w-content flex-1 self-center">
        {children}
      </View>
    </View>
  );
}
