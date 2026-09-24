import Link from 'next/link';
import { collectionSlug, itemLabel, listItems } from '@/lib/externa';

export default async function HomePage() {
  const slug = collectionSlug();

  try {
    const { data, meta } = await listItems();

    return (
      <>
        <h1>{slug}</h1>
        <p className="lede">
          {meta.total} item{meta.total === 1 ? '' : 's'} from Externa Public CMS
          API.
        </p>
        {data.length === 0 ? (
          <p className="lede">
            No items yet. Create some in Externa admin, or grant <code>read</code>{' '}
            on collection <code>{slug}</code> for the public role / API key.
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
    const message = error instanceof Error ? error.message : String(error);
    return (
      <>
        <h1>{slug}</h1>
        <p className="lede">Could not load items from Externa.</p>
        <div className="error">
          <p>{message}</p>
          <p>
            Check <code>EXTERNA_API_URL</code>, collection slug, and that the{' '}
            <code>public</code> role (or your API key role) has <strong>Read</strong>{' '}
            on this collection.
          </p>
        </div>
      </>
    );
  }
}
