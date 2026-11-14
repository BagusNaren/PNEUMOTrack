import { vars } from "nativewind";
import { useEffect, type PropsWithChildren } from "react";
import { Platform, View } from "react-native";
import palette from "@/constants/palette.json";
import { useColorScheme } from "@/hooks/use-color-scheme";

const themes = Object.fromEntries(
  Object.entries(palette).map(([scheme, colors]) => [
    scheme,
    vars(
      Object.fromEntries([
        ["--scrim-opacity", parseInt(colors.scrim.slice(7), 16) / 255],
        ...Object.entries(colors).map(([name, hex]) => [
          `--color-${name}`,
          [1, 3, 5]
            .map((offset) => parseInt(hex.slice(offset, offset + 2), 16))
            .join(" "),
        ]),
      ]),
    ),
  ]),
);

export function ThemeRoot({ children }: PropsWithChildren) {
  const scheme = useColorScheme() ?? "light";

  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", scheme === "dark");
    }
  }, [scheme]);

  return (
    <View
      className={`flex-1 bg-surface ${scheme === "dark" ? "dark" : ""}`}
      style={themes[scheme]}
    >
      <View className="w-full max-w-content flex-1 self-center">
        {children}
      </View>
    </View>
  );
}
