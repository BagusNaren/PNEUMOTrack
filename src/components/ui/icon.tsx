import { SymbolView } from "expo-symbols";
import { UI } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const symbols = {
  home: { ios: "house", android: "home", web: "home" },
  history: {
    ios: "clock.arrow.circlepath",
    android: "history",
    web: "history",
  },
  mic: { ios: "mic", android: "mic", web: "mic" },
  add: { ios: "plus", android: "add", web: "add" },
  chevronDown: {
    ios: "chevron.down",
    android: "keyboard_arrow_down",
    web: "keyboard_arrow_down",
  },
  chevronUp: {
    ios: "chevron.up",
    android: "keyboard_arrow_up",
    web: "keyboard_arrow_up",
  },
  chevronRight: {
    ios: "chevron.right",
    android: "chevron_right",
    web: "chevron_right",
  },
  search: { ios: "magnifyingglass", android: "search", web: "search" },
  doctor: { ios: "stethoscope", android: "stethoscope", web: "stethoscope" },
  hospital: {
    ios: "cross.case",
    android: "local_hospital",
    web: "local_hospital",
  },
  chat: { ios: "bubble.left", android: "chat_bubble", web: "chat_bubble" },
  article: { ios: "newspaper", android: "article", web: "article" },
  location: {
    ios: "mappin.and.ellipse",
    android: "location_on",
    web: "location_on",
  },
  map: { ios: "map", android: "map", web: "map" },
  phone: { ios: "phone", android: "call", web: "call" },
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
  tone?: "ink" | "muted" | "brand" | "risk" | "safe" | "onBrand";
  selected?: boolean;
}) {
  const theme = useTheme();
  const colors = {
    ink: theme.ink,
    muted: theme.inkMuted,
    brand: theme.brand,
    risk: theme.risk,
    safe: theme.safe,
    onBrand: theme.onBrand,
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
