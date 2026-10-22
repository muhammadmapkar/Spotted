// Where a "nearby" alert goes when it is tapped. The place travels inside the notification as `data`.
//   data.venueId  = a saved Spotted place  -> the Place page   (/venue/<id>)
//   data.placeId  = a place saved from a reel -> its edit page (/place/<id>)
export function hrefForAlert(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const { venueId, placeId } = data as { venueId?: unknown; placeId?: unknown };
  if (typeof venueId === 'string' && venueId) return `/venue/${encodeURIComponent(venueId)}`;
  if (typeof placeId === 'string' && placeId) return `/place/${encodeURIComponent(placeId)}`;
  return null;
}
