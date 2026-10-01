/**
 * Thin server-side HTTP helpers for Externa Public CMS API.
 *
 * Auth: optional `Authorization: Bearer ek_…`. Omit the key to use the `public` role.
 */

/**
 * HTTP failure from the Public CMS API, with status and request path.
 */
export class ExternaHttpError extends Error {
  readonly status: number;
  readonly path: string;

  /**
   * @param status - HTTP status code from the response
   * @param path - Request path relative to the API base URL
   * @param detail - Short human-readable error detail (never a full framework dump)
   */
  constructor(status: number, path: string, detail: string) {
    super(`Externa ${status} ${path}${detail ? `: ${detail}` : ''}`);
    this.name = 'ExternaHttpError';
    this.status = status;
    this.path = path;
  }
}

/**
 * Resolve the Externa API base URL from `EXTERNA_API_URL` (trailing slash stripped).
 *
 * @returns Absolute base URL without a trailing slash
 * @throws {Error} When `EXTERNA_API_URL` is unset or empty
 */
export function baseUrl(): string {
  const url = process.env.EXTERNA_API_URL?.replace(/\/$/, '');
  if (!url) {
    throw new Error('Set EXTERNA_API_URL (e.g. http://externa-core.test)');
  }
  return url;
}

function headers(): HeadersInit {
  const h: Record<string, string> = { Accept: 'application/json' };
  const key = process.env.EXTERNA_API_KEY?.trim();
  if (key) {
    h.Authorization = `Bearer ${key}`;
  }
  return h;
}

/**
 * Prefer short API `message`; never dump framework exception bodies.
 *
 * @param body - Raw response body text
 * @param status - HTTP status used when no usable message is present
 * @returns Concise detail suitable for UI and thrown errors
 */
export function shortApiDetail(body: string, status: number): string {
  const trimmed = body.trim();
  if (!trimmed) {
    return `HTTP ${status}`;
  }
  try {
    const parsed = JSON.parse(trimmed) as { message?: unknown };
    if (typeof parsed.message === 'string' && parsed.message.trim() !== '') {
      return parsed.message.trim();
    }
    // Empty message (Laravel abort(404) often) — keep status only.
    if (
      parsed &&
      typeof parsed === 'object' &&
      Object.prototype.hasOwnProperty.call(parsed, 'message')
    ) {
      return `HTTP ${status}`;
    }
  } catch {
    // non-JSON
  }
  if (trimmed.includes('NotFoundHttpException') || trimmed.includes('exception')) {
    return `HTTP ${status}`;
  }
  return trimmed.slice(0, 120);
}

/**
 * Authenticated JSON GET against the Public CMS API (`cache: 'no-store'`).
 *
 * @typeParam T - Expected JSON response shape
 * @param path - Path beginning with `/api/v1/…`, relative to {@link baseUrl}
 * @returns Parsed JSON body as `T`
 * @throws {ExternaHttpError} When the response is not OK
 */
export async function externaFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    headers: headers(),
    // Always fresh from CMS while iterating locally.
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text();
    throw new ExternaHttpError(res.status, path, shortApiDetail(body, res.status));
  }

  return res.json() as Promise<T>;
}
