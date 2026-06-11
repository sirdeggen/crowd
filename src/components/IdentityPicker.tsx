import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { searchIdentities, placeholderName } from '../lib/identity'
import type { DisplayableIdentity } from '../lib/identity'
import { AvatarChip } from './AvatarChip'

interface Props {
  selected: DisplayableIdentity[]
  onChange: (sel: DisplayableIdentity[]) => void
  excludeKeys?: string[]
  single?: boolean
}

const KEY_RE = /^(02|03)[0-9a-fA-F]{64}$/

function isDirectKey (val: string): boolean {
  return KEY_RE.test(val.trim())
}

function SearchIcon () {
  return (
    <svg className="identity-picker-search-icon" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function IdentityPicker ({ selected, onChange, excludeKeys = [], single = false }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DisplayableIdentity[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seqRef = useRef(0)

  const excludeSet = new Set([
    ...excludeKeys,
    ...selected.map(s => s.identityKey),
  ])

  useEffect(() => {
    setActiveIndex(-1)
  }, [results])

  useEffect(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current)

    const trimmed = query.trim()

    if (isDirectKey(trimmed)) {
      setResults([])
      setSearching(false)
      setOpen(true)
      return
    }

    if (trimmed.length < 2) {
      setResults([])
      setSearching(false)
      setOpen(false)
      return
    }

    setSearching(true)
    setOpen(true)

    timerRef.current = setTimeout(async () => {
      const seq = ++seqRef.current
      try {
        const hits = await searchIdentities(trimmed)
        if (seq !== seqRef.current) return
        setResults(hits.filter(h => !excludeSet.has(h.identityKey)))
      } catch {
        if (seq !== seqRef.current) return
        setResults([])
      } finally {
        if (seq === seqRef.current) setSearching(false)
      }
    }, 300)

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
      seqRef.current++
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  useEffect(() => {
    function handlePointerDown (e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  const addIdentity = useCallback((id: DisplayableIdentity) => {
    if (single) {
      onChange([id])
    } else {
      onChange([...selected, id])
    }
    setQuery('')
    setOpen(false)
    setResults([])
    inputRef.current?.focus()
  }, [single, selected, onChange])

  const addByKey = useCallback((key: string) => {
    const synth: DisplayableIdentity = {
      identityKey: key,
      name: placeholderName(key),
      avatarURL: '',
      abbreviatedKey: `${key.slice(0, 6)}…${key.slice(-4)}`,
      badgeIconURL: '',
      badgeLabel: '',
      badgeClickURL: '',
    }
    addIdentity(synth)
  }, [addIdentity])

  const removeIdentity = useCallback((key: string) => {
    onChange(selected.filter(s => s.identityKey !== key))
  }, [selected, onChange])

  function handleKeyDown (e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, -1))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmed = query.trim()
      if (isDirectKey(trimmed) && !excludeSet.has(trimmed)) {
        addByKey(trimmed)
        return
      }
      if (results.length > 0) {
        const target = activeIndex >= 0 ? results[activeIndex] : results[0]
        addIdentity(target)
      }
    }
  }

  const trimmedQuery = query.trim()
  const showDirectAdd = isDirectKey(trimmedQuery) && !excludeSet.has(trimmedQuery)

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div className="identity-picker-input-wrap">
        <SearchIcon />
        <input
          ref={inputRef}
          className="input"
          placeholder="Search by name, email, or paste a key…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2 || isDirectKey(query.trim())) setOpen(true)
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
          style={{ paddingRight: searching ? 40 : 14 }}
          aria-label="Search identities"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        {searching && (
          <span
            className="spinner"
            style={{
              position: 'absolute',
              right: 12,
              width: 16,
              height: 16,
              borderWidth: 2,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {open && (
        <div className="panel identity-picker-dropdown" role="listbox">
          {showDirectAdd && (
            <button
              type="button"
              className="ip-row"
              onClick={() => addByKey(trimmedQuery)}
            >
              <AvatarChip identityKey={trimmedQuery} size={32} showName showKey />
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text-dim)' }}>
                Add by key
              </span>
              <span className="ip-row-add">Add</span>
            </button>
          )}

          {!showDirectAdd && results.length === 0 && !searching && (
            <div className="identity-picker-empty">
              No matches found.<br />
              Paste a full identity key to add directly.
            </div>
          )}

          {results.map((id, idx) => (
            <button
              key={id.identityKey}
              type="button"
              role="option"
              aria-selected={idx === activeIndex}
              className={`ip-row${idx === activeIndex ? ' ip-row-active' : ''}`}
              onClick={() => addIdentity(id)}
            >
              <AvatarChip identityKey={id.identityKey} size={32} showName />
              <span className="ip-row-add">Add</span>
            </button>
          ))}
        </div>
      )}

      {!single && selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {selected.map(s => (
            <span key={s.identityKey} className="identity-chip identity-chip--actionable">
              <AvatarChip identityKey={s.identityKey} size={26} showName embedded />
              <button
                type="button"
                className="identity-chip__remove"
                onClick={() => removeIdentity(s.identityKey)}
                aria-label={`Remove ${s.name || s.identityKey}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}