import { memo, useEffect, useState } from 'react'
import { resolveKey, placeholderName } from '../lib/identity'
import type { DisplayableIdentity } from '../lib/identity'
import { IdentityAvatar } from './IdentityAvatar'

interface Props {
  identityKey: string
  size?: number
  showName?: boolean
  suffix?: string
  stacked?: boolean
  /** Show abbreviated key under the display name */
  showKey?: boolean
  /** Render without the outer pill — for use inside another bordered container */
  embedded?: boolean
}

function AvatarChipInner ({
  identityKey,
  size = 32,
  showName = true,
  suffix,
  stacked = false,
  showKey = false,
  embedded = false,
}: Props) {
  const [loading, setLoading] = useState(true)
  const [identity, setIdentity] = useState<DisplayableIdentity | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    resolveKey(identityKey)
      .then(result => {
        if (!cancelled) {
          setIdentity(result)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [identityKey])

  const displayName = (identity?.name != null && identity.name !== '')
    ? identity.name
    : placeholderName(identityKey)
  const abbreviatedKey = identity?.abbreviatedKey ?? `${identityKey.slice(0, 6)}…${identityKey.slice(-4)}`
  const isPlaceholder = identity?.name == null || identity.name === ''

  const chipClass = embedded
    ? 'identity-chip__inner'
    : `identity-chip${showName ? '' : ' identity-chip--avatar-only'}`

  if (loading) {
    return (
      <span className={chipClass}>
        <span
          className="identity-avatar identity-avatar--loading"
          style={{ width: size, height: size }}
          aria-hidden
        />
        {showName && (
          <span className="identity-chip__text">
            <span className="shimmer identity-chip__name-skeleton" />
          </span>
        )}
      </span>
    )
  }

  const avatar = (
    <IdentityAvatar
      identityKey={identityKey}
      displayName={displayName}
      avatarURL={identity?.avatarURL}
      size={size}
      stacked={stacked}
      title={`${displayName} · ${abbreviatedKey}`}
    />
  )

  if (!showName) {
    return avatar
  }

  return (
    <span className={chipClass}>
      {avatar}
      <span className="identity-chip__text">
        <span className="identity-chip__name">
          {displayName}
          {suffix != null && suffix !== '' && (
            <span className="identity-chip__suffix">{suffix}</span>
          )}
        </span>
        {(showKey || isPlaceholder) && (
          <span className="identity-chip__key">{abbreviatedKey}</span>
        )}
        {identity?.badgeLabel != null && identity.badgeLabel !== '' && (
          <span className="identity-chip__badge">{identity.badgeLabel}</span>
        )}
      </span>
    </span>
  )
}

export const AvatarChip = memo(AvatarChipInner)