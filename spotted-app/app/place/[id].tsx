import { Ionicons } from '@expo/vector-icons';
import * as Brightness from 'expo-brightness';
import { useKeepAwake } from 'expo-keep-awake';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { PUBLIC_BASE } from '../../src/data';
import { metres } from '../../src/geo';
import { useStore } from '../../src/store';
import { font, radius, space, useTheme } from '../../src/theme';
import { Button, PlaceLogo, T } from '../../src/ui';

const RADIUS_M = 200;

function OfferQR({ value }: { value: string }) {
  useKeepAwake();
  useEffect(() => {
    let prev: number | undefined;
    Brightness.getBrightnessAsync().then((b) => { prev = b; return Brightness.setBrightnessAsync(1); }).catch(() => {});
    return () => { if (prev !== undefined) Brightness.setBrightnessAsync(prev).catch(() => {}); };
  }, []);
  return (
    <View style={{ backgroundColor: '#FFFFFF', padding: space.lg, borderRadius: radius.md, alignItems: 'center', gap: space.sm }}>
      <QRCode value={value} size={200} />
      <T style={{ color: '#2A0F45', fontFamily: font.medium }}>Show this at the counter</T>
    </View>
  );
}

export default function PlaceScreen() {
  const c = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { placeOf, visits, verifyVisit, handle, toVisit, toggleToVisit } = useStore();
  const place = placeOf(id);
  const [receipt, setReceipt] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!place) return <View style={{ padding: space.md }}><T>This place isn't available.</T></View>;

  const today = new Date().toDateString();
  const verifiedToday = visits.some((v) => v.placeId === place.id && new Date(v.at).toDateString() === today);

  async function checkIn() {
    if (!place) return;
    setBusy(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setShowReceipt(true); return; }
      const pos = await Location.getCurrentPositionAsync({});
      const d = metres(pos.coords, { latitude: place.lat, longitude: place.lng });
      if (d > RADIUS_M) {
        Alert.alert('Too far away', `You need to be within ${RADIUS_M} metres of ${place.name}. You can also confirm with your receipt.`);
        setShowReceipt(true);
        return;
      }
      verifyVisit(place.id, 'location');
    } catch {
      setShowReceipt(true);
    } finally {
      setBusy(false);
    }
  }

  async function onToVisit() {
    if (!place) return;
    if (!toVisit.includes(place.id)) {
      // Explain first, then ask: reminders need both location and notification permission.
      const loc = await Location.requestForegroundPermissionsAsync();
      const note = await Notifications.requestPermissionsAsync();
      if (loc.status !== 'granted' || note.status !== 'granted') {
        Alert.alert('Reminders are off', 'Saved to your to-visit list. Turn on location and notifications in Settings to get a reminder when you are nearby.');
      }
    }
    toggleToVisit(place.id);
  }

  function submitReceipt() {
    if (!place) return;
    // Phase 1: any 6+ character receipt number is accepted. The partner app will validate against the restaurant's POS later.
    if (receipt.trim().length < 6) { Alert.alert('Check the receipt number', 'It should be at least 6 characters.'); return; }
    verifyVisit(place.id, 'receipt');
    setShowReceipt(false);
    setReceipt('');
  }

  return (
    <ScrollView contentContainerStyle={{ padding: space.md, gap: space.md }}>
      <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
        <PlaceLogo place={place} size={80} />
        <View style={{ flex: 1 }}>
          <T style={{ fontFamily: font.bold, fontSize: 24 }}>{place.name}</T>
          <T style={{ color: c.muted }}>{place.area}, {place.city}</T>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
        <Button label={toVisit.includes(place.id) ? 'On my to-visit list' : 'Save to visit'} icon={toVisit.includes(place.id) ? 'bookmark' : 'bookmark-outline'} kind={toVisit.includes(place.id) ? 'primary' : 'ghost'} onPress={onToVisit} />
        <Button label="Add to list" icon="list" kind="ghost" onPress={() => router.push({ pathname: '/lists', params: { addPlace: place.id } })} />
        <Button label="Make sticker" icon="sparkles" kind="ghost" onPress={() => router.push(`/sticker/${place.id}`)} />
      </View>

      <View style={{ backgroundColor: c.surface, borderRadius: radius.md, padding: space.md, gap: space.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Ionicons name={verifiedToday ? 'checkmark-circle' : 'location-outline'} size={22} color={verifiedToday ? c.visit : c.primary} />
          <T style={{ fontFamily: font.semi }}>{verifiedToday ? 'Visit verified today' : 'Verify your visit'}</T>
        </View>
        <T style={{ fontSize: 12, color: c.muted }}>Verified visits earn rewards and show proof that your reel brought people in.</T>
        {!verifiedToday && <Button label="Check in here" icon="navigate" onPress={checkIn} disabled={busy} />}
        {showReceipt && !verifiedToday && (
          <View style={{ gap: space.sm }}>
            <TextInput accessibilityLabel="Receipt number" placeholder="Receipt number" placeholderTextColor={c.muted} value={receipt} onChangeText={setReceipt} autoCapitalize="characters"
              style={{ minHeight: 44, borderRadius: radius.md, backgroundColor: c.bg, paddingHorizontal: space.md, fontFamily: font.regular, color: c.text }} />
            <Button label="Confirm with receipt" kind="ghost" onPress={submitReceipt} />
          </View>
        )}
      </View>

      {place.offer ? (
        <View style={{ gap: space.md }}>
          <T style={{ fontFamily: font.semi, fontSize: 18 }}>{place.offer.title}</T>
          <T style={{ color: c.muted }}>{place.offer.conditions} Expires {place.offer.expires}.</T>
          <OfferQR value={`${PUBLIC_BASE}/redeem/${place.id}?creator=${handle}`} />
        </View>
      ) : (
        <T style={{ color: c.muted }}>No offer right now.</T>
      )}
    </ScrollView>
  );
}
