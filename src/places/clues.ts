// The place-clue finder: reads a caption (text the user pasted from Instagram or TikTok)
// and works out which place it is probably about.
//
// It runs on the phone and uses simple rules, no AI service and no internet. It only looks at
// text the user gave us. It never reads Instagram or TikTok by itself.
//
// The result is a short, ranked list of "clues" (search words). The app searches for the best
// clues, shows the matching places, and the user always taps to confirm.

export type ClueSource = 'pin' | 'quote' | 'phrase' | 'mention' | 'hashtag';

export interface PlaceClue {
  text: string; // the clue itself, e.g. "Arabian Tea House"
  searchText: string; // what to search for: the clue plus the area, e.g. "Common Grounds Jumeirah"
  source: ClueSource; // where in the caption we found it
  score: number; // how sure we are (higher is better)
}

// How much we trust each kind of clue.
const SCORE = { pin: 100, pinMention: 80, quote: 70, phrase: 60, phraseOneWord: 45, hashtagWords: 40, mention: 35, hashtag: 25 };

const MAX_CLUES = 5;
const MAX_LENGTH = 80;

// Neighbourhoods first (more specific), then cities. Used as extra search context.
const AREAS = [
  'Al Fahidi', 'Bur Dubai', 'Al Satwa', 'Satwa', 'Umm Suqeim', 'Al Quoz', 'Al Barsha', 'Business Bay', 'Downtown Dubai',
  'Downtown', 'Dubai Marina', 'Marina', 'JBR', 'JLT', 'Palm Jumeirah', 'Jumeirah', 'Deira', 'Karama', 'DIFC', 'City Walk',
  'Al Wasl', 'Sharjah', 'Abu Dhabi', 'Ajman', 'Ras Al Khaimah', 'Dubai', 'London', 'Paris', 'New York', 'Istanbul', 'Singapore',
];

// Hashtags and words that tell us nothing about WHICH place it is.
const GENERIC_TAGS = new Set([
  'fyp', 'foryou', 'foryoupage', 'viral', 'reels', 'reel', 'trending', 'explore', 'explorepage', 'tiktok', 'instagram', 'insta',
  'instagood', 'foodie', 'foodies', 'food', 'foodporn', 'instafood', 'yummy', 'delicious', 'travel', 'traveltok', 'vlog', 'cafe',
  'coffee', 'brunch', 'dinner', 'lunch', 'breakfast', 'restaurant', 'restaurants', 'beach', 'shopping', 'mall', 'love',
  'photooftheday', 'lifestyle', 'weekend', 'mustvisit', 'mustTry', 'hiddengem', 'hiddengems', 'things', 'todo', 'life', 'life',
  'bestof', 'best', 'top', 'review', 'tips', 'guide', 'places', 'spots', 'vibes', 'aesthetic', 'date', 'datenight', 'family',
]);

// Capitalised words that are not place names.
const NAME_STOP = new Set([
  'I', 'We', 'You', 'It', 'This', 'That', 'These', 'Those', 'They', 'He', 'She', 'My', 'Our', 'Your', 'Home', 'Work', 'Night',
  'Last', 'First', 'Least', 'Once', 'Times', 'Instagram', 'TikTok', 'Reels', 'Reel', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday', 'Sunday', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December', 'Today', 'Tonight', 'Tomorrow', 'Yesterday', 'The', 'A', 'An',
]);

// Small words allowed inside a name: "Souk Madinat Jumeirah", "Museum of the Future", "Cafe de Paris".
const CONNECTORS = new Set(['of', 'the', 'de', 'al', 'el', 'la', 'le', 'du', 'di', 'and', '&']);

// Words before "@name" that mean the account is the person who filmed it, not the place.
const CREDIT_WORDS = /(?:\bby|\bcredits?|\bvia|\bthanks(?: to)?|\bthx|\bcollab(?: with)?|\bfeat|\bft|\bphoto|\bvideo|\bfilmed|\bedit(?:ed)?|\bcreator|📸|🎥|🎬)\s*[:\-–]?\s*$/i;

// ---------------------------------------------------------------------------------------------

// Remove emoji, web links and stray symbols from a piece of text.
function tidy(text: string): string {
  return text
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[\p{Extended_Pictographic}️‍]/gu, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–—:|,.;!?"“”'‘’•*]+|[\s\-–—:|,.;!?"“”'‘’•*]+$/g, '')
    .trim();
}

// Words that often end a business name. Used to split a handle like "arabianteahouse".
const ENDING_WORDS = [
  'house', 'cafe', 'coffee', 'kitchen', 'bar', 'grill', 'restaurant', 'bistro', 'beach', 'mall', 'souk', 'market', 'garden',
  'park', 'museum', 'tower', 'tea', 'bakery', 'lounge', 'club', 'hotel', 'resort', 'shop', 'store', 'books', 'boutique',
  'gallery', 'studio', 'roastery', 'brasserie', 'pizza', 'burger', 'sushi', 'shisha', 'terrace', 'courtyard', 'village',
  'island', 'lake', 'fountain', 'frame', 'canal', 'dubai', 'jumeirah', 'marina', 'downtown', 'deira', 'difc', 'jbr', 'sharjah',
];

// "arabianteahouse" -> "arabian tea house". We peel known ending words off the back, one by one.
function splitRunTogether(handle: string): string {
  const words: string[] = [];
  let rest = handle;
  while (rest.length > 3) {
    const ending = ENDING_WORDS.filter((w) => rest.endsWith(w) && rest.length > w.length).sort((a, b) => b.length - a.length)[0];
    if (!ending) break;
    words.unshift(ending);
    rest = rest.slice(0, -ending.length);
  }
  return words.length > 0 ? [rest, ...words].join(' ') : handle;
}

// "ArabianTeaHouse" -> "Arabian Tea House".  "the_sum_of_us" -> "the sum of us".  "arabianteahouse" -> "arabian tea house".
function splitWords(name: string): { text: string; manyWords: boolean } {
  let text = name
    .replace(/[_.]+/g, ' ')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .trim();
  if (!/\s/.test(text) && text === text.toLowerCase()) text = splitRunTogether(text);
  return { text, manyWords: /\s/.test(text) };
}

const compact = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

// The area mentioned in the caption (for example "Jumeirah"), or null.
export function detectArea(caption: string): string | null {
  const lower = ' ' + caption.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ') + ' ';
  const squashed = compact(caption);
  for (const area of AREAS) {
    const a = area.toLowerCase();
    if (lower.includes(' ' + a + ' ')) return area;
  }
  // Hashtags like #jumeirah or #downtowndubai are written without spaces.
  for (const area of AREAS) {
    if (area.length > 4 && squashed.includes(compact(area))) return area;
  }
  return null;
}

// Is this tag one of the "tells us nothing" ones, like #foodie or #dubaifood?
function isGenericTag(tag: string): boolean {
  const lower = tag.toLowerCase();
  if (GENERIC_TAGS.has(lower)) return true;
  for (const area of AREAS) {
    const a = compact(area);
    if (lower === a) return true; // just the area, like #dubai
    if (lower.startsWith(a) && GENERIC_TAGS.has(lower.slice(a.length))) return true; // #dubaifood
    if (lower.endsWith(a) && GENERIC_TAGS.has(lower.slice(0, -a.length))) return true; // #foodiedubai
  }
  return false;
}

interface RawClue {
  text: string;
  source: ClueSource;
  score: number;
}

// ---------------------------------------------------------------------------------------------

export function findPlaceClues(caption: string): PlaceClue[] {
  if (!caption || !caption.trim()) return [];
  const found: RawClue[] = [];
  const areaKeys = new Set(AREAS.map(compact));
  const add = (text: string, source: ClueSource, score: number) => {
    const clean = tidy(text).replace(/['’]s\b/g, '');
    if (source !== 'pin' && areaKeys.has(compact(clean))) return; // "Dubai" alone is an area, not a place
    if (clean.length < 3 || clean.length > MAX_LENGTH) return;
    if (!/\p{L}/u.test(clean)) return; // needs at least one letter
    found.push({ text: clean, source, score });
  };

  // 1. Pins: "📍 Arabian Tea House, Al Fahidi", "Location: Zuma Dubai", "Where: ..."
  for (const match of caption.matchAll(/(?:📍|📌|\blocation\s*:|\bloc\s*:|\bwhere\s*:|\baddress\s*:)\s*([^\n#]+)/giu)) {
    const line = match[1].trim();
    if (line.startsWith('@')) {
      const { text } = splitWords(line.slice(1).split(/\s/)[0]);
      add(text, 'pin', SCORE.pinMention);
    } else {
      add(line.split(/\s[|•·]\s/)[0].replace(/@\S+/g, ''), 'pin', SCORE.pin);
    }
  }

  // 2. Names in double quotes: Trying “Operation Falafel” today
  for (const match of caption.matchAll(/["“]([^"“”\n]{3,60})["”]/g)) {
    if (/^\p{Lu}/u.test(match[1].trim())) add(match[1], 'quote', SCORE.quote);
  }

  // 3. Phrases like "at Common Grounds", "visited Pierchic", "went to Zuma"
  const trigger = '(?:[Aa]t|[Vv]isited|[Vv]isit|[Ww]ent to|[Hh]ead(?:ed)? to|[Cc]heck out|[Ll]ocated at|[Ff]ind (?:them|it) at)';
  const word = "\\p{Lu}[\\p{L}\\p{N}'’.&-]*";
  const connector = '(?:of|the|de|al|el|la|le|du|di|and|&)';
  const phrase = new RegExp(`\\b${trigger}\\s+(?:the\\s+|The\\s+)?(${word}(?:\\s+(?:${connector}\\s+)*${word}){0,4})`, 'gu');
  for (const match of caption.matchAll(phrase)) {
    const words = match[1].split(/\s+/).filter((w) => w);
    // Cut the name at the first word that is not part of a name, and drop leading junk.
    while (words.length > 0 && NAME_STOP.has(words[0].replace(/[.,!?]+$/, ''))) words.shift();
    while (words.length > 0 && (CONNECTORS.has(words[words.length - 1].toLowerCase()) || NAME_STOP.has(words[words.length - 1]))) words.pop();
    if (words.length === 0) continue;
    add(words.join(' '), 'phrase', words.length > 1 ? SCORE.phrase : SCORE.phraseOneWord);
  }

  // 4. @mentions of a restaurant or shop (but not the person who filmed it, and not emails)
  for (const match of caption.matchAll(/@([\p{L}\p{N}._]{3,30})/gu)) {
    const index = match.index ?? 0;
    if (index > 0 && /[\p{L}\p{N}]/u.test(caption[index - 1])) continue; // part of an email address
    if (CREDIT_WORDS.test(caption.slice(Math.max(0, index - 25), index))) continue; // "video by @someone"
    const handle = match[1].replace(/\.+$/, '');
    if (handle.length < 3) continue;
    add(splitWords(handle).text, 'mention', SCORE.mention);
  }

  // 5. Hashtags that name a place: #ArabianTeaHouse, #kitebeach (but not #foodie or #dubai)
  for (const match of caption.matchAll(/#([\p{L}\p{N}_]+)/gu)) {
    const tag = match[1];
    if (tag.length < 4 || isGenericTag(tag)) continue;
    const { text, manyWords } = splitWords(tag);
    add(text, 'hashtag', manyWords ? SCORE.hashtagWords : SCORE.hashtag);
  }

  // Put the best first. When one clue is just a shorter piece of another, keep the longer one.
  found.sort((a, b) => b.score - a.score);
  const kept: RawClue[] = [];
  for (const clue of found) {
    const key = compact(clue.text);
    const duplicate = kept.some((k) => {
      const other = compact(k.text);
      return other === key || other.includes(key) || key.includes(other);
    });
    if (!duplicate) kept.push(clue);
  }

  // Add the area (for example "Jumeirah") to each search, so "Common Grounds" finds the right branch.
  // If a clue already names an area itself ("Zuma Dubai"), leave it alone: another place in the
  // same caption may be in a different area.
  const area = detectArea(caption);
  return kept.slice(0, MAX_CLUES).map((clue) => {
    const namesAnArea = AREAS.some((a) => compact(clue.text).includes(compact(a)));
    return { ...clue, searchText: area && !namesAnArea ? `${clue.text} ${area}` : clue.text };
  });
}
