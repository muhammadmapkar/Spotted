// Small helpers for the quiet-hours times, which are stored as "HH:MM" (24-hour).

// Move a time forward or back by some minutes. Wraps around midnight.
// addMinutes("22:00", 30) -> "22:30"    addMinutes("23:45", 30) -> "00:15"
export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = (((h * 60 + m + minutes) % 1440) + 1440) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}
