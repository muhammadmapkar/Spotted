import { Platform } from 'react-native';

import { LiveMap } from '@/src/components/LiveMap';
import { MapFallback } from '@/src/components/MapFallback';
import { GOOGLE_MAPS_KEY_IN_BUILD } from '@/src/config';

// The map of the places saved from reels (the original map). It opens from "Places from reels".
// On Android the Google map crashes the whole app if no Google Maps key is built in,
// so without a key we show a simple list of places instead (MapFallback).
// iPhone uses Apple Maps, which needs no key.
export default function MapScreen() {
  const mapIsSafe = Platform.OS !== 'android' || GOOGLE_MAPS_KEY_IN_BUILD;
  return mapIsSafe ? <LiveMap /> : <MapFallback />;
}
