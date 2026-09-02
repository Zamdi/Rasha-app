/**
 * Shared phone handling for Register, Login, and Settings.
 *
 * Before this, each page duplicated its own "strip the dial code" logic, and
 * Settings didn't do it at all — it hardcoded '+249', so saving a profile
 * whose phone was actually +20... (or any non-Sudan country) silently
 * rewrote it to +249<same digits>, corrupting a real phone number the moment
 * the customer saved anything, even just their name.
 */
import { COUNTRIES } from '../components/PhoneInput'

/** Build an E.164 number from a dial code and the digits typed after it. */
export function buildE164(dialCode, nationalDigits) {
  let p = String(nationalDigits || '').replace(/\D/g, '')
  if (p.startsWith('00')) p = p.slice(2)
  const dialDigits = dialCode.replace('+', '')
  if (p.startsWith(dialDigits)) p = p.slice(dialDigits.length)
  if (p.startsWith('0')) p = p.slice(1)
  return dialCode + p
}

/**
 * Split a stored E.164 number back into { dialCode, national } by matching
 * the longest known dial prefix. Longest-first, because +216 (Tunisia) is a
 * prefix of no other entry here, but shorter codes like +2 don't exist —
 * still, matching longest-first is the only correct order in general (e.g.
 * +1 vs a hypothetical +12) and costs nothing to do properly.
 */
export function splitE164(fullPhone) {
  const raw = String(fullPhone || '').trim()
  if (!raw) return { dialCode: '+249', national: '' }
  const byLength = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)
  const match = byLength.find(c => raw.startsWith(c.dial))
  if (!match) return { dialCode: '+249', national: raw.replace(/\D/g, '') }
  return { dialCode: match.dial, national: raw.slice(match.dial.length).replace(/\D/g, '') }
}

/** Country metadata for a dial code, falling back to Sudan. */
export function countryFor(dialCode) {
  return COUNTRIES.find(c => c.dial === dialCode) || COUNTRIES[0]
}

/**
 * Whether `nationalDigits` is a plausible length for the given country.
 * Lengths are the national significant number — digits after the dial code,
 * with no leading trunk zero. Kept as a min/max range rather than one exact
 * figure since real numbering plans vary within a country; still narrow
 * enough to catch "3 digits" or "20 digits", which is what was reported.
 */
export function isPlausibleLength(dialCode, nationalDigits) {
  const { min, max } = countryFor(dialCode).len
  let digits = String(nationalDigits || '').replace(/\D/g, '')
  if (digits.startsWith('0')) digits = digits.slice(1)
  const n = digits.length
  return n >= min && n <= max
}
