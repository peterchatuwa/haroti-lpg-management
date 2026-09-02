import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, Package, Search, ShoppingCart } from 'lucide-react';
import { formatMwk } from '../data/product-display';
import { fetchCatalog, type CatalogItem } from '../lib/api';
import { useCart } from '../store/cart-context';

type CategoryFilter = 'all' | CatalogItem['category'];

const CATEGORY_LABELS: Record<CatalogItem['category'], string> = {
  cylinder: 'LPG Cylinders',
  accessory: 'Accessories',
  bundle: 'Starter Kits',
};

export const StorePage = () => {
  const navigate = useNavigate();
  const { addItem, itemCount } = useCart();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCatalog()
      .then(setCatalog)
      .catch(() => setError('Unable to load catalogue'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((item) => {
      if (filter !== 'all' && item.category !== filter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q)
      );
    });
  }, [catalog, filter, search]);

  const filters: { id: CategoryFilter; label: string }[] = [
    { id: 'all', label: 'All products' },
    { id: 'cylinder', label: 'Cylinders' },
    { id: 'accessory', label: 'Accessories' },
    { id: 'bundle', label: 'Kits' },
  ];

  return (
    <div className="bg-haroti-paper">
      <section className="relative bg-gradient-to-r from-haroti-forest to-haroti-forest-deep text-white py-14 md:py-20">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Haroti Store</h1>
              <p className="text-lg text-white/80 max-w-2xl">
                Browse our live catalogue, place an order request, and our operations team will
                contact you to confirm payment, pickup, delivery, or installation.
              </p>
            </div>
            <Link
              to="/store/checkout"
              className="inline-flex items-center justify-center gap-2 bg-haroti-orange hover:bg-haroti-flame-hot text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <ShoppingCart size={20} />
              View cart ({itemCount})
            </Link>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-haroti-muted"
                size={18}
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-3 border border-haroti-mist rounded-lg focus:ring-2 focus:ring-haroti-forest focus:border-transparent"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f.id
                      ? 'bg-haroti-forest text-white'
                      : 'bg-white text-haroti-ink/90 border border-haroti-mist hover:bg-haroti-mist'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <p className="text-center text-haroti-muted py-16">Loading catalogue...</p>
          )}
          {error && (
            <p className="text-center text-red-600 py-16">{error}</p>
          )}

          {!loading && !error && filtered.length === 0 && (
            <p className="text-center text-haroti-muted py-16">No products match your search.</p>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((item) => (
              <article
                key={item.sku}
                className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col"
              >
                <div className="h-36 bg-gradient-to-br from-haroti-mist to-haroti-paper flex items-center justify-center">
                  {item.category === 'cylinder' ? (
                    <Flame className="text-haroti-orange" size={40} />
                  ) : (
                    <Package className="text-haroti-forest" size={40} />
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-haroti-muted mb-1">
                    {CATEGORY_LABELS[item.category]}
                  </span>
                  <h2 className="font-bold text-lg text-haroti-forest mb-1">{item.name}</h2>
                  <p className="text-sm text-haroti-muted mb-3">SKU: {item.sku}</p>
                  <p className="text-xl font-bold text-haroti-ink/90 mb-2">
                    {formatMwk(item.unitPrice)}
                  </p>
                  <p className="text-sm text-haroti-muted mb-4">
                    {item.inStock
                      ? `${item.quantityAvailable} available (network)`
                      : 'Currently out of stock'}
                  </p>
                  <div className="mt-auto flex flex-col gap-2">
                    <button
                      type="button"
                      disabled={!item.inStock}
                      onClick={() => {
                        addItem(item);
                        navigate('/store/checkout');
                      }}
                      className={`w-full font-semibold py-2 px-4 rounded-lg transition-colors ${
                        item.inStock
                          ? 'bg-haroti-orange hover:bg-haroti-flame-hot text-white'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {item.inStock ? 'Add to cart' : 'Out of stock'}
                    </button>
                    {item.inStock && (
                      <button
                        type="button"
                        onClick={() => addItem(item)}
                        className="w-full text-sm text-haroti-forest hover:text-haroti-orange font-medium"
                      >
                        Add &amp; keep shopping
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 bg-haroti-mist/50 border border-haroti-mist rounded-xl p-6 text-sm text-haroti-muted">
            <p className="font-semibold text-haroti-ink/90 mb-2">How ordering works</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Prices and stock are loaded live from our ERP.</li>
              <li>No online payment — operations will contact you to confirm and arrange payment.</li>
              <li>Choose pickup at a station, home delivery, or delivery with installation.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
