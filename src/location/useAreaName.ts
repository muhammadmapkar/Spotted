import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { SAMPLE_AREA } from '../data/mock';
import { areaFromGeocode } from './area';

// The user's current area as "District, City" for the Home screen.
//  - asks for location permission if we have never asked (otherwise it uses the answer already given)
//  - gets the position and turns it into a name (reverse geocoding)
//  - if permission is refused, or anything fails, it shows the sample area ("Khalifa City, Abu Dhabi")
export function useAreaName(): { area: string; fromPhone: boolean } {
  const [result, setResult] = useState({ area: SAMPLE_AREA, fromPhone: false });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let permission = await Location.getForegroundPermissionsAsync();
        if (permission.status === 'undetermined') permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') return;

        const position =
          (await Location.getLastKnownPositionAsync()) ??
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        const [address] = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        const area = areaFromGeocode(address);
        if (area && !cancelled) setResult({ area, fromPhone: true });
      } catch {
        // No location, no signal, or no geocoder: keep the sample area.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return result;
}
