/**
 * Thin server-side client for Externa Public CMS API (`/api/v1`).
 *
 * Auth: optional `Authorization: Bearer ek_…`. Omit the key to use the `public` role.
 * Docs: https://docs.externa.qiick.io/docs/public-cms-api
 */

export type CollectionItem = {
  id: number;
  collection_id: number;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CollectionSummary = {
  id: number;
  name: string;
  slug: string;
  is_singleton: boolean;
  description?: string | null;
  status?: string;
  icon?: string | null;
  color?: string | null;
};

export type ConnectionProbe =
  | { ok: true; openapi: string | null; title: string | null }
  | { ok: false; message: string };

export type ResolvedCollection = {
  slug: string;
  source: 'env' | 'discovered';
  name?: string;
};

type ListResponse = {
  data: CollectionItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

type ItemResponse = {
  data: CollectionItem;
};

type CollectionsResponse = {
  data: CollectionSummary[];
};

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

function baseUrl(): string {
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

async function externaFetch<T>(path: string): Promise<T> {
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

/** Explicit slug from env, or `null` when unset (auto-discover). */
export function configuredCollectionSlug(): string | null {
  const slug = process.env.EXTERNA_COLLECTION?.trim();
  return slug ? slug : null;
}

export async function listCollections(): Promise<CollectionSummary[]> {
  const json = await externaFetch<CollectionsResponse>('/api/v1/collections');
  return json.data;
}

/** `true` when slug exists and actor may read it. */
export async function collectionReadable(slug: string): Promise<boolean> {
  try {
    await externaFetch<{ data: CollectionSummary }>(
      `/api/v1/collections/${encodeURIComponent(slug)}`,
    );
    return true;
  } catch (error) {
    if (error instanceof ExternaHttpError && (error.status === 404 || error.status === 403)) {
      return false;
    }
    throw error;
  }
}

/**
 * Always-public OpenAPI document — proves API reachability without a collection.
 * No API key required on the core route.
 */
export async function pingOpenApi(): Promise<ConnectionProbe> {
  try {
    const res = await fetch(`${baseUrl()}/api/v1/openapi.json`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) {
      return { ok: false, message: `OpenAPI HTTP ${res.status}` };
    }
    const json = (await res.json()) as {
      openapi?: unknown;
      info?: { title?: unknown };
    };
    return {
      ok: true,
      openapi: typeof json.openapi === 'string' ? json.openapi : null,
      title:
        typeof json.info?.title === 'string' ? json.info.title : null,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Use `EXTERNA_COLLECTION` when set; otherwise first readable collection
 * from `GET /api/v1/collections`. Returns `null` when none are readable.
 */
export async function resolveCollection(): Promise<ResolvedCollection | null> {
  const configured = configuredCollectionSlug();
  if (configured) {
    return { slug: configured, source: 'env' };
  }

  const collections = await listCollections();
  const first = collections[0];
  if (!first) {
    return null;
  }

  return {
    slug: first.slug,
    source: 'discovered',
    name: first.name,
  };
}

export async function listItems(
  slug: string,
  page = 1,
  perPage = 15,
): Promise<ListResponse> {
  const qs = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  return externaFetch<ListResponse>(
    `/api/v1/collections/${encodeURIComponent(slug)}/items?${qs}`,
  );
}

export async function getItem(
  slug: string,
  id: string | number,
): Promise<CollectionItem> {
  const json = await externaFetch<ItemResponse>(
    `/api/v1/collections/${encodeURIComponent(slug)}/items/${encodeURIComponent(String(id))}`,
  );
  return json.data;
}

/** Best-effort title from common field names; falls back to id. */
export function itemLabel(item: CollectionItem): string {
  const data = item.data ?? {};
  for (const key of ['title', 'name', 'slug', 'label']) {
    const value = data[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }
  return `Item #${item.id}`;
}

export function isMissingCollectionError(error: unknown): boolean {
  return error instanceof ExternaHttpError && error.status === 404;
}
