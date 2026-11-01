// "Remind me at a time": the ready-made choices (no fiddly clock picker), worked out from "now".
// Plain functions, so automatic tests can check them.

export interface TimeChoice {
  label: string;
  date: Date;
}

// A copy of `day` at hh:00 (local time).
function at(day: Date, hour: number): Date {
  const d = new Date(day);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function addDays(day: Date, days: number): Date {
  const d = new Date(day);
  d.setDate(d.getDate() + days);
  return d;
}

// The choices shown on the place screen. Ones that are too soon (or already past) are left out.
export function timeChoices(now: Date): TimeChoice[] {
  const choices: TimeChoice[] = [];

  // This evening at 7 pm, only if that is at least 30 minutes away.
  const evening = at(now, 19);
  if (evening.getTime() - now.getTime() >= 30 * 60 * 1000) {
    choices.push({ label: 'This evening, 7 pm', date: evening });
  }

  choices.push({ label: 'Tomorrow, 7 pm', date: at(addDays(now, 1), 19) });

  // The next Saturday (the weekend in the UAE starts on Saturday), at 11 am. Never today.
  const daysToSaturday = (6 - now.getDay() + 7) % 7 || 7;
  choices.push({ label: 'Saturday, 11 am', date: at(addDays(now, daysToSaturday), 11) });

  choices.push({ label: 'In a week, 7 pm', date: at(addDays(now, 7), 19) });
  return choices;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "Sat 7 Nov, 11:00" - short and the same on every phone.
export function formatReminderTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}, ${hh}:${mm}`;
}

// Is there a timed reminder still waiting to go off?
export function hasUpcomingReminder(remindAt: string | undefined, now: Date): boolean {
  if (!remindAt) return false;
  const time = new Date(remindAt).getTime();
  return !Number.isNaN(time) && time > now.getTime();
}
