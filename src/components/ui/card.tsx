// src/components/ui/card.tsx
// Card component with brand and risk variants.

import { View, type ViewProps } from 'react-native';

type CardVariant = 'default' | 'brand' | 'risk' | 'safe';

interface CardProps extends ViewProps {
  variant?: CardVariant;
  children: React.ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-surface-card border border-border dark:bg-surface-card-dark dark:border-border-dark',
  brand: 'bg-surface-brand border border-transparent dark:bg-surface-brand-dark',
  risk: 'bg-risk-surface border border-risk-border dark:bg-risk-surface-dark dark:border-risk-border-dark',
  safe: 'bg-surface-safe border border-transparent dark:bg-surface-safe-dark',
};

export function Card({ variant = 'default', children, className, ...props }: CardProps & { className?: string }) {
  return (
    <View
      className={`rounded-card p-4 ${variantStyles[variant]} ${className ?? ''}`}
      {...props}
    >
      {children}
    </View>
  );
}
