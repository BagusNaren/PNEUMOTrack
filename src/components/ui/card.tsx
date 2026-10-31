import { View, type ViewProps } from "react-native";

const variants = {
  default:
    "border-border bg-surface-card dark:border-border-dark dark:bg-surface-card-dark",
  brand: "border-transparent bg-surface-brand dark:bg-surface-brand-dark",
  soft: "border-transparent bg-surface-brand-soft dark:bg-surface-brand-soft-dark",
  risk: "border-risk-border bg-risk-surface dark:border-risk-border-dark dark:bg-risk-surface-dark",
  safe: "border-transparent bg-surface-safe dark:bg-surface-safe-dark",
} as const;

export function Card({
  variant = "default",
  className = "",
  style,
  ...props
}: ViewProps & { variant?: keyof typeof variants }) {
  return (
    <View
      {...props}
      className={`gap-3 rounded-card border p-4 ${variants[variant]} ${className}`}
      style={[{ borderCurve: "continuous" }, style]}
    />
  );
}
