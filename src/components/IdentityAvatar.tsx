import { memo, useEffect, useState } from 'react'
import { keyHue, resolveAvatarSrc, shouldAttemptAvatarLoad } from '../lib/avatar'

interface Props {
  identityKey: string
  displayName: string
  avatarURL?: string
  size?: number
  stacked?: boolean
  title?: string
}

interface AvatarShellProps {
  identityKey: string
  displayName: string
  size: number
  stacked: boolean
  title: string
  children?: React.ReactNode
  loading?: boolean
}

function AvatarShell ({
  identityKey,
  displayName,
  size,
  stacked,
  title,
  children,
  loading = false,
}: AvatarShellProps) {
  const hue = keyHue(identityKey)
  const initial = displayName[0]?.toUpperCase() ?? '?'

  const className = [
    'identity-avatar',
    stacked ? 'identity-avatar--stacked' : '',
    loading ? 'identity-avatar--loading' : '',
  ].filter(Boolean).join(' ')

  const style: React.CSSProperties = {
    width: size,
    height: size,
    fontSize: size * 0.38,
    ['--avatar-hue' as string]: String(hue),
  }

  return (
    <span className={className} style={style} title={title}>
      {loading ? null : (children ?? (
        <span className="identity-avatar__initial" aria-hidden>{initial}</span>
      ))}
    </span>
  )
}

function ResolvedAvatar ({
  avatarURL,
  identityKey,
  displayName,
  size = 32,
  stacked = false,
  title,
}: Props & { avatarURL: string }) {
  const [src, setSrc] = useState<string | undefined>()
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    resolveAvatarSrc(avatarURL)
      .then(resolved => {
        if (cancelled) return
        if (resolved == null) {
          setFailed(true)
        } else {
          setSrc(resolved)
        }
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [avatarURL])

  if (loading) {
    return (
      <AvatarShell
        identityKey={identityKey}
        displayName={displayName}
        size={size}
        stacked={stacked}
        title={title ?? identityKey}
        loading
      />
    )
  }

  if (failed || src == null) {
    return (
      <AvatarShell
        identityKey={identityKey}
        displayName={displayName}
        size={size}
        stacked={stacked}
        title={title ?? identityKey}
      />
    )
  }

  return (
    <AvatarShell
      identityKey={identityKey}
      displayName={displayName}
      size={size}
      stacked={stacked}
      title={title ?? identityKey}
    >
      <img
        className="identity-avatar__img"
        src={src}
        alt=""
        draggable={false}
        onError={() => setFailed(true)}
      />
    </AvatarShell>
  )
}

function IdentityAvatarInner ({
  identityKey,
  displayName,
  avatarURL,
  size = 32,
  stacked = false,
  title,
}: Props) {
  const tooltip = title ?? identityKey

  if (!shouldAttemptAvatarLoad(avatarURL)) {
    return (
      <AvatarShell
        identityKey={identityKey}
        displayName={displayName}
        size={size}
        stacked={stacked}
        title={tooltip}
      />
    )
  }

  return (
    <ResolvedAvatar
      key={avatarURL}
      identityKey={identityKey}
      displayName={displayName}
      avatarURL={avatarURL!}
      size={size}
      stacked={stacked}
      title={tooltip}
    />
  )
}

export const IdentityAvatar = memo(IdentityAvatarInner)