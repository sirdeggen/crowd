import type { ReactNode } from 'react'
import { useCrowd } from '../hooks/useCrowd'

interface Props { children: ReactNode }

export function WalletGate ({ children }: Props) {
  const { ready, mbxError, refresh } = useCrowd()

  if (!ready) {
    return (
      <div className="wallet-gate">
        <h1 className="wallet-gate__logo grad-text">Crowd</h1>
        <div className="wallet-gate__ring">
          <div className="spinner" aria-label="Loading" />
        </div>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>Waiting for your BSV wallet…</p>
        <p className="wallet-gate__hint">
          Connect a BRC-100 wallet such as Metanet Desktop to create and manage escrows.
        </p>
      </div>
    )
  }

  return (
    <>
      {mbxError != null && (
        <div className="mbx-banner">
          <span>Relay unreachable — showing cached state</span>
          <button className="btn" style={{ minHeight: 32, padding: '0 14px', fontSize: 13 }} onClick={() => { void refresh() }}>
            Retry
          </button>
        </div>
      )}
      {children}
    </>
  )
}