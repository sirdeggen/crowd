import { useEffect, useState, useCallback } from 'react'

const TOUR_KEY = 'crowd_tour_completed'

interface Step {
  title: string
  body: string
  hint?: string
}

const steps: Step[] = [
  {
    title: 'Welcome to Crowd',
    body: 'Lock BSV into an on-chain N-of-M multisig escrow. Multiple trusted controllers must agree before the funds can move. Everything is coordinated through encrypted peer-to-peer messages — no backend required.',
  },
  {
    title: 'Create an escrow',
    body: 'From the dashboard, tap "+ New escrow". Give it a name, enter the amount in satoshis, add other controllers by searching their identities, and set the threshold (how many signatures are required out of the total group).',
    hint: 'You are always included as a controller. Maximum 10 people total.',
  },
  {
    title: 'Funds lock on-chain',
    body: 'Your BRC-100 wallet (Metanet Desktop or similar) creates the escrow output using a custom multisig script. The money is truly locked until the threshold is met or you cancel.',
  },
  {
    title: 'Invite controllers',
    body: 'After creation you get a shareable link. Send it to the group. Controllers also receive an automatic encrypted invite in their MessageBox inbox so they can participate even without the link.',
  },
  {
    title: 'Propose transfers',
    body: 'Inside any active escrow, any controller can tap "New transfer". Choose a recipient (by identity or raw BSV address), write a short note, and submit. You automatically sign your own proposals.',
  },
  {
    title: 'Collect signatures & release',
    body: 'Proposals appear for everyone. Controllers can Sign or Veto. A circular progress ring shows how many valid signatures have been collected. Once the threshold is reached, anyone (usually the proposer) can finalize and broadcast the spend.',
  },
  {
    title: 'Cancel or complete',
    body: 'As the originator you can unilaterally cancel any active escrow at any time to recover the funds. Completed escrows show the final on-chain transaction. All coordination messages are end-to-end encrypted.',
  },
]

export function OnboardingTour () {
  const [open, setOpen] = useState(() => localStorage.getItem(TOUR_KEY) !== 'true')
  const [stepIndex, setStepIndex] = useState(0)

  const currentStep = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1
  const progress = ((stepIndex + 1) / steps.length) * 100

  // Event listener to allow re-opening the tour from the ? button etc.
  useEffect(() => {
    const openHandler = () => {
      localStorage.removeItem(TOUR_KEY)
      setStepIndex(0)
      setOpen(true)
    }
    window.addEventListener('crowd:open-tour', openHandler)
    return () => window.removeEventListener('crowd:open-tour', openHandler)
  }, [])

  const closeAndComplete = useCallback(() => {
    localStorage.setItem(TOUR_KEY, 'true')
    setOpen(false)
  }, [])

  const goNext = useCallback(() => {
    if (isLast) {
      closeAndComplete()
    } else {
      setStepIndex(i => i + 1)
    }
  }, [isLast, closeAndComplete])

  const goPrev = useCallback(() => {
    setStepIndex(i => Math.max(0, i - 1))
  }, [])

  const skip = useCallback(() => {
    closeAndComplete()
  }, [closeAndComplete])

  // Keyboard support
  useEffect(() => {
    if (!open) return

    function onKey (e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeAndComplete()
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, goNext, goPrev, closeAndComplete])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crowd walkthrough"
      onClick={closeAndComplete}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(6, 10, 20, 0.82)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'var(--bg-raise)',
          border: '1px solid var(--panel-border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px 12px',
            borderBottom: '1px solid var(--panel-border)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
            HOW TO USE CROWD
          </div>
          <button
            type="button"
            onClick={closeAndComplete}
            aria-label="Close tour"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              fontSize: 22,
              lineHeight: 1,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            ×
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: 'var(--panel-border)' }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'var(--grad)',
              transition: 'width 0.2s ease',
            }}
          />
        </div>

        {/* Content */}
        <div style={{ padding: '28px 24px 20px' }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 26,
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: 14,
            }}
          >
            {currentStep.title}
          </div>

          <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--text)', margin: 0 }}>
            {currentStep.body}
          </p>

          {currentStep.hint && (
            <p
              style={{
                marginTop: 14,
                fontSize: 13,
                color: 'var(--accent)',
                background: 'rgba(56,224,255,0.08)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                display: 'inline-block',
              }}
            >
              {currentStep.hint}
            </p>
          )}
        </div>

        {/* Step dots */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
            paddingBottom: 8,
          }}
        >
          {steps.map((_, idx) => (
            <div
              key={idx}
              style={{
                width: idx === stepIndex ? 18 : 6,
                height: 6,
                borderRadius: 999,
                background: idx === stepIndex ? 'var(--accent)' : 'var(--panel-border)',
                transition: 'all 0.15s ease',
              }}
            />
          ))}
        </div>

        {/* Footer actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: 18,
            borderTop: '1px solid var(--panel-border)',
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          <button
            type="button"
            onClick={skip}
            className="btn btn-ghost"
            style={{ minHeight: 40, padding: '0 16px', fontSize: 13 }}
          >
            Skip tour
          </button>

          <div style={{ flex: 1 }} />

          {stepIndex > 0 && (
            <button
              type="button"
              onClick={goPrev}
              className="btn btn-ghost"
              style={{ minHeight: 40, padding: '0 18px', fontSize: 14 }}
            >
              Back
            </button>
          )}

          <button
            type="button"
            onClick={goNext}
            className="btn"
            style={{ minHeight: 40, padding: '0 22px', fontSize: 14, fontWeight: 600 }}
          >
            {isLast ? 'Done' : 'Next'}
          </button>
        </div>

        {/* Tiny footer hint */}
        <div style={{ textAlign: 'center', paddingBottom: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            Use ← → keys or click buttons
          </span>
        </div>
      </div>
    </div>
  )
}
