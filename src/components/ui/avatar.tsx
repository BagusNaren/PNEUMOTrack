// src/components/ui/avatar.tsx
// Avatar circle for doctors, children, and chat.

import { Image } from 'expo-image';
import { Text, View, type ViewProps } from 'react-native';

interface AvatarProps extends ViewProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar({ uri, name = '', size = 48, style, ...props }: AvatarProps) {
  const initials = getInitials(name);
  return (
    <View
      style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }, style]}
      className="items-center justify-center bg-surface-brand dark:bg-surface-brand-dark"
      {...props}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" />
      ) : (
        <Text
          className="font-semibold text-brand dark:text-brand-light"
          style={{ fontSize: size * 0.36 }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}
