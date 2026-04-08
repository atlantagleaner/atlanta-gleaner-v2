// Utility for executing operations with exponential backoff retry logic

export interface RetryOptions {
  maxRetries?: number
  initialDelayMs?: number
  label?: string
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 2,
  initialDelayMs: 1000,
  label: 'operation',
}

/**
 * Execute an operation with exponential backoff retry logic.
 * Useful for transient failures (network timeouts, rate limits, etc.)
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      console.log(`[${opts.label}] Attempt ${attempt}/${opts.maxRetries}`)
      const result = await operation()
      if (attempt > 1) {
        console.log(`[${opts.label}] ✓ Success after ${attempt} attempts`)
      }
      return result
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(
        `[${opts.label}] Attempt ${attempt} failed: ${lastError.message}`
      )

      if (attempt < opts.maxRetries) {
        const delayMs = opts.initialDelayMs * Math.pow(2, attempt - 1)
        console.log(`[${opts.label}] Retrying after ${delayMs}ms...`)
        await new Promise((r) => setTimeout(r, delayMs))
      }
    }
  }

  throw new Error(
    `[${opts.label}] Failed after ${opts.maxRetries} attempts: ${lastError?.message}`
  )
}
