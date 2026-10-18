// Spotted colours. Change them here and the whole app updates.
const coral = '#E8505B'; // main accent colour
const ink = '#1F2430'; // main text colour

export default {
  light: {
    text: ink,
    mutedText: '#6B7280', // softer grey text
    background: '#FFFFFF',
    card: '#F6F7F9', // background of cards
    border: '#E3E5EA',
    tint: coral,
    tabIconDefault: '#9AA0AB',
    tabIconSelected: coral,
  },
  dark: {
    text: '#F5F6F8',
    mutedText: '#A0A6B3',
    background: '#14171F',
    card: '#1F232D',
    border: '#2E3340',
    tint: coral,
    tabIconDefault: '#7B8190',
    tabIconSelected: coral,
  },
};

// Colours for the three place categories.
export const CategoryColors = {
  food: coral,
  shopping: '#8B5CF6', // purple
  fun: '#14B8A6', // teal
};
