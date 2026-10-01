/**
 * Thin server-side HTTP helpers for Externa Public CMS API.
 *
 * Auth: optional `Authorization: Bearer ek_…`. Omit the key to use the `public` role.
 */

export class ExternaHttpError extends Error {
  readonly status: number;
  readonly path: string;

  constructor(status: number, path: string, detail: string) {
    super(`Externa ${status} ${path}${detail ? `: ${detail}` : ''}`);
    this.name = 'ExternaHttpError';
    this.status = status;
    this.path = path;
  }
}

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

/** Prefer short API `message`; never dump framework exception bodies. */
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
