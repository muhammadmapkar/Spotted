// Spotted colours. Change them here and the whole app updates.
const coral = '#E8505B'; // main accent colour (brand)
const ink = '#1F2430'; // main text colour (brand)

// A few colours have a slightly deeper "strong" version. They are used only where
// small white text sits on the colour (tags, selected chips) or where coloured text
// sits on white, so everything stays easy to read. The bright brand colours stay
// on big buttons, map pins, stripes and the tab bar.
const coralStrong = '#C93642';

export default {
  light: {
    text: ink,
    mutedText: '#6B7280', // softer grey text
    background: '#FFFFFF',
    card: '#F6F7F9', // background of cards
    border: '#E3E5EA', // faint dividers
    outline: '#7F8591', // outlines of things you tap (chips, inputs, buttons)
    tint: coral,
    tintStrong: coralStrong, // coral behind small white text
    tintText: '#C4303C', // coral used as text colour
    danger: '#C62828', // delete / warning text
    tabIconDefault: '#737A87',
    tabIconSelected: coral,
  },
  dark: {
    text: '#F5F6F8',
    mutedText: '#A0A6B3',
    background: '#14171F',
    card: '#1F232D',
    border: '#2E3340',
    outline: '#6B7280',
    tint: coral,
    tintStrong: coralStrong,
    tintText: '#F26B75',
    danger: '#FF7A85',
    tabIconDefault: '#7B8190',
    tabIconSelected: coral,
  },
};

// Colours for the three place categories (map pins and card stripes).
export const CategoryColors = {
  food: coral,
  shopping: '#8B5CF6', // purple
  fun: '#14B8A6', // teal
};

// Deeper versions for tags and selected chips that have white text on them.
export const CategoryColorsStrong = {
  food: coralStrong,
  shopping: '#7C3AED',
  fun: '#0F766E',
};
