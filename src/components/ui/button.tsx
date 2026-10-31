// src/components/ui/button.tsx
// PrimaryButton and SecondaryButton following the design system.

import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends PressableProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const bgStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand active:opacity-80',
  secondary: 'border border-brand bg-transparent active:opacity-70',
  danger: 'bg-risk active:opacity-80',
  ghost: 'bg-transparent active:opacity-60',
};

const textStyles: Record<ButtonVariant, string> = {
  primary: 'text-on-brand',
  secondary: 'text-brand',
  danger: 'text-on-risk',
  ghost: 'text-ink-muted dark:text-ink-dark-muted',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-4',
  md: 'h-12 px-5',
  lg: 'h-14 px-6',
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  disabled,
  className,
  ...props
}: ButtonProps & { className?: string }) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      className={`flex-row items-center justify-center gap-2 rounded-pill ${bgStyles[variant]} ${sizeStyles[size]} ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : '#1F4B75'}
        />
      ) : (
        <>
          {icon}
          <Text className={`text-label font-semibold ${textStyles[variant]}`}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
