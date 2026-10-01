export type {
  CollectionItem,
  CollectionSummary,
  ConnectionProbe,
  ResolvedCollection,
} from './types';

export {
  ExternaHttpError,
  shortApiDetail,
} from './client';

export {
  configuredCollectionSlug,
  listCollections,
  collectionReadable,
  resolveCollection,
  listItems,
  getItem,
  itemLabel,
  isMissingCollectionError,
} from './collections';

export { pingOpenApi } from './openapi';
