import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCrowd } from '../hooks/useCrowd'
import { EscrowCard } from '../components/EscrowCard'
import { AvatarChip } from '../components/AvatarChip'
import type { EscrowState } from '../lib/store'

type EscrowEntry = [string, EscrowState]

function sortByNewest (entries: EscrowEntry[]): EscrowEntry[] {
  return [...entries].sort(([, a], [, b]) => b.invite.createdAt - a.invite.createdAt)
}

function EscrowGrid ({ entries, featured = false }: { entries: EscrowEntry[], featured?: boolean }) {
  if (entries.length === 0) return null

  return (
    <div className="dashboard-grid">
      {entries.map(([id, es]) => (
        <EscrowCard key={id} id={id} es={es} featured={featured} />
      ))}
    </div>
  )
}

export function Dashboard () {
  const { state, ownKey, clearEscrows } = useCrowd()
  const escrows = Object.entries(state.escrows)

  const { active, spent, cancelled } = useMemo(() => {
    const activeList: EscrowEntry[] = []
    const spentList: EscrowEntry[] = []
    const cancelledList: EscrowEntry[] = []

    for (const entry of escrows) {
      const status = entry[1].status
      if (status === 'active') activeList.push(entry)
      else if (status === 'spent') spentList.push(entry)
      else cancelledList.push(entry)
    }

    return {
      active: sortByNewest(activeList),
      spent: sortByNewest(spentList),
      cancelled: sortByNewest(cancelledList),
    }
  }, [escrows])

  // Two-tap confirm, armed per section
  const [clearArmed, setClearArmed] = useState<'cancelled' | 'spent' | null>(null)
  const clearResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleClear (status: 'cancelled' | 'spent', count: number) {
    if (count === 0) return

    if (clearArmed !== status) {
      setClearArmed(status)
      if (clearResetRef.current != null) clearTimeout(clearResetRef.current)
      clearResetRef.current = setTimeout(() => setClearArmed(null), 3000)
      return
    }

    if (clearResetRef.current != null) {
      clearTimeout(clearResetRef.current)
      clearResetRef.current = null
    }
    setClearArmed(null)
    clearEscrows(status)
  }

  return (
    <div className="page">
      <header className="page-header-bar">
        <Link to="/" className="grad-text page-wordmark" style={{ fontSize: 28 }}>
          Crowd
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {ownKey !== '' && (
            <AvatarChip identityKey={ownKey} size={30} showName suffix="(you)" />
          )}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('crowd:open-tour'))}
            className="btn btn-ghost"
            aria-label="Show guide"
            title="Show guide"
            style={{ minHeight: 36, width: 36, padding: 0, fontSize: 16, fontWeight: 700 }}
          >
            ?
          </button>
          {escrows.length > 0 && (
            <Link to="/new" className="btn fab-hide-mobile">
              + New escrow
            </Link>
          )}
        </div>
      </header>

      {escrows.length === 0 ? (
        <div className="panel empty-state">
          <div className="empty-state__icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M12 12L20 7.5M12 12V21M12 12L4 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="empty-state__title">No escrows yet</h2>
          <p className="empty-state__desc">
            Lock BSV into a shared multisig and coordinate releases with your team.
          </p>
          <Link to="/new" className="btn" style={{ marginTop: 8 }}>
            + New escrow
          </Link>
        </div>
      ) : (
        <div className="dashboard-sections">
          {active.length > 0 && (
            <section className="dashboard-section dashboard-section--active">
              <div className="dashboard-section__header">
                <div>
                  <h2 className="dashboard-section__title grad-text">Active</h2>
                  <p className="dashboard-section__desc">
                    Escrows with funds locked — proposals and signatures live here.
                  </p>
                </div>
              </div>
              <EscrowGrid entries={active} featured />
            </section>
          )}

          {active.length === 0 && (spent.length > 0 || cancelled.length > 0) && (
            <div className="panel dashboard-no-active">
              <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>No active escrows</p>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-dim)' }}>
                Create a new escrow or review completed ones below.
              </p>
              <Link to="/new" className="btn" style={{ marginTop: 14, minHeight: 40, fontSize: 14 }}>
                + New escrow
              </Link>
            </div>
          )}

          {spent.length > 0 && (
            <section className="dashboard-section dashboard-section--spent">
              <div className="dashboard-section__header">
                <div>
                  <h2 className="dashboard-section__title">Completed</h2>
                  <p className="dashboard-section__desc">Funds released via an approved proposal.</p>
                </div>
                <div className="dashboard-section__actions">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => handleClear('spent', spent.length)}
                    style={{ minHeight: 34, padding: '0 12px', fontSize: 12 }}
                  >
                    {clearArmed === 'spent'
                      ? `Confirm (${spent.length})`
                      : 'Clear all'}
                  </button>
                </div>
              </div>
              <EscrowGrid entries={spent} />
            </section>
          )}

          {cancelled.length > 0 && (
            <section className="dashboard-section dashboard-section--cancelled">
              <div className="dashboard-section__header">
                <div>
                  <h2 className="dashboard-section__title">Cancelled</h2>
                  <p className="dashboard-section__desc">Returned to the originator — safe to remove.</p>
                </div>
                <div className="dashboard-section__actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-danger"
                    onClick={() => handleClear('cancelled', cancelled.length)}
                    style={{ minHeight: 34, padding: '0 12px', fontSize: 12 }}
                  >
                    {clearArmed === 'cancelled'
                      ? `Confirm (${cancelled.length})`
                      : 'Remove all'}
                  </button>
                </div>
              </div>
              <EscrowGrid entries={cancelled} />
            </section>
          )}
        </div>
      )}

      {escrows.length > 0 && (
        <Link to="/new" className="fab" aria-label="New escrow">
          +
        </Link>
      )}
    </div>
  )
}