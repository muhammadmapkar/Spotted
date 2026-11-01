// A reel link that was shared to Spotted while the welcome / permission screens were showing.
// We can't open Add Place yet (those screens are not part of the real app), so we remember the link
// here and open Add Place as soon as onboarding is finished.
let pendingLink: string | null = null;

// Remember a shared link until onboarding is done.
export function rememberPendingShare(link: string): void {
  pendingLink = link;
}

// Get the remembered link (and forget it, so it is only used once). Returns null if there is none.
export function takePendingShare(): string | null {
  const link = pendingLink;
  pendingLink = null;
  return link;
}
