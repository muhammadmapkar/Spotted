// TikTok has an official public service ("oEmbed") that returns the caption of a post
// when you give it the link. No login and no scraping (SPEC.md F1b).
// Instagram has no such public service, so for Instagram the user pastes the caption.

export function isTikTokUrl(url: string): boolean {
  return /^https?:\/\/([a-z0-9-]+\.)?tiktok\.com\//i.test(url);
}

// Returns the caption text, or null if it could not be fetched (offline, private post, ...).
// Never throws.
export async function fetchTikTokCaption(url: string): Promise<string | null> {
  try {
    const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data.title === 'string' && data.title.trim() ? data.title : null;
  } catch {
    return null;
  }
}
