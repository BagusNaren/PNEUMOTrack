// src/app/(tabs)/_layout.tsx
// 4-Tab Bottom Navigation Shell matching design.md §7.18 and UI references.

import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E3E9EE',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: '#1F4B75',
        tabBarInactiveTintColor: '#AEB7C2',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarAccessibilityLabel: 'Beranda',
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center">
              <Text style={{ color, fontSize: 22, fontWeight: focused ? 'bold' : 'normal' }}>
                ⌂
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="monitoring"
        options={{
          title: 'Monitoring',
          tabBarAccessibilityLabel: 'Monitoring',
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center">
              <Text style={{ color, fontSize: 20, fontWeight: focused ? 'bold' : 'normal' }}>
                〰
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="children"
        options={{
          title: 'Anak',
          tabBarAccessibilityLabel: 'Profil Anak',
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center">
              <Text style={{ color, fontSize: 20, fontWeight: focused ? 'bold' : 'normal' }}>
                👤
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Lainnya',
          tabBarAccessibilityLabel: 'Menu Lainnya',
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center">
              <Text style={{ color, fontSize: 22, fontWeight: focused ? 'bold' : 'normal' }}>
                ☰
              </Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

