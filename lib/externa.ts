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

async function externaFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    headers: headers(),
    // Always fresh from CMS while iterating locally.
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Externa ${res.status} ${path}: ${body.slice(0, 200)}`);
  }

  return res.json() as Promise<T>;
}

export function collectionSlug(): string {
  return process.env.EXTERNA_COLLECTION?.trim() || 'posts';
}

export async function listItems(page = 1, perPage = 15): Promise<ListResponse> {
  const slug = collectionSlug();
  const qs = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  return externaFetch<ListResponse>(
    `/api/v1/collections/${encodeURIComponent(slug)}/items?${qs}`,
  );
}

export async function getItem(id: string | number): Promise<CollectionItem> {
  const slug = collectionSlug();
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
