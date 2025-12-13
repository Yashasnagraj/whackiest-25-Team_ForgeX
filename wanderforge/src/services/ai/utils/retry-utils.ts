// Retry Utility with Exponential Backoff
// Handles 429 rate limit errors and transient failures gracefully

export interface RetryConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  jitterMs?: number;
  retryableStatuses?: number[];
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

const DEFAULT_CONFIG: Required<Omit<RetryConfig, 'onRetry'>> = {
  maxRetries: 5,
  initialDelayMs: 500,
  maxDelayMs: 30000,
  backoffFactor: 2,
  jitterMs: 200,
  retryableStatuses: [429, 500, 502, 503, 504, 520, 521, 522, 523, 524],
};

export interface RetryError extends Error {
  status?: number;
  retryAfter?: number;
  isRetryable: boolean;
}

/**
 * Check if an error is a rate limit (429) or transient error that should be retried
 */
export function isRetryableError(error: unknown, retryableStatuses: number[] = DEFAULT_CONFIG.retryableStatuses): boolean {
  if (!error) return false;

  // Check for explicit status
  if (typeof error === 'object' && error !== null) {
    const err = error as { status?: number; message?: string };
    if (err.status && retryableStatuses.includes(err.status)) {
      return true;
    }
  }

  // Check error message for common rate limit patterns
  const errorStr = String(error);
  const rateLimitPatterns = [
    /429/i,
    /rate.?limit/i,
    /quota/i,
    /too.?many.?requests/i,
    /resource.?exhausted/i,
    /throttl/i,
    /exceeded/i,
    /capacity/i,
    /overloaded/i,
  ];

  return rateLimitPatterns.some(pattern => pattern.test(errorStr));
}

/**
 * Extract retry delay from response headers or error body
 */
export function extractRetryDelay(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;

  // Check for Retry-After header value (in seconds)
  const err = error as { retryAfter?: number | string; headers?: Record<string, string> };

  if (err.retryAfter) {
    const delay = typeof err.retryAfter === 'string'
      ? parseInt(err.retryAfter, 10) * 1000
      : err.retryAfter * 1000;
    return isNaN(delay) ? null : delay;
  }

  // Check error message for RetryInfo.retryDelay pattern (Google APIs)
  const errorStr = String(error);
  const retryInfoMatch = errorStr.match(/retry.?delay["\s:]+(\d+)/i);
  if (retryInfoMatch) {
    return parseInt(retryInfoMatch[1], 10);
  }

  return null;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  config: Required<Omit<RetryConfig, 'onRetry'>>,
  serverRetryDelay?: number | null
): number {
  // Respect server-provided retry delay if available
  if (serverRetryDelay && serverRetryDelay > 0) {
    // Add small jitter to server delay
    return Math.min(serverRetryDelay + Math.random() * config.jitterMs, config.maxDelayMs);
  }

  // Exponential backoff: initialDelay * (factor ^ attempt)
  const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffFactor, attempt);

  // Add random jitter to prevent thundering herd
  const jitter = Math.random() * config.jitterMs;

  // Cap at max delay
  return Math.min(exponentialDelay + jitter, config.maxDelayMs);
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper with exponential backoff
 *
 * @example
 * ```ts
 * const result = await retryWithBackoff(
 *   () => fetch('https://api.example.com/data'),
 *   { maxRetries: 3, onRetry: (attempt, err, delay) => console.log(`Retry ${attempt}...`) }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const { maxRetries, onRetry } = mergedConfig;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      const shouldRetry = attempt < maxRetries && isRetryableError(error, mergedConfig.retryableStatuses);

      if (!shouldRetry) {
        throw lastError;
      }

      // Calculate delay (prefer server-provided delay)
      const serverDelay = extractRetryDelay(error);
      const delayMs = calculateDelay(attempt, mergedConfig, serverDelay);

      // Notify about retry
      if (onRetry) {
        onRetry(attempt + 1, lastError, delayMs);
      }

      console.warn(
        `[Retry] Attempt ${attempt + 1}/${maxRetries} failed. ` +
        `Retrying in ${Math.round(delayMs)}ms... Error: ${lastError.message}`
      );

      // Wait before retrying
      await sleep(delayMs);
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

/**
 * Wrap a fetch call with retry logic, handling HTTP status codes properly
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryConfig: RetryConfig = {}
): Promise<Response> {
  return retryWithBackoff(async () => {
    const response = await fetch(url, options);

    // Check if response status is retryable
    if (!response.ok) {
      const isRetryable = (retryConfig.retryableStatuses || DEFAULT_CONFIG.retryableStatuses)
        .includes(response.status);

      if (isRetryable) {
        // Extract retry-after header if present
        const retryAfter = response.headers.get('Retry-After');
        const errorText = await response.text();

        const error = new Error(`HTTP ${response.status}: ${errorText}`) as RetryError;
        error.status = response.status;
        error.isRetryable = true;

        if (retryAfter) {
          error.retryAfter = parseInt(retryAfter, 10) * 1000;
        }

        throw error;
      }
    }

    return response;
  }, retryConfig);
}

/**
 * Circuit breaker state for a service
 */
interface CircuitState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
  halfOpenAttempts: number;
}

const circuitBreakers = new Map<string, CircuitState>();

const CIRCUIT_CONFIG = {
  failureThreshold: 5,
  resetTimeoutMs: 60000, // 1 minute
  halfOpenMaxAttempts: 2,
};

/**
 * Check if circuit is allowing requests
 */
export function isCircuitClosed(serviceId: string): boolean {
  const state = circuitBreakers.get(serviceId);

  if (!state) return true;
  if (!state.isOpen) return true;

  // Check if reset timeout has passed (move to half-open)
  if (Date.now() - state.lastFailure > CIRCUIT_CONFIG.resetTimeoutMs) {
    return true;
  }

  return false;
}

/**
 * Record a success for circuit breaker
 */
export function recordCircuitSuccess(serviceId: string): void {
  const state = circuitBreakers.get(serviceId);
  if (state) {
    state.failures = 0;
    state.isOpen = false;
    state.halfOpenAttempts = 0;
  }
}

/**
 * Record a failure for circuit breaker
 */
export function recordCircuitFailure(serviceId: string): void {
  let state = circuitBreakers.get(serviceId);

  if (!state) {
    state = { failures: 0, lastFailure: 0, isOpen: false, halfOpenAttempts: 0 };
    circuitBreakers.set(serviceId, state);
  }

  state.failures++;
  state.lastFailure = Date.now();

  if (state.failures >= CIRCUIT_CONFIG.failureThreshold) {
    state.isOpen = true;
    console.warn(`[CircuitBreaker] Circuit opened for ${serviceId} after ${state.failures} failures`);
  }
}

/**
 * Execute a function with circuit breaker protection
 */
export async function withCircuitBreaker<T>(
  serviceId: string,
  fn: () => Promise<T>,
  fallback?: () => T | Promise<T>
): Promise<T> {
  if (!isCircuitClosed(serviceId)) {
    console.warn(`[CircuitBreaker] Circuit is open for ${serviceId}`);
    if (fallback) {
      return fallback();
    }
    throw new Error(`Service ${serviceId} is temporarily unavailable (circuit open)`);
  }

  try {
    const result = await fn();
    recordCircuitSuccess(serviceId);
    return result;
  } catch (error) {
    recordCircuitFailure(serviceId);
    throw error;
  }
}
