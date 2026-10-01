/**
 * Shared types for Externa Public CMS API (`/api/v1`).
 * Docs: https://docs.externa.qiick.io/docs/public-cms-api
 */

/**
 * Single CMS item: id, parent collection, and free-form `data` fields.
 */
export type CollectionItem = {
  id: number;
  collection_id: number;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

/**
 * Collection metadata returned by list/detail collection endpoints.
 */
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

/**
 * Result of probing API reachability via the public OpenAPI document.
 * Success includes optional OpenAPI version and API title when present.
 */
export type ConnectionProbe =
  | { ok: true; openapi: string | null; title: string | null }
  | { ok: false; message: string };

/**
 * Collection chosen for this request: env override or first discovered readable slug.
 */
export type ResolvedCollection = {
  slug: string;
  source: 'env' | 'discovered';
  name?: string;
};
