import { Tabs } from 'expo-router';

import { SpottedTabBar } from '@/src/components/SpottedTabBar';
import { INITIAL_TAB } from '@/src/components/tabBarConfig';
import { POPPINS } from '@/src/theme/fonts';

// The bottom bar: Saved . Map . Home (centre) . New In . Profile. Home opens first.
// The look of the bar itself is in src/components/SpottedTabBar.tsx.
export default function TabLayout() {
  return (
    <Tabs
      initialRouteName={INITIAL_TAB}
      tabBar={(props) => <SpottedTabBar {...props} />}
      screenOptions={{ headerTitleStyle: { fontFamily: POPPINS.semiBold } }}>
      {/* The order here is the order in the bar */}
      <Tabs.Screen name="saved" options={{ title: 'Saved', headerShown: false }} />
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
      <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false }} />
      <Tabs.Screen name="new" options={{ title: 'New In', headerShown: false }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', headerShown: false }} />
    </Tabs>
  );
}
