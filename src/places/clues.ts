// Finds "place clues" in the caption of a reel, entirely on the phone.
// No AI service and no server: just simple patterns. The clues are only SUGGESTIONS;
// the user always confirms the place (SPEC.md F1b).

// Areas people often mention in Dubai captions. Adding the area to a search makes it more exact.
const AREAS = [
  'Palm Jumeirah', 'Jumeirah Lake Towers', 'Dubai Marina', 'Business Bay', 'Downtown Dubai',
  'City Walk', 'Al Quoz', 'Al Barsha', 'Al Fahidi', 'Al Satwa', 'Bur Dubai', 'Umm Suqeim',
  'Dubai Hills', 'Dubai Creek Harbour', 'Dubai Design District', 'Dubai Silicon Oasis',
  'Jumeirah', 'Downtown', 'Marina', 'JBR', 'JLT', 'DIFC', 'Deira', 'Satwa', 'Karama', 'Alserkal',
  'Abu Dhabi', 'Sharjah',
];

// Words that look like a place name after "at" but are not one.
const NOT_PLACES = new Set([
  'home', 'work', 'night', 'least', 'last', 'first', 'once', 'the', 'this', 'that', 'it', 'all',
  'best', 'noon', 'dawn', 'sunset', 'sunrise', 'dinner', 'lunch', 'breakfast', 'brunch', 'times',
]);

export type ClueKind = 'pin' | 'at' | 'tag';

export interface PlaceClue {
  text: string; // what to search for, e.g. "Arabian Tea House Al Fahidi"
  kind: ClueKind;
}

const MAX_CLUES = 4;

// Remove links, #hashtags, emoji and stray punctuation from a piece of text.
function tidy(text: string): string {
  return text
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/#[\p{L}\p{N}_]+/gu, ' ')
    .replace(/\p{Extended_Pictographic}|️|‍/gu, ' ')
    .replace(/[|•·→>]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[\s:,\-–—.!?]+|[\s:,\-–—.!?]+$/g, '');
}

// The first known area mentioned anywhere in the caption (or undefined).
function findArea(caption: string): string | undefined {
  const lower = caption.toLowerCase();
  // Longest names first, so "Palm Jumeirah" wins over "Jumeirah".
  return [...AREAS]
    .sort((a, b) => b.length - a.length)
    .find((area) => new RegExp(`(^|[^\\p{L}])${area.toLowerCase()}($|[^\\p{L}])`, 'u').test(lower));
}

// "arabian_tea.house" -> "arabian tea house"
function handleToWords(handle: string): string {
  return handle.replace(/[._]+/g, ' ').trim();
}

function looksUseful(text: string): boolean {
  if (text.length < 3 || text.length > 60) return false;
  if (!/\p{L}/u.test(text)) return false;
  return !NOT_PLACES.has(text.toLowerCase());
}

// Turn a caption into a short list of things worth searching for, best clue first.
export function extractPlaceClues(caption: string): PlaceClue[] {
  const clues: PlaceClue[] = [];
  const seen = new Set<string>();
  const area = findArea(caption);

  const add = (raw: string, kind: ClueKind) => {
    let text = tidy(raw);
    if (!looksUseful(text)) return;
    if (area && !text.toLowerCase().includes(area.toLowerCase())) text = `${text} ${area}`;
    const key = text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    clues.push({ text, kind });
  };

  // 1. Lines like "📍 Arabian Tea House, Al Fahidi" or "Location: Zuma".
  for (const line of caption.split(/\r?\n/)) {
    const pin = line.match(/^\s*(?:📍|📌|🗺️?)\s*(.+)$/u) ?? line.match(/^\s*(?:location|where|place|address)\s*[:\-]\s*(.+)$/i);
    if (pin) add(pin[1], 'pin');
  }

  // 2. Phrases like "at Zuma Dubai" (capitalised words right after "at").
  const atPattern = /\b[Aa]t\s+((?:[A-Z][\p{L}\p{N}'’&.\-]*)(?:\s+(?:[A-Z&][\p{L}\p{N}'’&.\-]*|(?:of|the|de|la|al|el)\b)){0,5})/gu;
  for (const match of caption.matchAll(atPattern)) {
    // A name can't end on a small joining word like "of" or "the".
    add(match[1].replace(/(\s+(?:of|the|de|la|al|el))+$/i, ''), 'at');
  }

  // 3. @tags such as "@arabianteahouse" (turned into words).
  for (const match of caption.matchAll(/@([A-Za-z0-9._]{3,30})/g)) {
    const words = handleToWords(match[1]);
    if (!/^\d+$/.test(words)) add(words, 'tag');
  }

  return clues.slice(0, MAX_CLUES);
}
