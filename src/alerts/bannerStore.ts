import { useSyncExternalStore } from 'react';

// The banner that slides down from the top when an alert arrives while the app is open (prototype: .notif).
// One banner at a time; it goes away by itself after 6.5 seconds (or when tapped).

export interface BannerAlert {
  id: string; // a new id each time, so a repeated alert shows again
  title: string;
  body: string;
  href: string | null; // where a tap goes
}

export const BANNER_MS = 6500;

let current: BannerAlert | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export function showBanner(alert: BannerAlert): void {
  clearTimeout(timer);
  current = alert;
  notify();
  timer = setTimeout(hideBanner, BANNER_MS);
}

export function hideBanner(): void {
  clearTimeout(timer);
  if (current === null) return;
  current = null;
  notify();
}

export const getBanner = (): BannerAlert | null => current;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useBanner = (): BannerAlert | null => useSyncExternalStore(subscribe, getBanner, getBanner);
