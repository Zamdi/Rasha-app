// Convert English time string "3:00 PM" to Arabic-Indic numerals "٣:٠٠ م"
export function formatTime(timeStr, lang) {
  if (!timeStr || lang !== 'ar') return timeStr
  return timeStr
    .replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d])
    .replace('AM', 'ص')
    .replace('PM', 'م')
}
