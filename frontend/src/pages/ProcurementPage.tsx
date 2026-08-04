import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import type { PurchaseOrder } from '../lib/erp-types';
import { formatMoney } from '../lib/format';

export function ProcurementPage() {
  const qc = useQueryClient();
  const [msg, setMsg] = useState('');
  const { data: orders } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () =>
      (await api.get<PurchaseOrder[]>('/procurement/orders')).data,
  });

  const approve = useMutation({
    mutationFn: (id: string) => api.post(`/procurement/orders/${id}/approve`),
    onSuccess: () => {
      setMsg('PO approved');
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });

  const receive = useMutation({
    mutationFn: (id: string) => api.post(`/procurement/orders/${id}/receive`),
    onSuccess: () => {
      setMsg('GRN posted — stock & journal updated');
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['accessory-stock'] });
    },
  });

  return (
    <div className="stack">
      <PageHeader
        title="Procurement"
        subtitle="Purchase orders, landed cost & multi-level approval (Charter §5 & §10.1)"
      />
      {msg && <div className="panel ok-panel">{msg}</div>}

      <div className="panel">
        <h3 className="panel-title">Purchase orders</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>PO #</th>
                <th>Supplier</th>
                <th>Destination</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(orders ?? []).map((po) => (
                <tr key={po.id}>
                  <td>{po.poNumber}</td>
                  <td>{po.supplier.name}</td>
                  <td>{po.destinationStation?.code ?? 'Central'}</td>
                  <td>{formatMoney(Number(po.totalAmount))}</td>
                  <td>
                    <span className="badge">{po.status.replaceAll('_', ' ')}</span>
                  </td>
                  <td className="row">
                    {po.status === 'PENDING_APPROVAL' && (
                      <button
                        className="btn btn-sm"
                        onClick={() => approve.mutate(po.id)}
                      >
                        Approve
                      </button>
                    )}
                    {po.status === 'APPROVED' && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => receive.mutate(po.id)}
                      >
                        Receive GRN
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!orders?.length && (
                <tr>
                  <td colSpan={6} className="muted">
                    No purchase orders yet — create via API or seed data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
