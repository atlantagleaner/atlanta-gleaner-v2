// Utility for fetch with timeout and better error handling

export interface FetchWithTimeoutOptions extends RequestInit {
  timeoutMs: number
  label?: string
}

/**
 * Fetch with timeout. Automatically aborts if request takes too long.
 * Prevents hanging requests that block the entire feed build.
 */
export async function fetchWithTimeout(
  url: string | URL,
  options: FetchWithTimeoutOptions
): Promise<Response> {
  const { timeoutMs, label = 'request', ...fetchOptions } = options
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    console.warn(`[fetchWithTimeout] Timeout (${timeoutMs}ms) for ${label}`)
    controller.abort()
  }, timeoutMs)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout (${timeoutMs}ms) for ${label}`)
    }
    throw error
  }
}

// Standard timeout values for different API types
export const FETCH_TIMEOUTS = {
  SERPER: 10_000, // 10s for news search
  YOUTUBE: 15_000, // 15s for YouTube API
  SPOTIFY: 20_000, // 20s for Spotify API
  READER: 8_000, // 8s for article reader
} as const
