// Convert English time string "3:00 PM" to Arabic-Indic numerals "٣:٠٠ م"
export function formatTime(timeStr, lang) {
  if (!timeStr || lang !== 'ar') return timeStr
  return timeStr
    .replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d])
    .replace('AM', 'ص')
    .replace('PM', 'م')
}

// ── Booking status (mirrors the staff portal) ─────────────────
// Rasha runs on Khartoum time (UTC+3). A booking's slot is booking_date +
// booking_time ("2:00 PM"); "past" once that Khartoum moment has arrived.
export function slotIsPast(dateStr, timeStr) {
  const m = String(timeStr || '').match(/^(\d+):(\d+)\s*(AM|PM)$/i)
  if (!dateStr || !m) return false
  let h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  const pm = m[3].toUpperCase() === 'PM'
  if (pm && h !== 12) h += 12
  if (!pm && h === 12) h = 0
  const d = new Date(dateStr)
  if (isNaN(d)) return false
  const slotUtcMs = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h - 3, min)
  return Date.now() >= slotUtcMs
}

// Stored status is confirmed / scanned / cancelled (legacy 'completed' reads
// as scanned). "Booked" vs "No-show" is derived from confirmed + slot time.
export function bookingStatus(b) {
  const withColor = (key, color) => ({ key, color, bg: color + '1a', border: color + '59' })
  const RED = '#dc2626', GREEN = '#22c55e', AMBER = '#f59e0b'
  if (b?.status === 'cancelled') return withColor('cancelled', RED)
  if (b?.status === 'scanned' || b?.status === 'completed') return withColor('scanned', GREEN)
  if (slotIsPast(b?.booking_date, b?.booking_time)) return withColor('noshow', RED)
  return withColor('booked', AMBER)
}

export function bookingStatusLabel(key, t) {
  switch (key) {
    case 'booked':    return t('Booked', 'محجوز')
    case 'scanned':   return t('Scanned', 'تم المسح')
    case 'noshow':    return t('No-show', 'لم يحضر')
    case 'cancelled': return t('Cancelled', 'ملغى')
    default:          return key
  }
}
