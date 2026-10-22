// Phone number rules for sign-in: the countries we offer, tidying what the user types,
// checking it, and turning it into the international form ("+971501234567").

export interface Country {
  code: string; // two-letter country code, e.g. 'AE'
  name: string;
  dial: string; // e.g. '+971'
  digits: number; // how many digits a phone number has (without the country code and without a leading 0)
  starts?: RegExp; // what mobile numbers start with, when we know
}

// The United Arab Emirates comes first (our launch market). Add more countries here.
export const COUNTRIES: Country[] = [
  { code: 'AE', name: 'United Arab Emirates', dial: '+971', digits: 9, starts: /^5/ },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', digits: 9, starts: /^5/ },
  { code: 'QA', name: 'Qatar', dial: '+974', digits: 8, starts: /^[3567]/ },
  { code: 'KW', name: 'Kuwait', dial: '+965', digits: 8, starts: /^[569]/ },
  { code: 'BH', name: 'Bahrain', dial: '+973', digits: 8, starts: /^[36]/ },
  { code: 'OM', name: 'Oman', dial: '+968', digits: 8, starts: /^[79]/ },
  { code: 'IN', name: 'India', dial: '+91', digits: 10, starts: /^[6-9]/ },
  { code: 'PK', name: 'Pakistan', dial: '+92', digits: 10, starts: /^3/ },
  { code: 'GB', name: 'United Kingdom', dial: '+44', digits: 10, starts: /^7/ },
  { code: 'US', name: 'United States / Canada', dial: '+1', digits: 10 },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

// Keep only the digits.
export const digitsOnly = (text: string): string => text.replace(/\D/g, '');

// What we keep from typing: digits, and a leading 0 is dropped (many people type 050... in the UAE).
export function cleanNational(text: string): string {
  return digitsOnly(text).replace(/^0+/, '');
}

// Space the digits so they are easy to read. UAE: "50 123 4567". Others: groups of 3.
export function formatNational(country: Country, digits: string): string {
  const d = digitsOnly(digits);
  if (country.code === 'AE' && d.length > 0) {
    return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 9)].filter(Boolean).join(' ');
  }
  return d.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
}

// null = the number is fine. Otherwise a friendly message.
export function validatePhone(country: Country, digits: string): string | null {
  const d = cleanNational(digits);
  if (d.length === 0) return 'Enter your phone number.';
  const label = country.code === 'AE' ? 'UAE mobile number' : 'phone number';
  if (d.length !== country.digits || (country.starts && !country.starts.test(d))) {
    return `Enter a valid ${label}, like ${exampleNumber(country)}.`;
  }
  return null;
}

// An example to show in the box.
export function exampleNumber(country: Country): string {
  const examples: Record<string, string> = { AE: '50 123 4567', SA: '512 345 678', IN: '981 234 567 8', GB: '712 345 678 9', US: '555 123 456 7' };
  return examples[country.code] ?? formatNational(country, '5'.repeat(country.digits));
}

// "+971501234567"
export function toE164(country: Country, digits: string): string {
  return country.dial + cleanNational(digits);
}

// "+971 50 123 4567"
export function displayPhone(country: Country, digits: string): string {
  return `${country.dial} ${formatNational(country, cleanNational(digits))}`;
}

// Show a saved "+971501234567" nicely. Falls back to the number as it is.
export function displayFromE164(e164: string): string {
  const country = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length).find((c) => e164.startsWith(c.dial));
  return country ? displayPhone(country, e164.slice(country.dial.length)) : e164;
}
