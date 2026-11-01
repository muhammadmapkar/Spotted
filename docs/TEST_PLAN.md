# Spotted: real-phone test plan (Android)

Tick each box when the test passes. If a test fails, write what happened next to it
(and a photo or screen recording helps) and give it to Claude.

**Before you start**

- Install the **preview** build (`eas build --profile preview --platform android`) on the phone.
  A preview build is the closest to what testers get. It does **not** have the grey "Testing:" buttons in
  Settings (those only exist in a development build).
- For tests 5 to 9 you need the real thing: walk or travel past a saved place with the app **closed**.
- Allow location **"Allow all the time"** and notifications when the app asks.
- Turn off battery saving for Spotted first (see the end of this file). This is the usual reason a reminder is late.
- Before you start, tap **Settings → Delete all my data**, so every test starts clean.
- Keep a note of the phone model and Android version: ____________________

> **Tip for walking tests:** reminders fire when you walk **into** the circle. Save a place that is
> about 500 m to 1 km from where you are, set the distance (radius) to **200 m** in Settings, then walk
> towards it. If you start inside the circle, you may not get a reminder.

---

## A. Saving places

### 1. [ ] Share from Instagram
- **What to do:** Open Instagram. Open a reel about a restaurant or cafe. Tap **Share** → **Spotted**.
  (If Spotted is not in the list, tap **More** or **Copy link** instead and paste it in Spotted.)
- **What should happen:** Spotted opens on **Add place**. A box says "Reel link attached" and shows the link.

### 2. [ ] Share from TikTok
- **What to do:** Open TikTok. Open a video about a place. Tap **Share** → **Spotted**.
- **What should happen:** Spotted opens on **Add place** with the link attached, and the text
  "We read the TikTok caption for you". Place suggestions may appear below.

### 3. [ ] Caption suggestion
- **What to do:**
  - TikTok: do test 2 with a video where the caption names a place (for example a line starting with 📍).
  - Instagram: in Instagram copy the caption. In Spotted tap **Find the place from the caption**, press and hold in
    the box, tap **Paste**.
- **What should happen:** Spotted suggests one to three places. Nothing is saved until you tap one and confirm.
  If the caption has no clue, you see the normal search box.

### 4. [ ] Save, edit, delete
- **What to do:**
  1. Search for a place, tap it, choose a category (Food / Shopping / Fun), add a note, tap Save.
  2. In **My Places** tap the place, change the category and the note, tap **Save changes**.
  3. Make a collection (for example "Brunch") and put the place in it.
  4. Long-press the place in the list → **Delete** → confirm.
- **What should happen:**
  1. The place appears at the top of My Places with the right colour, name and area.
  2. The changes are kept after you close and open the app.
  3. The collection chip filters the list.
  4. The place disappears. Nothing crashes.

### 4b. [ ] Search finds real places
- **What to do:** In Add place type three or more letters of a real place near you.
- **What should happen:** Real Google results appear (not just a small list of Dubai demo places).
  If you only see the demo list, the proxy address is missing in the build (see MY_STEPS.md, Phase 1).

---

## B. Map

### 5. [ ] Map and filters
- **What to do:** Save at least one Food place and one Fun place. Open the **Map** tab.
  Tap the chips **Food**, **Shopping**, **Fun**, **All**. Tap a pin.
- **What should happen:** The real Google map shows. Pins are coloured (Food coral, Shopping purple, Fun teal).
  Each chip shows only that category. Tapping a pin shows a card with name, note, **Open reel**, **Directions**.
  **Directions** opens Google Maps. If you only see a list with "Map view is coming soon", the Maps key is not in the
  build (MY_STEPS.md, Phase 1).

---

## C. Reminders (the important part)

### 6. [ ] Walk-by reminder with the app closed
- **What to do:** Save a place about 500 m to 1 km away. Settings → distance **200 m**. Close Spotted completely
  (swipe it away from recent apps). Lock the phone. Walk (or travel) to the place.
- **What should happen:** Within a minute or two of reaching the circle, a notification appears:
  "You're near {place} — you saved it from a reel 👀". (Without a reel link: "… — it's on your Spotted list 👀".)
  Tapping it opens that place. Note how long it took: ____________

### 7. [ ] No repeat within 24 hours
- **What to do:** Right after test 6, walk out of the circle (more than 200 m away), then walk in again.
- **What should happen:** **No second notification** for the same place. After 24 hours it can remind you again.

### 8. [ ] Quiet hours
- **What to do:** Settings → Quiet hours **on**. Set "From" to 30 minutes ago and "Until" to 2 hours from now.
  Save a **new** place 500 m+ away, and walk into its circle.
- **What should happen:** **No notification** while it is quiet. Afterwards, turn quiet hours off, walk out and
  back into the circle: now the reminder arrives.

### 9. [ ] Daily limit
- **What to do:** Settings → Most reminders per day → **1**. Save two different places that are far from each other.
  Walk into the first circle, then (the same day) into the second.
- **What should happen:** The first place sends a reminder. The second sends **none**. Set it to **No limit** and the
  second one works.

### 10. [ ] Mute a place
- **What to do:** Open a saved place and turn off **Remind me when I'm near**. Tap **Save changes**. Walk into its circle.
- **What should happen:** No reminder for that place. Other places still remind you.

### 11. [ ] "I've been here"
- **What to do:** Open a saved place, turn on **I've been here**, tap **Save changes**. Walk into its circle.
- **What should happen:** No reminder. Turn it off again and reminders for that place can come back.

---

## D. Permissions refused

### 12. [ ] Location refused
- **What to do:** Delete the app's data (Settings → Delete all my data, then Android Settings → Apps → Spotted →
  Permissions → Location → **Don't allow**). Open Spotted.
- **What should happen:** The app does **not** crash. My Places, Add place, edit and delete all work. A banner says
  reminders are off, with a button **Turn on** that opens the phone settings. Distances are not shown.
  Also try **Allow only while using the app** (not "all the time"): the banner should still explain how to turn
  reminders on.

### 13. [ ] Notifications refused
- **What to do:** Android Settings → Apps → Spotted → Notifications → **off**. Open Spotted.
- **What should happen:** No crash. A banner says reminders are off. Saving and the map still work. No reminder arrives.
  Turn notifications back on and the banner goes away.

---

## E. Data and battery

### 14. [ ] Delete all my data
- **What to do:** Save some places and a collection. Change a setting. Settings → **Delete all my data** → confirm.
- **What should happen:** A message says it is done. My Places is empty, Collections are gone, Settings are back to the
  defaults (radius 300 m, 2 reminders a day, quiet hours 22:00 to 08:00).

### 15. [ ] Battery after a full day
- **What to do:** Charge to 100%. Save at least 5 places. Use the phone normally for a full day with Spotted allowed
  "all the time". In the evening open Android Settings → Battery → **Battery usage** → find Spotted.
- **What should happen:** Spotted uses only a small amount (as a guide: **under 5%**) and is not near the top of the list.
  Write down: phone ________  Spotted battery % ________  hours on battery ________

### 16. [ ] Privacy and support links
- **What to do:** Settings → **Privacy policy**, then **Contact support**.
- **What should happen:** The privacy policy page opens in the browser. The email app opens with the support address.
  (Until the policy is published you see "coming soon": see MY_STEPS.md, Phase 4.)

### 17. [ ] Reel link problems
- **What to do:** Open a saved place with a reel link, tap **Open reel**. Then ask a friend for a place whose reel was
  deleted, or edit the link to something that cannot open.
- **What should happen:** The reel opens in Instagram or the browser. If it cannot open, a friendly message appears
  and you can choose to remove the link.

### 18. [ ] Share a place with a friend
- **What to do:** Open a saved place, tap **Share place**, choose WhatsApp or Messages.
- **What should happen:** The message has the place name, your note, a Google Maps link and the reel link.

### 19. [ ] Search and sort in My Places
- **What to do:** Type part of a place's name, area or note in the search box. Tap **Nearest**.
- **What should happen:** The list shrinks to matching places. **Nearest** puts the closest place first
  (only when location is allowed).

### 20. [ ] Back up and restore
- **What to do:** Save 3 places, one in a collection. Settings → **Back up my places** → save the file to Google Drive
  (or email it to yourself). Then Settings → **Delete all my data**. Then Settings → **Restore from a backup** → pick the file.
- **What should happen:** "Backup restored: 3 places added." The places, their notes, reel links and collection are back.
  Restore the same file again: "0 places added, 3 skipped" (nothing is doubled). Picking a photo or other file shows
  "Could not restore" and nothing changes.

---

## Turn off battery saving for Spotted

Phone makers stop background apps to save battery. That can delay or block reminders. Do these for **every** phone
you test on, then restart the phone once.

**Samsung (One UI)**
1. Settings → **Apps** → **Spotted** → **Battery** → choose **Unrestricted**.
2. Settings → **Battery** (or "Battery and device care") → **Background usage limits**.
   Turn **off** "Put unused apps to sleep". Open **Sleeping apps** and **Deep sleeping apps** and remove Spotted if it is there.
   Add Spotted to **Never auto sleeping apps**.
3. Settings → Apps → Spotted → **Permissions** → **Location** → **Allow all the time**, and turn on **Use precise location**.

**Xiaomi / Redmi / POCO (MIUI or HyperOS)**
1. Settings → **Apps** → **Manage apps** → **Spotted** → **Battery saver** → **No restrictions**.
2. In the same screen turn on **Autostart**.
3. Open the recent apps screen, press and hold the Spotted card, and tap the **lock** icon (so it is not cleaned).
4. Settings → Apps → Manage apps → Spotted → **Permissions** → **Location** → **Allow all the time**.
5. Settings → **Battery** → turn off **Battery saver** while testing.

**Google Pixel**
1. Settings → **Apps** → **Spotted** → **App battery usage** → choose **Unrestricted**.
2. Settings → **Battery** → **Battery Saver** → **off**.
3. Settings → Apps → Spotted → **Permissions** → **Location** → **Allow all the time**, and **Use precise location** on.
4. Also: Settings → Apps → Spotted → turn **off** "Pause app activity if unused".

**Any other phone**
Look up your phone brand at <https://dontkillmyapp.com> and follow its steps for your model.

---

## Results sheet

| Phone and Android version | Tests that failed | Notes |
|---|---|---|
| | | |
| | | |
| | | |
