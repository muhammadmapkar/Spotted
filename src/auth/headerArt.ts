import { Point, curveLength } from '../splash/timeline';

// The small road in the sign-in header (from the prototype's .auth-top):
//   M-20 250 C 80 230, 140 200, 210 205 S 330 160, 410 140
// Drawn on a 390 x 300 design box.
export const AUTH_HEADER = { width: 390, height: 300, sheetTop: 268 } as const;

export const AUTH_ROAD_PATH = 'M-20 250 C 80 230, 140 200, 210 205 S 330 160, 410 140';

const CURVE_1: [Point, Point, Point, Point] = [[-20, 250], [80, 230], [140, 200], [210, 205]];
// "S" reflects (140, 200) around (210, 205), which gives (280, 210).
const CURVE_2: [Point, Point, Point, Point] = [[210, 205], [280, 210], [330, 160], [410, 140]];

// The road's length, so the road can "draw itself" (slide a dash along it).
export const AUTH_ROAD_LENGTH = curveLength(CURVE_1) + curveLength(CURVE_2);
