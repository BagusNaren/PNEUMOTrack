import {
  ArrowLeft,
  ArrowRight,
  AudioWaveform,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  HeartPulse,
  History,
  Hospital,
  House,
  Map,
  MapPin,
  Menu,
  MessageCircle,
  Mic,
  Newspaper,
  Phone,
  Plus,
  Search,
  Send,
  Stethoscope,
  Thermometer,
  TriangleAlert,
  User,
  Weight,
  WifiOff,
  Wind,
  X,
  type LucideIcon,
} from "lucide-react-native";

import { UI } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const icons = {
  home: House,
  history: History,
  mic: Mic,
  add: Plus,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronRight: ArrowRight,
  close: X,
  search: Search,
  doctor: Stethoscope,
  hospital: Hospital,
  chat: MessageCircle,
  article: Newspaper,
  thermometer: Thermometer,
  breath: Wind,
  heart: HeartPulse,
  weight: Weight,
  location: MapPin,
  map: Map,
  phone: Phone,
  profile: User,
  menu: Menu,
  back: ArrowLeft,
  send: Send,
  check: CircleCheck,
  warning: TriangleAlert,
  empty: AudioWaveform,
  error: WifiOff,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

export function Icon({
  name,
  tone = "ink",
  selected = false,
  size = UI.iconLg,
}: {
  name: IconName;
  tone?: "ink" | "muted" | "brand" | "risk" | "safe" | "warning" | "onBrand";
  selected?: boolean;
  size?: number;
}) {
  const theme = useTheme();
  const colors = {
    ink: theme.ink,
    muted: theme.iconMuted,
    brand: theme.brand,
    risk: theme.risk,
    safe: theme.safe,
    warning: theme.warning,
    onBrand: theme.onBrand,
  };
  const Glyph = icons[name];

  return (
    <Glyph
      size={size}
      color={colors[tone]}
      strokeWidth={selected ? 2.4 : 2}
      absoluteStrokeWidth
      accessible={false}
    />
  );
}
