# Two-week pilot (10–20 Dubai testers)

**Goal:** find out if people keep saving places and if the reminders feel useful, before building more.
SPEC.md section 12 asks for "no crashes in a 1-week test by 12+ testers". This pilot covers that and more.

## Who
- 10–20 people who use Instagram or TikTok to find food and things to do in Dubai.
- Mix of people who live in different areas (so reminders actually fire), at least 5 who commute.
- Android phones first (iPhone testers once iPhone sharing is built).

## Before you start
1. Deploy the places proxy (`server/places-proxy/README.md`) and set `EXPO_PUBLIC_PLACES_PROXY_URL`.
2. Make one development or internal-test build (`eas build`) and send testers the install link.
3. Send each tester the three-line guide below.

> **Tester guide:** (1) Install Spotted and allow location "all the time" and notifications.
> (2) When you see a reel about a place, tap Share → Spotted and confirm the place. Try to do this at least 3 times a week.
> (3) Go about your life. When you get a reminder, tap it. In a notification that annoyed you, mute that place.

## What to measure (ask testers to reply to a 5-question message on day 7 and day 14)
| Question | Why |
|---|---|
| How many places did you save? (the list screen shows it) | Is saving easy enough? |
| How many reminders did you get, and how many were useful? | Are reminders worth it? |
| Did you ever go somewhere because of a reminder? | The key proof the idea works. |
| Did anything annoy you or drain your battery? | Reliability and fatigue. |
| Would you be upset if the app disappeared? | Real value. |

Also note: crashes, reminders that never came, and reminders that came late (Android battery saving is the usual cause).

## Decide after 2 weeks
- **Keep going** if most testers saved 5+ places and at least a third acted on a reminder.
- **Fix saving** if people save fewer than 3 places (improve the caption suggestions, add clipboard detection).
- **Fix reminders** if they are late, missing, or annoying (check Settings → reminder status, battery use, daily limit).
