/**
 * Shared types for Externa Public CMS API (`/api/v1`).
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
