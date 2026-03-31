/** Preset join URLs when the meeting platform matches form options. */
export const VIRTUAL_PLATFORM_LINKS = {
  Zoom: 'https://us05web.zoom.us/j/86735745476?pwd=AXkaHREEaHuw9V3lmBpDYr77HGc7Lk.1',
  'Google Meet': 'https://meet.google.com/dof-uxqa-cep',
  'Microsoft Teams':
    'https://teams.microsoft.com/meet/49287717605570?p=g9GHyPKTjD4PYKhMm6',
} as const

export function getPresetVirtualPlatformLink(
  platform: string | null | undefined
): string | null {
  if (!platform || !(platform in VIRTUAL_PLATFORM_LINKS)) return null
  return VIRTUAL_PLATFORM_LINKS[platform as keyof typeof VIRTUAL_PLATFORM_LINKS]
}

export function resolveVirtualJoinUrl(meeting: {
  platform: string | null
  link: string | null
}): string | null {
  const stored = meeting.link?.trim()
  if (stored) return stored
  return getPresetVirtualPlatformLink(meeting.platform)
}
