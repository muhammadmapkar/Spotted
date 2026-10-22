// Colours for the older screens (Add place, the edit page, Collections, Settings, the welcome slides, ...).
// They use the SAME purple look as the redesigned screens (see constants/Theme.ts and SPEC.md section 10),
// so the whole app looks like one. Change them here and those screens update.
const purple = '#6A1FB0'; // brand (light mode)
const purpleDark = '#7B2CD6'; // deeper purple behind small white text in dark mode
const ink = '#1C0F2E'; // main text colour (light mode)

export default {
  light: {
    text: ink,
    mutedText: '#5E4F72', // softer text
    background: '#F6F2FB',
    card: '#FFFFFF', // background of cards
    border: '#E2D7F0', // faint dividers
    outline: '#7F6C99', // outlines of things you tap (chips, inputs, buttons)
    tint: purple,
    tintStrong: purple, // purple behind small white text
    tintText: purple, // purple used as text colour
    danger: '#C42334', // delete / warning text
    tabIconDefault: '#756788',
    tabIconSelected: purple,
  },
  dark: {
    text: '#F4EEFC',
    mutedText: '#BBABD4',
    background: '#120A1F',
    card: '#1E1231',
    border: '#36254F',
    outline: '#8F7FB0',
    // a lighter purple, readable on the dark page and still carrying white button text
    tint: '#8A3FE0',
    tintStrong: purpleDark,
    tintText: '#CDA8FF',
    danger: '#FF7A85',
    tabIconDefault: '#9C8CBA',
    tabIconSelected: '#CDA8FF',
  },
};

// Colours for the three place categories (card stripes and tags). They are the ends of the Saved folder
// gradients: Food red, Shopping purple, Fun blue.
export const CategoryColors = {
  food: '#D62839',
  shopping: '#7209B7',
  fun: '#3451D1',
};

// Deeper versions for tags and selected chips that have white text on them.
export const CategoryColorsStrong = {
  food: '#C42334',
  shopping: '#7209B7',
  fun: '#3451D1',
};
