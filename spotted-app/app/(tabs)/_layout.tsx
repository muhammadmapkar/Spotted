import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { ColorValue } from 'react-native';
import { font, useTheme } from '../../src/theme';

const icon = (name: keyof typeof Ionicons.glyphMap) => ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} size={size} color={color as string} />;

export default function TabsLayout() {
  const c = useTheme();
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: c.primary, tabBarInactiveTintColor: c.muted,
      tabBarStyle: { backgroundColor: c.bg, borderTopColor: c.line },
      tabBarLabelStyle: { fontFamily: font.medium, fontSize: 11 },
      headerStyle: { backgroundColor: c.bg }, headerTitleStyle: { fontFamily: font.bold, color: c.text, fontSize: 24 },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', headerTitle: 'Your spots', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="map" options={{ title: 'Map', headerTitle: 'Map', tabBarIcon: icon('map') }} />
      <Tabs.Screen name="collabs" options={{ title: 'Collabs', headerTitle: 'Collab inbox', tabBarIcon: icon('mail') }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', headerTitle: 'Your proof', tabBarIcon: icon('stats-chart') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', headerTitle: 'Profile', tabBarIcon: icon('person-circle') }} />
    </Tabs>
  );
}
