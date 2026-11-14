import { Icon } from "./icon";
import { Pressable, Text, View } from 'react-native';

interface ListRowProps {
  onPress?: () => void;
  leading?: React.ReactNode;
  title: string;
  subtitle?: string | React.ReactNode;
  trailing?: React.ReactNode;
  showChevron?: boolean;
  className?: string;
}

export function ListRow({
  onPress,
  leading,
  title,
  subtitle,
  trailing,
  showChevron = true,
  className = '',
}: ListRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={`min-h-14 flex-row items-center gap-3 border-b border-subtle py-3.5 active:opacity-70 ${className}`}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      {leading ? <View className="shrink-0">{leading}</View> : null}
      <View className="min-w-0 flex-1 gap-1">
        <Text numberOfLines={2} className="text-body font-semibold text-ink dark:text-ink-dark">
          {title}
        </Text>
        {typeof subtitle === 'string' ? (
          <Text numberOfLines={1} className="text-caption text-ink-muted dark:text-ink-dark-muted">
            {subtitle}
          </Text>
        ) : (
          subtitle
        )}
      </View>
      {trailing ? <View className="shrink-0 items-end">{trailing}</View> : null}
      {showChevron && onPress ? (
        <Icon name="chevronRight" tone="muted" />
      ) : null}
    </Pressable>
  );
}

