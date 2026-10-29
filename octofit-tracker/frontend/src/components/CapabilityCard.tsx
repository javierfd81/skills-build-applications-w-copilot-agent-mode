import { useEffect, useState, type ReactNode } from 'react';
type Props = {
  title: string;
  description: string;
  // Must be referentially stable (module-level) so the effect does not refetch on every render.
  load: () => Promise<Record<string, unknown>>;
  responseKey: 'activities' | 'teams' | 'leaderboard' | 'suggestions';
  emptyMessage: string;
  renderItem: (item: Record<string, unknown>) => ReactNode;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function CapabilityCard({ title, description, load, responseKey, emptyMessage, renderItem }: Props) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(undefined);
    load()
      .then((data) => {
        const responseItems = data[responseKey];
        if (!Array.isArray(responseItems) || !responseItems.every(isRecord)) {
          throw new Error('Unexpected API response');
        }
        if (active) setItems(responseItems);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unknown error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [load, responseKey]);

  return <section className="card h-100">
    <div className="card-body">
      <h2 className="h4">{title}</h2>
      <p>{description}</p>
      {loading
        ? <p role="status">Loading {title.toLowerCase()}...</p>
        : error
          ? <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>
          : items.length === 0
            ? <p role="status">{emptyMessage}</p>
            : <ul className="list-group list-group-flush">
              {items.map((item, index) => <li className="list-group-item" key={String(item._id ?? index)}>{renderItem(item)}</li>)}
            </ul>}
    </div>
  </section>;
}
