// The shapes of the Spotted icons, copied from the prototype's SVG icons.
// Every icon is drawn on a 24 x 24 grid with plain lines (no fill), so one colour recolours it.
// No icon contains eyes, faces or any human features.

export type Shape =
  | { type: 'path'; d: string }
  | { type: 'circle'; cx: number; cy: number; r: number }
  | { type: 'rect'; x: number; y: number; width: number; height: number; rx: number };

const path = (d: string): Shape => ({ type: 'path', d });
const circle = (cx: number, cy: number, r: number): Shape => ({ type: 'circle', cx, cy, r });
const rect = (x: number, y: number, width: number, height: number, rx: number): Shape => ({ type: 'rect', x, y, width, height, rx });

export const ICON_SHAPES = {
  pin: [path('M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z'), circle(12, 9.5, 2.5)],
  menu: [path('M7 3h7l5 5v13H7z'), path('M14 3v5h5'), path('M10 13h6M10 17h6')], // a menu document
  search: [circle(11, 11, 7), path('m20 20-3.5-3.5')],
  sliders: [path('M4 7h10M18 7h2M4 17h4M12 17h8'), circle(16, 7, 2), circle(10, 17, 2)],
  bookmark: [path('M6 3h12v18l-6-4-6 4z')],
  map: [path('M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z'), path('M9 4v14M15 6v14')],
  home: [path('M3 11 12 4l9 7'), path('M5 10v10h14V10'), path('M10 20v-6h4v6')],
  sparkle: [
    path('M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z'),
    path('M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z'),
  ],
  back: [path('m15 5-7 7 7 7')],
  close: [path('M6 6l12 12M18 6 6 18')],
  chevron: [path('m6 9 6 6 6-6')], // points down; turn it to open and close dropdowns
  play: [path('m8 6 10 6-10 6z')], // a play triangle, for opening a reel
  camera: [rect(3, 3, 18, 18, 5), circle(12, 12, 4), circle(17.5, 6.5, 1)], // Instagram
  music: [path('M9 18V5l10-2v13'), circle(6, 18, 3), circle(16, 16, 3)], // TikTok
  video: [rect(2, 5, 20, 14, 4), path('m10 9 5 3-5 3z')], // YouTube
  tag: [path('M3 12V4h8l10 10-8 8z'), circle(7.5, 8.5, 1.5)], // offers
  star: [path('m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z')],
  chat: [path('M4 20l1.5-4A8 8 0 1 1 8 18.5z'), path('M9 10.5c.5 1.6 1.9 3 3.5 3.5')], // WhatsApp
  bell: [path('M6 16V11a6 6 0 0 1 12 0v5l2 2H4z'), path('M10 20a2 2 0 0 0 4 0')],
  check: [path('m5 12 5 5 9-10')],
  moon: [path('M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z')],
  sun: [circle(12, 12, 4), path('M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4')],
} as const satisfies Record<string, readonly Shape[]>;

export type IconName = keyof typeof ICON_SHAPES;
