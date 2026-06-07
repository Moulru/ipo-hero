import { useEffect, useState } from 'react'
import { onToast, type ToastMsg } from '../lib/juice'

export function ToastHost() {
  const [items, setItems] = useState<ToastMsg[]>([])
  useEffect(
    () =>
      onToast((t) => {
        setItems((x) => [...x, t])
        setTimeout(() => setItems((x) => x.filter((i) => i.id !== t.id)), 2600)
      }),
    [],
  )
  return (
    <div className="toast-host">
      {items.map((t) => (
        <div key={t.id} className="toast">
          {t.icon && <span className="toast-ic">{t.icon}</span>}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  )
}
