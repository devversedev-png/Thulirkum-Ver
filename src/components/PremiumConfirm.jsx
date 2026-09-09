import { useEffect, useState } from 'react'

export default function PremiumConfirm({ dialog, onClose }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setBusy(false); setError('') }, [dialog])

  if (!dialog) return null

  async function confirm() {
    if (busy) return
    try {
      setBusy(true)
      setError('')
      await dialog.onConfirm?.()
      onClose?.()
    } catch (err) {
      setError(err?.message || 'Unable to complete this action right now.')
      setBusy(false)
    }
  }

  return (
    <div className="premium-confirm-backdrop-v73" onMouseDown={() => !busy && onClose?.()}>
      <section className={`premium-confirm-v73 ${dialog.tone || ''}`} role="alertdialog" aria-modal="true" onMouseDown={event => event.stopPropagation()}>
        <div className="premium-confirm-icon-v73" aria-hidden="true">
          {dialog.tone === 'danger' ? '!' : dialog.tone === 'success' ? '↻' : '?'}
        </div>
        <div className="premium-confirm-copy-v73">
          <span>{dialog.eyebrow || 'CONFIRM ACTION'}</span>
          <h3>{dialog.title}</h3>
          <p>{dialog.message}</p>
        </div>
        {error && <div className="premium-confirm-error-v73">{error}</div>}
        <div className="premium-confirm-actions-v73">
          <button type="button" className="premium-confirm-cancel-v73" onClick={() => onClose?.()} disabled={busy}>Keep as is</button>
          <button type="button" className="premium-confirm-submit-v73" onClick={confirm} disabled={busy}>{busy ? 'Working...' : dialog.confirmLabel || 'Confirm'}</button>
        </div>
      </section>
    </div>
  )
}
