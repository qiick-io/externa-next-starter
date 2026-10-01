import Link from 'next/link';
import { SetupPanel } from '@/app/setup-panel';
import {
  configuredCollectionSlug,
  isMissingCollectionError,
  itemLabel,
  listCollections,
  listItems,
  pingOpenApi,
  resolveCollection,
} from '@/lib/externa';

async function loadAvailableSlugs(): Promise<string[]> {
  try {
    const collections = await listCollections();
    return collections.map((c) => c.slug);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  try {
    const resolved = await resolveCollection();

    if (!resolved) {
      const [connection, availableSlugs] = await Promise.all([
        pingOpenApi(),
        loadAvailableSlugs(),
      ]);
      return (
        <SetupPanel connection={connection} availableSlugs={availableSlugs} />
      );
    }

    const { data, meta } = await listItems(resolved.slug);

    return (
      <>
        <h1>{resolved.name ?? resolved.slug}</h1>
        <p className="lede">
          {meta.total} item{meta.total === 1 ? '' : 's'} from Externa Public CMS
          API
          {resolved.source === 'discovered' ? (
            <>
              {' '}
              · auto-discovered <code>{resolved.slug}</code>
            </>
          ) : (
            <>
              {' '}
              · <code>{resolved.slug}</code>
            </>
          )}
          .
        </p>
        {data.length === 0 ? (
          <p className="lede">
            Collection is readable but empty. Create items in Externa admin.
          </p>
        ) : (
          <ul className="item-list">
            {data.map((item) => (
              <li key={item.id}>
                <Link href={`/items/${item.id}`}>
                  {itemLabel(item)}
                  <span className="meta">#{item.id}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </>
    );
  } catch (error) {
    if (isMissingCollectionError(error)) {
      const requested = configuredCollectionSlug();
      const [connection, availableSlugs] = await Promise.all([
        pingOpenApi(),
        loadAvailableSlugs(),
      ]);
      return (
        <SetupPanel
          requestedSlug={requested}
          connection={connection}
          availableSlugs={availableSlugs}
        />
      );
    }

    const message = error instanceof Error ? error.message : String(error);
    const connection = await pingOpenApi();
    return (
      <>
        <h1>Could not load Externa</h1>
        <p className="lede">
          Check <code>EXTERNA_API_URL</code> and network access to the Public
          CMS API.
        </p>
        <div className="error">
          <p>{message}</p>
          <p className={connection.ok ? 'setup-ok' : 'setup-bad'}>
            {connection.ok
              ? 'OpenAPI ping succeeded — API is up; this error is likely auth or collection access.'
              : `OpenAPI ping failed: ${connection.message}`}
          </p>
        </div>
      </>
    );
  }
}
