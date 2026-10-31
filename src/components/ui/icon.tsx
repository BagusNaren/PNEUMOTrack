import { SymbolView } from "expo-symbols";
import { UI } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const symbols = {
  home: { ios: "house", android: "home", web: "home" },
  history: { ios: "waveform.path.ecg", android: "ecg_heart", web: "ecg_heart" },
  profile: { ios: "person", android: "person", web: "person" },
  menu: { ios: "line.3.horizontal", android: "menu", web: "menu" },
  back: { ios: "chevron.left", android: "arrow_back", web: "arrow_back" },
  check: {
    ios: "checkmark.circle",
    android: "check_circle",
    web: "check_circle",
  },
  warning: {
    ios: "exclamationmark.triangle",
    android: "warning",
    web: "warning",
  },
  empty: { ios: "waveform", android: "graphic_eq", web: "graphic_eq" },
  error: { ios: "wifi.slash", android: "wifi_off", web: "wifi_off" },
} as const;

export type IconName = keyof typeof symbols;
export function Icon({
  name,
  tone = "ink",
  selected = false,
}: {
  name: IconName;
  tone?: "ink" | "muted" | "brand" | "risk" | "safe";
  selected?: boolean;
}) {
  const theme = useTheme();
  const colors = {
    ink: theme.ink,
    muted: theme.inkMuted,
    brand: theme.brand,
    risk: theme.risk,
    safe: theme.safe,
  };
  return (
    <SymbolView
      name={symbols[name]}
      size={UI.iconSize}
      tintColor={colors[tone]}
      weight={selected ? "bold" : "regular"}
      style={{ width: UI.iconSize, height: UI.iconSize }}
      accessible={false}
    />
  );
}
