import type { ConnectionProbe } from '@/lib/externa';

type SetupPanelProps = {
  title?: string;
  requestedSlug?: string | null;
  availableSlugs?: string[];
  connection: ConnectionProbe;
};

/**
 * Setup guidance when no readable collection is configured or reachable.
 *
 * @param props.title - Panel heading (default: connect-a-collection copy)
 * @param props.requestedSlug - Env or attempted slug that failed, if any
 * @param props.availableSlugs - Slugs currently readable via the Public API
 * @param props.connection - OpenAPI reachability probe result
 * @returns Setup instructions and connection status UI
 */
export function SetupPanel({
  title = 'Connect a collection',
  requestedSlug,
  availableSlugs = [],
  connection,
}: SetupPanelProps) {
  return (
    <>
      <h1>{title}</h1>
      <p className="lede">
        Fresh Externa installs ship with no collections. Point this starter at one
        you create, or grant <strong>Read</strong> so auto-discovery can pick the
        first readable collection.
      </p>
      <div className="setup">
        <ol>
          <li>
            In Externa admin, create a collection (any slug) and add at least one
            item if you want something to list.
          </li>
          <li>
            Grant <strong>Read</strong> on that collection for the{' '}
            <code>public</code> role, or set <code>EXTERNA_API_KEY</code> to a key
            whose role has Read.
          </li>
          <li>
            Optionally set <code>EXTERNA_COLLECTION</code> to that slug in{' '}
            <code>.env.local</code>. Leave it empty to auto-pick the first
            readable collection via <code>GET /api/v1/collections</code>.
          </li>
        </ol>
        {requestedSlug ? (
          <p>
            Requested slug <code>{requestedSlug}</code> was not found (or not
            readable). Check the slug and Collection access.
          </p>
        ) : null}
        {availableSlugs.length > 0 ? (
          <p>
            Readable collections right now:{' '}
            {availableSlugs.map((slug, i) => (
              <span key={slug}>
                {i > 0 ? ', ' : ''}
                <code>{slug}</code>
              </span>
            ))}
            . Set one as <code>EXTERNA_COLLECTION</code> or leave empty to use
            the first.
          </p>
        ) : (
          <p>
            No readable collections returned by the Public API yet (
            <code>data: []</code>).
          </p>
        )}
        <p className={connection.ok ? 'setup-ok' : 'setup-bad'}>
          {connection.ok ? (
            <>
              API reachable — OpenAPI{' '}
              {connection.openapi ? (
                <code>{connection.openapi}</code>
              ) : (
                'ok'
              )}
              {connection.title ? (
                <>
                  {' '}
                  (<code>{connection.title}</code>)
                </>
              ) : null}
              .
            </>
          ) : (
            <>
              Could not reach <code>/api/v1/openapi.json</code>:{' '}
              {connection.message}. Check <code>EXTERNA_API_URL</code>.
            </>
          )}
        </p>
      </div>
    </>
  );
}
