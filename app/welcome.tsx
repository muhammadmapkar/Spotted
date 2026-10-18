import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, useWindowDimensions } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

// The three welcome slides.
const SLIDES = [
  { emoji: '📲', title: 'Save from reels', text: 'Found a great place on Instagram? Share the reel to Spotted, or paste its link.' },
  { emoji: '📍', title: 'Confirm the place', text: 'Pick the exact place yourself, choose Food, Shopping or Fun, and add a note.' },
  { emoji: '🔔', title: 'Get reminded nearby', text: 'When you are close to a saved place, Spotted gives you a gentle nudge.' },
];

export default function WelcomeScreen() {
  const theme = Colors[useColorScheme()];
  const router = useRouter();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const next = () => {
    if (isLast) router.push('/permissions' as never);
    else listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.push('/permissions' as never)} style={styles.skip}>
        <Text style={{ color: theme.mutedText, fontSize: 16 }}>Skip</Text>
      </Pressable>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(slide) => slide.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={[styles.text, { color: theme.mutedText }]}>{item.text}</Text>
          </View>
        )}
      />

      {/* Little dots showing which slide you are on */}
      <View style={styles.dots}>
        {SLIDES.map((slide, i) => (
          <View
            key={slide.title}
            style={[styles.dot, { backgroundColor: i === index ? theme.tint : theme.border }]}
          />
        ))}
      </View>

      <Pressable onPress={next} style={[styles.button, { backgroundColor: theme.tint }]}>
        <Text style={styles.buttonText}>{isLast ? 'Get started' : 'Next'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, paddingBottom: 40 },
  skip: { alignSelf: 'flex-end', minHeight: 48, minWidth: 64, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  emoji: { fontSize: 88, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  text: { fontSize: 17, lineHeight: 25, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 24 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  button: { marginHorizontal: 24, minHeight: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
