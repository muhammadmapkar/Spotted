import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

// Placeholder screen. We will build the real My Places screen in a later step.
export default function PlacesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Places</Text>
      <Text>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
});
