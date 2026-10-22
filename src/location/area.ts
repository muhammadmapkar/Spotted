// Turns the phone's reverse-geocoding answer into the short area name shown on Home,
// like "Marina, Dubai" or "Khalifa City, Abu Dhabi".

export interface GeocodedAddress {
  district?: string | null; // the neighbourhood
  subregion?: string | null; // a bigger area, used if there is no district
  city?: string | null;
  region?: string | null; // the emirate or state, used if there is no city
}

const clean = (text: string | null | undefined): string | null => {
  const t = text?.trim();
  return t ? t : null;
};

// "District, City". If we only know one of them we show just that. null = we know nothing useful.
export function areaFromGeocode(address: GeocodedAddress | null | undefined): string | null {
  if (!address) return null;
  const place = clean(address.district) ?? clean(address.subregion);
  const city = clean(address.city) ?? clean(address.region);
  if (place && city) return place.toLowerCase() === city.toLowerCase() ? city : `${place}, ${city}`;
  return city ?? place ?? null;
}
