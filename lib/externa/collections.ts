import { externaFetch, ExternaHttpError } from './client';
import type {
  CollectionItem,
  CollectionSummary,
  ResolvedCollection,
} from './types';

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
