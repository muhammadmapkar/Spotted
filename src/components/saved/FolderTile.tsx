import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { Animated, usePopIn } from '@/src/components/motion';
import { AppText } from '@/src/components/ui/ui';
import { thumbColors } from '@/src/data/mock';
import { FolderTile as TileData } from '@/src/saved/savedData';

// One folder on the Saved tab (prototype: .tile and .minis): a coloured gradient card with up to three
// overlapping place logos at the top, then the folder name and how many places are inside. It pops in.
export function FolderTile({ tile, onPress }: { tile: TileData; onPress: () => void }) {
  const pop = usePopIn(tile.delay, 450);
  return (
    <Animated.View style={[styles.slot, pop]}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${tile.name}, ${tile.countLabel}`} style={{ flex: 1 }}>
        <LinearGradient colors={tile.colors} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.tile}>
          <View style={styles.minis}>
            {tile.minis.map((place, i) => (
              <LinearGradient
                key={place.id}
                colors={thumbColors(place)}
                start={{ x: 0.2, y: 0.1 }}
                end={{ x: 0.8, y: 0.9 }}
                style={[styles.mini, { zIndex: 3 - i }]}>
                <AppText tone="onBrand" weight="800" size={11}>{place.mono}</AppText>
              </LinearGradient>
            ))}
          </View>
          <View>
            <AppText tone="onBrand" weight="700" size={18}>{tile.name}</AppText>
            <AppText tone="onBrand" size={12} style={{ opacity: 0.9 }}>{tile.countLabel}</AppText>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1, minWidth: 0 },
  tile: { height: 150, padding: 16, borderRadius: 22, justifyContent: 'space-between', overflow: 'hidden' },
  minis: { flexDirection: 'row', minHeight: 34 },
  mini: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.9)',
    marginRight: -10,
    overflow: 'hidden',
  },
});
