// Where things sit in the bottom bar. The bar is split into equal columns, one per tab.

export const DOT_SIZE = 6; // the small dot under the active tab
export const HOME_CIRCLE = 58; // the raised Home button
export const BAR_CONTENT_HEIGHT = 70; // the part with the tabs (the phone's bottom edge is added below it)
export const MIN_BOTTOM_PADDING = 14; // same as the prototype's 14 px under the tabs

export function columnWidth(barWidth: number, tabCount: number): number {
  return barWidth / tabCount;
}

// The left edge of the sliding dot for the tab at `index`, so it sits in the middle of its column.
export function dotLeft(barWidth: number, tabCount: number, index: number): number {
  return (index + 0.5) * columnWidth(barWidth, tabCount) - DOT_SIZE / 2;
}

// Space under the tabs: at least 14, or the phone's own bottom edge (home gesture bar) if bigger.
export function bottomPadding(safeAreaBottom: number): number {
  return Math.max(MIN_BOTTOM_PADDING, safeAreaBottom);
}

// The whole bar's height, including that bottom space.
export function barHeight(safeAreaBottom: number): number {
  return BAR_CONTENT_HEIGHT + bottomPadding(safeAreaBottom);
}
