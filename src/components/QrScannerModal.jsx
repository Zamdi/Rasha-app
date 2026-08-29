import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

/**
 * Full-screen QR scanner modal.
 * onScan(text) is called once when a code is decoded.
 * onClose() dismisses without a result.
 */
export default function QrScannerModal({ onScan, onClose }) {
  const scannerRef = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (text) => {
        scanner.stop().catch(() => {})
        onScan(text)
      },
      () => {} // ignore per-frame errors
    ).catch(err => {
      setError('Camera access denied. Please allow camera permission and try again.')
      console.error('[QR]', err)
    })

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: '12px' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
        </button>
        <p style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>Scan Member QR</p>
      </div>

      {/* Scanner viewport */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
        {error ? (
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'rgba(255,255,255,0.4)' }}>no_photography</span>
            <p style={{ marginTop: '16px', fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{error}</p>
          </div>
        ) : (
          <>
            <div id="qr-reader" style={{ width: '100%', maxWidth: '320px', borderRadius: '16px', overflow: 'hidden' }} />
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', marginTop: '20px', textAlign: 'center' }}>
              Point the camera at the recipient's QR code
            </p>
          </>
        )}
      </div>
    </div>
  )
}
