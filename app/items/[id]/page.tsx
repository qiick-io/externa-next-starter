import Link from 'next/link';
import { getItem, itemLabel } from '@/lib/externa';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ItemPage({ params }: Props) {
  const { id } = await params;

  try {
    const item = await getItem(id);
    const entries = Object.entries(item.data ?? {});

    return (
      <>
        <Link className="back" href="/">
          ← All items
        </Link>
        <h1>{itemLabel(item)}</h1>
        <p className="lede">
          Item #{item.id} · updated {new Date(item.updated_at).toLocaleString()}
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
