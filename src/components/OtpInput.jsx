import { useRef, useEffect } from 'react'

export default function OtpInput({ value = '', onChange, length = 6, onComplete }) {
  const refs = useRef([])

  useEffect(() => { refs.current[0]?.focus() }, [])

  const digits = value.split('').concat(Array(length).fill('')).slice(0, length)

  const handleChange = (i, e) => {
    const v = e.target.value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = v
    const nextValue = next.join('')
    onChange(nextValue)
    if (v && i < length - 1) refs.current[i + 1]?.focus()
    if (v && i === length - 1 && next.every(d => d !== '')) {
      refs.current[i]?.blur()
      onComplete?.(nextValue)
    }
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (text) {
      const padded = text.padEnd(length, '').slice(0, length)
      onChange(padded)
      refs.current[Math.min(text.length, length - 1)]?.focus()
      if (text.length === length) onComplete?.(text)
    }
    e.preventDefault()
  }

  return (
    <div className="flex justify-center gap-2" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => refs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          className="otp-input"
        />
      ))}
    </div>
  )
}
