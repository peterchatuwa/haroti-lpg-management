import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

interface SearchResult {
  type: string;
  id: string;
  label: string;
  subtitle: string;
  path: string;
}

const TYPE_LABELS: Record<string, string> = {
  customer: 'Customer',
  sale: 'Sale',
  cylinder: 'Cylinder',
  purchase_order: 'PO',
  supplier: 'Supplier',
  journal: 'Journal',
  work_order: 'Work order',
  station: 'Station',
};

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useQuery({
    queryKey: ['global-search', query],
    enabled: query.trim().length >= 2,
    queryFn: async () =>
      (await api.get<{ results: SearchResult[] }>('/search', { params: { q: query } }))
        .data,
    staleTime: 30_000,
  });

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const results = data?.results ?? [];

  return (
    <div className="global-search" ref={wrapRef}>
      <Search size={16} className="global-search-icon" />
      <input
        type="search"
        className="global-search-input"
        placeholder="Search receipts, customers, cylinders…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        aria-label="Global search"
      />
      {open && query.trim().length >= 2 && (
        <div className="global-search-dropdown">
          {isFetching && <p className="global-search-empty">Searching…</p>}
          {!isFetching && results.length === 0 && (
            <p className="global-search-empty">No matches for “{query.trim()}”</p>
          )}
          {!isFetching &&
            results.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                type="button"
                className="global-search-result"
                onClick={() => {
                  navigate(r.path);
                  setOpen(false);
                  setQuery('');
                }}
              >
                <span className="global-search-type">
                  {TYPE_LABELS[r.type] ?? r.type}
                </span>
                <strong>{r.label}</strong>
                <span className="muted">{r.subtitle}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
