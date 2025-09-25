export const env = {
  PHOTOS_LIVE: process.env.PHOTOS_LIVE === 'true',
  VIDEOS_LIVE: process.env.VIDEOS_LIVE === 'true',
} as const
