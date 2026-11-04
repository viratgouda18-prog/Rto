/**
 * Safe API Client for Karnataka RTO Document Management System
 * Handles JSON parsing safely, protects against HTML/proxy gateway responses (Cloud Run cold boot),
 * and provides retry logic for transient connection glitches.
 */

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number = 500, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface FetchJsonOptions extends RequestInit {
  retries?: number;
  retryDelayMs?: number;
  fallback?: any;
}

/**
 * Safely parse a response body as JSON.
 * Returns parsed object or fallback if response is HTML/malformed/empty.
 */
export async function safeParseJson<T = any>(res: Response, fallback?: T): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  
  // Read body text first
  let text = '';
  try {
    text = await res.text();
  } catch (readErr) {
    if (fallback !== undefined) return fallback;
    throw new ApiError('Unable to read server response', res.status);
  }

  // If body is empty
  if (!text || text.trim() === '') {
    if (fallback !== undefined) return fallback;
    return {} as T;
  }

  const trimmed = text.trim();

  // If response starts with HTML tag or plain text (e.g. "The page cannot...", "<!doctype...", "<html>")
  const isHtmlOrText =
    trimmed.startsWith('<') ||
    trimmed.startsWith('The page') ||
    trimmed.startsWith('Cannot ') ||
    !contentType.includes('application/json');

  if (isHtmlOrText && !trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    console.warn(`[apiClient] Received non-JSON response from ${res.url} (${res.status}): ${trimmed.slice(0, 100)}`);
    if (fallback !== undefined) {
      return fallback;
    }
    if (!res.ok) {
      throw new ApiError(`Service temporarily unavailable (${res.status}). Please try again shortly.`, res.status);
    }
    throw new ApiError('Received invalid response from server. Please try again.', res.status);
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch (parseErr: any) {
    console.warn(`[apiClient] JSON.parse error on response: ${trimmed.slice(0, 100)}`);
    if (fallback !== undefined) {
      return fallback;
    }
    throw new ApiError('Failed to parse server data. Please try again.', res.status);
  }
}

/**
 * Perform a fetch and safely extract JSON, handling gateway cold boot errors (e.g. 502/503/504 HTML)
 */
export async function fetchJson<T = any>(
  url: string,
  options: FetchJsonOptions = {}
): Promise<T> {
  const { retries = 2, retryDelayMs = 1000, fallback, ...fetchOptions } = options;

  let attempt = 0;
  let lastError: any = null;

  while (attempt <= retries) {
    try {
      const res = await fetch(url, fetchOptions);

      // Handle transient server errors (502, 503, 504) with retry
      if ([502, 503, 504].includes(res.status) && attempt < retries) {
        attempt++;
        await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
        continue;
      }

      if (!res.ok) {
        // Attempt to extract json error message safely
        let errorMsg = `Request failed with status ${res.status}`;
        try {
          const errData = await safeParseJson<any>(res, null);
          if (errData && typeof errData === 'object') {
            if (errData.error) errorMsg = errData.error;
            else if (errData.message) errorMsg = errData.message;
          }
        } catch {
          // ignore error parsing error
        }
        if (fallback !== undefined) {
          console.warn(`[apiClient] ${url} failed with ${res.status}, returning fallback.`);
          return fallback;
        }
        throw new ApiError(errorMsg, res.status);
      }

      return await safeParseJson<T>(res, fallback);
    } catch (err: any) {
      lastError = err;
      if (attempt < retries) {
        attempt++;
        await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
        continue;
      }
      break;
    }
  }

  if (fallback !== undefined) {
    return fallback;
  }
  throw lastError || new ApiError('Network request failed');
}
