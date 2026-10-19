// Helpers for links that arrive from Instagram (shared or pasted).

// Finds the first web link inside some text.
// "Look at this! https://www.instagram.com/reel/ABC/?igsh=xyz" -> "https://www.instagram.com/reel/ABC/?igsh=xyz"
export function extractFirstUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s<>"']+/i);
  if (!match) return null;
  return match[0].replace(/[).,;!?]+$/, ''); // drop punctuation stuck to the end
}

// Instagram adds a personal tracking code (like ?igsh=...) to shared links.
// We don't need it, so we remove everything after the "?" for Instagram links.
export function cleanReelUrl(url: string): string {
  const isInstagram = /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\//i.test(url);
  return isInstagram ? url.split(/[?#]/)[0] : url;
}

// Text in, tidy reel link out (or null if there is no link in the text).
export function reelLinkFromText(text: string): string | null {
  const url = extractFirstUrl(text);
  return url ? cleanReelUrl(url) : null;
}
