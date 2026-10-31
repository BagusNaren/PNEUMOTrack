import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from "react-native";
import { useTheme } from "@/hooks/use-theme";

const variants = {
  primary: {
    container: "bg-brand dark:bg-brand-light",
    text: "text-on-brand dark:text-on-brand-dark",
  },
  secondary: {
    container: "border border-brand dark:border-brand-light",
    text: "text-brand dark:text-brand-light",
  },
  risk: {
    container: "bg-risk dark:bg-risk-light",
    text: "text-on-risk dark:text-on-risk-dark",
  },
  ghost: {
    container: "bg-transparent",
    text: "text-brand dark:text-brand-light",
  },
} as const;
type ButtonProps = Omit<PressableProps, "children"> & {
  label: string;
  variant?: keyof typeof variants;
  loading?: boolean;
};

export function Button({
  label,
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  style,
  ...props
}: ButtonProps) {
  const theme = useTheme();
  const blocked = disabled || loading;
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? label}
      accessibilityState={{
        ...props.accessibilityState,
        disabled: !!blocked,
        busy: loading,
      }}
      disabled={blocked}
      aria-busy={loading}
      aria-disabled={!!blocked}
      className={`min-h-12 flex-row flex-wrap items-center justify-center gap-2 rounded-pill px-5 py-3 active:opacity-80 ${blocked ? "bg-surface-muted dark:bg-surface-muted-dark" : variants[variant].container} ${className}`}
      style={style}
    >
      {loading && <ActivityIndicator color={theme.inkMuted} />}
      <Text
        className={`min-w-0 shrink text-center text-label font-semibold ${blocked ? "text-ink-muted dark:text-ink-dark-muted" : variants[variant].text}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function PrimaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button {...props} variant="primary" />;
}
export function SecondaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button {...props} variant="secondary" />;
}
export function RiskButton(props: Omit<ButtonProps, "variant">) {
  return <Button {...props} variant="risk" />;
}
