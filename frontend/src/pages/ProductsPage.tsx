import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import { formatMoney } from '../lib/format';

const CATEGORIES = [
  'ACCESSORY',
  'LPG_REFILL',
  'FILLED_CYLINDER',
  'EMPTY_CYLINDER',
  'DEPOSIT',
  'BUNDLE',
] as const;

type ProductCategory = (typeof CATEGORIES)[number];

interface ProductRow {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  unitPrice: string;
  costPrice: string;
  barcode?: string;
  isActive: boolean;
  description?: string;
}

const emptyForm = {
  sku: '',
  name: '',
  category: 'ACCESSORY' as ProductCategory,
  unitPrice: 0,
  costPrice: 0,
  barcode: '',
  description: '',
};

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [showInactive, setShowInactive] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', showInactive],
    queryFn: async () =>
      (
        await api.get<ProductRow[]>('/products', {
          params: { includeInactive: showInactive ? 'true' : 'false' },
        })
      ).data,
  });

  const filtered = useMemo(() => {
    const rows = products ?? [];
    if (categoryFilter === 'ALL') return rows;
    return rows.filter((p) => p.category === categoryFilter);
  }, [products, categoryFilter]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        sku: form.sku.trim(),
        name: form.name.trim(),
        category: form.category,
        unitPrice: Number(form.unitPrice),
        costPrice: Number(form.costPrice) || 0,
        barcode: form.barcode.trim() || undefined,
        description: form.description.trim() || undefined,
      };
      if (editingId) {
        return (await api.patch(`/products/${editingId}`, payload)).data;
      }
      return (await api.post('/products', payload)).data;
    },
    onSuccess: () => {
      setMessage(editingId ? 'Product updated' : 'Product created');
      setError('');
      setForm(emptyForm);
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['accessory-catalog'] });
    },
    onError: (err: { response?: { data?: { message?: string | string[] } } }) => {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Could not save product');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (p: ProductRow) =>
      (
        await api.patch(`/products/${p.id}`, {
          isActive: !p.isActive,
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['accessory-catalog'] });
    },
  });

  function startEdit(p: ProductRow) {
    setEditingId(p.id);
    setForm({
      sku: p.sku,
      name: p.name,
      category: p.category,
      unitPrice: Number(p.unitPrice),
      costPrice: Number(p.costPrice),
      barcode: p.barcode ?? '',
      description: p.description ?? '',
    });
    setMessage('');
    setError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  return (
    <div className="stack">
      <PageHeader
        title="Product catalog"
        subtitle="Create and manage SKUs for accessories, cylinders, deposits, and bundles"
      />

      {message && <p className="panel" style={{ color: 'var(--ok)', margin: 0 }}>{message}</p>}
      {error && <p className="panel" style={{ color: 'var(--danger)', margin: 0 }}>{error}</p>}

      <div className="panel stack">
        <h3 className="panel-title">{editingId ? 'Edit product' : 'New product'}</h3>
        <div className="grid two">
          <label>
            SKU *
            <input
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
              placeholder="REG-STD"
              required
            />
          </label>
          <label>
            Name *
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Standard regulator"
              required
            />
          </label>
          <label>
            Category *
            <select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value as ProductCategory })
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </label>
          <label>
            Barcode
            <input
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            />
          </label>
          <label>
            Unit price (MWK) *
            <input
              type="number"
              min={0}
              step={1}
              value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
            />
          </label>
          <label>
            Cost price (MWK)
            <input
              type="number"
              min={0}
              step={1}
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })}
            />
          </label>
        </div>
        <label>
          Description
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <div className="pay-chips">
          <button
            type="button"
            className="btn btn-accent"
            disabled={saveMutation.isPending || !form.sku.trim() || !form.name.trim()}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? 'Saving…' : editingId ? 'Update product' : 'Create product'}
          </button>
          {editingId && (
            <button type="button" className="btn" onClick={cancelEdit}>
              Cancel edit
            </button>
          )}
        </div>
      </div>

      <div className="panel">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1rem',
          }}
        >
          <h3 className="panel-title" style={{ margin: 0 }}>
            All products
          </h3>
          <div className="pay-chips">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              Show inactive
            </label>
          </div>
        </div>
        {isLoading ? (
          <p className="muted">Loading…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Unit price</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} style={p.isActive ? undefined : { opacity: 0.65 }}>
                    <td>{p.sku}</td>
                    <td>
                      <strong>{p.name}</strong>
                      {p.description && (
                        <div className="muted" style={{ fontSize: '0.85rem' }}>
                          {p.description}
                        </div>
                      )}
                    </td>
                    <td>{p.category.replaceAll('_', ' ')}</td>
                    <td>{formatMoney(Number(p.unitPrice))}</td>
                    <td>{formatMoney(Number(p.costPrice))}</td>
                    <td>
                      <span className="badge">{p.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td>
                      <div className="pay-chips">
                        <button type="button" className="btn" onClick={() => startEdit(p)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn"
                          disabled={toggleMutation.isPending}
                          onClick={() => toggleMutation.mutate(p)}
                        >
                          {p.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <p className="muted">No products in this category yet.</p>
        )}
      </div>
    </div>
  );
}
