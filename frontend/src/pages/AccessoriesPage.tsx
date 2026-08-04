import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import type { AccessoryStockRow, ProductBundle } from '../lib/erp-types';
import { formatMoney } from '../lib/format';

export function AccessoriesPage() {
  const { data: stock } = useQuery({
    queryKey: ['accessory-stock'],
    queryFn: async () =>
      (await api.get<AccessoryStockRow[]>('/accessories/stock')).data,
  });
  const { data: bundles } = useQuery({
    queryKey: ['bundles'],
    queryFn: async () =>
      (await api.get<ProductBundle[]>('/accessories/bundles')).data,
  });
  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: async () =>
      (await api.get<AccessoryStockRow[]>('/accessories/low-stock')).data,
  });

  return (
    <div className="stack">
      <PageHeader
        title="LPG Accessories"
        subtitle="Central procurement, channel pricing, bundles & station stock (Charter §10)"
      />

      {lowStock && lowStock.length > 0 && (
        <div className="panel warn-panel">
          <strong>{lowStock.length} SKU(s) at or below reorder level</strong>
        </div>
      )}

      <div className="grid two">
        <div className="panel">
          <h3 className="panel-title">Starter kits & bundles</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Kit name</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {(bundles ?? []).map((b) => (
                  <tr key={b.id}>
                    <td>{b.sku}</td>
                    <td>
                      <strong>{b.name}</strong>
                      <div className="muted">{b.description}</div>
                    </td>
                    <td>{formatMoney(Number(b.bundlePrice))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-title">Station accessory stock</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Station</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Ownership</th>
                </tr>
              </thead>
              <tbody>
                {(stock ?? []).slice(0, 30).map((row) => (
                  <tr key={row.id}>
                    <td>{row.station.code}</td>
                    <td>
                      {row.product.sku}
                      <div className="muted">{row.product.name}</div>
                    </td>
                    <td className={row.quantity <= row.reorderLevel ? 'warn-text' : ''}>
                      {row.quantity}
                    </td>
                    <td>{row.ownership}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
