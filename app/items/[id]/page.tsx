import Link from 'next/link';
import { SetupPanel } from '@/app/setup-panel';
import {
  collectionReadable,
  configuredCollectionSlug,
  getItem,
  isMissingCollectionError,
  itemLabel,
  listCollections,
  pingOpenApi,
  resolveCollection,
} from '@/lib/externa';

type Props = {
  params: Promise<{ id: string }>;
};

async function availableSlugs(): Promise<string[]> {
  try {
    return (await listCollections()).map((c) => c.slug);
  } catch {
    return [];
  }
}

export default async function ItemPage({ params }: Props) {
  const { id } = await params;
  let activeSlug: string | null = null;

  try {
    const resolved = await resolveCollection();
    if (!resolved) {
      const [connection, slugs] = await Promise.all([
        pingOpenApi(),
        availableSlugs(),
      ]);
      return (
        <>
          <Link className="back" href="/">
            ← All items
          </Link>
          <SetupPanel connection={connection} availableSlugs={slugs} />
        </>
      );
    }

    activeSlug = resolved.slug;
    const item = await getItem(resolved.slug, id);
    const entries = Object.entries(item.data ?? {});

    return (
      <>
        <Link className="back" href="/">
          ← All items
        </Link>
        <h1>{itemLabel(item)}</h1>
        <p className="lede">
          Item #{item.id} · <code>{resolved.slug}</code> · updated{' '}
          {new Date(item.updated_at).toLocaleString()}
        </p>
        <dl className="fields">
          {entries.length === 0 ? (
            <div className="field">
              <dt>data</dt>
              <dd>(empty)</dd>
            </div>
          ) : (
            entries.map(([key, value]) => (
              <div className="field" key={key}>
                <dt>{key}</dt>
                <dd>
                  {typeof value === 'string' || typeof value === 'number'
                    ? String(value)
                    : JSON.stringify(value, null, 2)}
                </dd>
              </div>
            ))
          )}
        </dl>
      </>
    );
  } catch (error) {
    if (isMissingCollectionError(error) && activeSlug) {
      const readable = await collectionReadable(activeSlug).catch(() => false);
      if (readable) {
        return (
          <>
            <Link className="back" href="/">
              ← All items
            </Link>
            <h1>Item #{id}</h1>
            <p className="lede">
              No item with this id in <code>{activeSlug}</code>.
            </p>
          </>
        );
      }
    }

    if (isMissingCollectionError(error)) {
      const [connection, slugs] = await Promise.all([
        pingOpenApi(),
        availableSlugs(),
      ]);
      return (
        <>
          <Link className="back" href="/">
            ← All items
          </Link>
          <SetupPanel
            requestedSlug={configuredCollectionSlug() ?? activeSlug}
            connection={connection}
            availableSlugs={slugs}
          />
        </>
      );
    }

    const message = error instanceof Error ? error.message : String(error);
    return (
      <>
        <Link className="back" href="/">
          ← All items
        </Link>
        <h1>Item #{id}</h1>
        <div className="error">
          <p>{message}</p>
        </div>
      </>
    );
  }
}
