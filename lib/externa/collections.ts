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

/**
 * Explicit slug from env, or `null` when unset (auto-discover).
 *
 * @returns Trimmed `EXTERNA_COLLECTION`, or `null` when missing/blank
 */
export function configuredCollectionSlug(): string | null {
  const slug = process.env.EXTERNA_COLLECTION?.trim();
  return slug ? slug : null;
}

/**
 * List collections readable by the current actor (`public` or API key role).
 *
 * @returns Collection summaries from `GET /api/v1/collections`
 */
export async function listCollections(): Promise<CollectionSummary[]> {
  const json = await externaFetch<CollectionsResponse>('/api/v1/collections');
  return json.data;
}

/**
 * `true` when slug exists and actor may read it.
 *
 * @param slug - Collection slug to probe
 * @returns Whether `GET /api/v1/collections/{slug}` succeeds
 */
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
 *
 * @returns Resolved slug (env or discovered), or `null` if none available
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

/**
 * Paginated items for a collection.
 *
 * @param slug - Collection slug
 * @param page - 1-based page index (default `1`)
 * @param perPage - Page size (default `15`)
 * @returns Item list plus pagination `meta`
 */
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

/**
 * Fetch a single item by id within a collection.
 *
 * @param slug - Collection slug
 * @param id - Item id
 * @returns Item record including `data` fields
 */
export async function getItem(
  slug: string,
  id: string | number,
): Promise<CollectionItem> {
  const json = await externaFetch<ItemResponse>(
    `/api/v1/collections/${encodeURIComponent(slug)}/items/${encodeURIComponent(String(id))}`,
  );
  return json.data;
}

/**
 * Best-effort title from common field names; falls back to id.
 *
 * @param item - Collection item whose `data` may hold title-like fields
 * @returns Display label for lists and headings
 */
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

/**
 * Detect a 404 from the Public CMS API (missing collection or item).
 *
 * @param error - Caught value from an Externa fetch
 * @returns `true` when `error` is {@link ExternaHttpError} with status 404
 */
export function isMissingCollectionError(error: unknown): boolean {
  return error instanceof ExternaHttpError && error.status === 404;
}
