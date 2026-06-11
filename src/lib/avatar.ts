import { StorageDownloader, StorageUtils } from '@bsv/sdk/storage'

const downloader = new StorageDownloader()

/** Cache resolved avatar sources — null means "no usable image". */
const resolvedCache = new Map<string, string | null>()

export function keyHue (key: string): number {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) & 0xffffffff
  }
  return Math.abs(hash) % 360
}

/** UHRP content address (e.g. XUT…). */
export function isUhrpUrl (url: string): boolean {
  return StorageUtils.isValidURL(url.trim())
}

/** URL that can be used directly as an <img src>. */
export function isDirectImageUrl (url: string): boolean {
  const trimmed = url.trim()
  if (trimmed === '') return false
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) return true
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Whether we should try loading avatarURL at all.
 * Rejects bare filenames (profile.png), keys, and other non-URL strings.
 */
export function shouldAttemptAvatarLoad (url: string | undefined | null): boolean {
  if (url == null || url.trim() === '') return false
  return isDirectImageUrl(url) || isUhrpUrl(url)
}

/**
 * Resolve avatarURL to a browser-loadable image src.
 * UHRP addresses are looked up via overlay; direct http(s)/data URLs pass through.
 */
export async function resolveAvatarSrc (avatarURL: string): Promise<string | undefined> {
  const trimmed = avatarURL.trim()
  if (!shouldAttemptAvatarLoad(trimmed)) return undefined

  const cached = resolvedCache.get(trimmed)
  if (cached !== undefined) return cached ?? undefined

  if (isDirectImageUrl(trimmed)) {
    resolvedCache.set(trimmed, trimmed)
    return trimmed
  }

  if (isUhrpUrl(trimmed)) {
    try {
      const urls = await downloader.resolve(trimmed)
      const first = urls.find(u => u.trim() !== '')
      if (first != null) {
        resolvedCache.set(trimmed, first)
        return first
      }
    } catch {
      // fall through to null cache
    }
    resolvedCache.set(trimmed, null)
    return undefined
  }

  resolvedCache.set(trimmed, null)
  return undefined
}