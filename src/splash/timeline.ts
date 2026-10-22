// The numbers behind the animated splash screen, copied from the prototype's SPLASH section
// (.splash, .rod, .bn-*, .road-*, .word, .tagline CSS and keyframes). Kept apart from the drawing
// code so they are easy to test. All times are in milliseconds.

// The prototype draws the splash on a phone-shaped box this big. Everything is scaled from it.
export const DESIGN_WIDTH = 390;
export const DESIGN_HEIGHT = 844;

export const SPLASH_MS = {
  fadeIn: { delay: 0, duration: 500 }, // the whole splash fades in
  road: { delay: 250, duration: 1100 }, // the dark road draws itself, left to right
  roadDash: { delay: 1200, duration: 500 }, // then the white dashed centre line fades in
  unroll: { delay: 900, duration: 1150 }, // the red banner unrolls downward
  folds: { delay: 1000, duration: 1600 }, // fold shading fades away
  sway: { delay: 2050, duration: 1400 }, // the banner sways, then settles
  pin: { delay: 2150, duration: 600 }, // the white pin pops onto the banner
  word: { delay: 2600, duration: 700 }, // "Spotted" rises up
  tagline: { delay: 2850, duration: 700 }, // the tagline rises up
  skipHint: { delay: 3200, duration: 400 }, // "Tap to skip"
  total: 4400, // then the app carries on
  fadeOut: 220, // a quick fade when leaving (not in the prototype, so the cut is not abrupt)
} as const;

// With Reduce Motion on we show the finished picture straight away, and hold it briefly.
export const REDUCED_MOTION_TOTAL_MS = 1800;

// The banner's sway: the angles at each moment (0 to 1 through the sway).
export const SWAY_KEYFRAMES = {
  at: [0, 0.18, 0.42, 0.66, 0.84, 1],
  rotateDeg: [0, 2.4, -1.7, 0.9, -0.3, 0],
  skewDeg: [0, -1.8, 1.2, -0.4, 0, 0],
} as const;

// Sizes in the prototype's design space (390 x 844).
export const SHAPES = {
  rod: { left: 118, width: 154, height: 12 },
  banner: { left: 135, top: 8, width: 120, height: 440 },
  pin: { left: 33, top: 150, width: 54, height: 66 },
  roll: { left: -5, width: 130, height: 22 },
  wordTop: 600,
  wordFontSize: 62,
  taglineTop: 690,
  taglineFontSize: 15,
  skipBottom: 34,
  skipFontSize: 12,
} as const;

// How big to draw it on a screen of this size. We scale the 390 x 844 design to fit, keep it
// centred sideways and at the top (the rod must sit on the very top edge of the screen).
export function splashLayout(width: number, height: number): { scale: number; offsetX: number } {
  const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
  // (never below 0: rounding must not push the picture off the left edge)
  return { scale, offsetX: Math.max(0, (width - DESIGN_WIDTH * scale) / 2) };
}

// ---- the winding road --------------------------------------------------------------------
// The prototype's road: M-30 600 C 70 560, 120 500, 200 495 S 330 420, 420 380.
// We add a short straight piece at each end so the road still reaches the screen edges on
// phones that are wider than the design.
export type Point = [number, number];
const ROAD_START_EXTENSION: [Point, Point] = [[-130, 640], [-30, 600]];
const ROAD_CURVE_1: [Point, Point, Point, Point] = [[-30, 600], [70, 560], [120, 500], [200, 495]];
// "S" reflects the previous control point (120, 500) around (200, 495), which gives (280, 490).
const ROAD_CURVE_2: [Point, Point, Point, Point] = [[200, 495], [280, 490], [330, 420], [420, 380]];
const ROAD_END_EXTENSION: [Point, Point] = [[420, 380], [520, 340]];

// The road as an SVG path.
export const ROAD_PATH =
  'M-130 640 L-30 600 C 70 560, 120 500, 200 495 S 330 420, 420 380 L 520 340';

const lineLength = ([a, b]: [Point, Point]) => Math.hypot(b[0] - a[0], b[1] - a[1]);

// The length of a curve, measured by walking along it in small steps.
export function curveLength([p0, p1, p2, p3]: [Point, Point, Point, Point], steps = 200): number {
  let length = 0;
  let previous = p0;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const point: Point = [
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ];
    length += Math.hypot(point[0] - previous[0], point[1] - previous[1]);
    previous = point;
  }
  return length;
}

// How long the whole road is. Drawing it "from left to right" means sliding a dash of this
// length along it (strokeDashoffset from this number down to 0).
export const ROAD_LENGTH =
  lineLength(ROAD_START_EXTENSION) + curveLength(ROAD_CURVE_1) + curveLength(ROAD_CURVE_2) + lineLength(ROAD_END_EXTENSION);
