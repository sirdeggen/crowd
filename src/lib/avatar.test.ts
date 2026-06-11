import { describe, expect, it } from 'vitest'
import {
  isDirectImageUrl,
  isUhrpUrl,
  keyHue,
  shouldAttemptAvatarLoad,
} from './avatar'

describe('avatar utilities', () => {
  it('keyHue is deterministic', () => {
    expect(keyHue('02abc')).toBe(keyHue('02abc'))
    expect(keyHue('02abc')).not.toBe(keyHue('02abd'))
  })

  it('isDirectImageUrl accepts http(s) and data URLs', () => {
    expect(isDirectImageUrl('https://example.com/a.jpg')).toBe(true)
    expect(isDirectImageUrl('http://cdn.test/photo.png')).toBe(true)
    expect(isDirectImageUrl('data:image/png;base64,abc')).toBe(true)
  })

  it('isDirectImageUrl rejects bare filenames and keys', () => {
    expect(isDirectImageUrl('profile.png')).toBe(false)
    expect(isDirectImageUrl('discord-photo.png')).toBe(false)
    expect(isDirectImageUrl('02' + 'a'.repeat(64))).toBe(false)
  })

  it('isUhrpUrl accepts valid UHRP addresses', () => {
    expect(isUhrpUrl('XUT6PqWb3GP3LR7dmBMCJwZ3oo5g1iGCF3CrpzyuJCemkGu1WGoq')).toBe(true)
  })

  it('isUhrpUrl rejects non-UHRP strings', () => {
    expect(isUhrpUrl('profile.png')).toBe(false)
    expect(isUhrpUrl('https://example.com/x.jpg')).toBe(false)
  })

  it('shouldAttemptAvatarLoad covers direct and UHRP only', () => {
    expect(shouldAttemptAvatarLoad('https://x.com/a.png')).toBe(true)
    expect(shouldAttemptAvatarLoad('XUT6PqWb3GP3LR7dmBMCJwZ3oo5g1iGCF3CrpzyuJCemkGu1WGoq')).toBe(true)
    expect(shouldAttemptAvatarLoad('avatar.png')).toBe(false)
    expect(shouldAttemptAvatarLoad('')).toBe(false)
    expect(shouldAttemptAvatarLoad(undefined)).toBe(false)
  })
})