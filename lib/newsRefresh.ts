export const LIVE_CACHE_KEY = 'news_cache_live'
export const PREVIOUS_CACHE_KEY = 'news_cache_previous'
export const BACKUP_CACHE_KEY = 'news_cache_backup'
export const STAGED_CACHE_KEY = 'news_cache_staged'
export const STATUS_CACHE_KEY = 'news_refresh_status'
export const PREPARE_DELAY_MS = 1500

export interface RefreshFailure {
  title: string
  url: string
  source: string
  error: string
}

export interface RefreshStatus {
  phase: 'prepare' | 'publish'
  preparedAt?: string
  publishedAt?: string
  failures: RefreshFailure[]
  omittedFailures?: number
  counts: {
    selected: number
    failures: number
  }
}
