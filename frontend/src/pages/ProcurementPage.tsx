import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import type {
  CustomerRow,
  ProcurementDocumentRow,
  PurchaseOrder,
  SupplierRow,
} from '../lib/erp-types';
import { formatMoney } from '../lib/format';

interface DocumentPayload {
  title: string;
  documentNumber: string;
  documentType: string;
  issuedAt: string;
  buyer: { name: string; address: string };
  vendor: {
    name: string;
    code: string;
    customerCode?: string;
    phone?: string;
    address?: string;
  };
  destination: { code: string; name: string };
  lines: Array<{
    description: string;
    quantity: number;
    unitCost: number;
    landedUnitCost: number;
    lineTotal: number;
  }>;
  subtotal: number;
  freightCost: number;
  customsDuty: number;
  clearingFees: number;
  totalAmount: number;
  currency: string;
  notes?: string | null;
}

function DocumentViewer({
  docId,
  onClose,
}: {
  docId: string;
  onClose: () => void;
}) {
  const { data } = useQuery({
    queryKey: ['procurement-doc', docId],
    queryFn: async () =>
      (await api.get<ProcurementDocumentRow>(`/procurement/documents/${docId}`))
        .data,
  });

  if (!data) return <div className="panel">Loading document…</div>;

  const payload = JSON.parse(data.payload) as DocumentPayload;

  return (
    <div className="panel stack" style={{ border: '2px solid var(--accent)' }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3 className="panel-title">{payload.title}</h3>
        <button className="btn btn-ghost" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="row">
        <span className="badge">{payload.documentNumber}</span>
        <span className="muted">
          {new Date(payload.issuedAt).toLocaleDateString()}
        </span>
      </div>
      <div className="grid two">
        <div>
          <strong>From (vendor)</strong>
          <p>
            {payload.vendor.name}
            <br />
            {payload.vendor.code}
            {payload.vendor.customerCode && (
              <>
                <br />
                Customer: {payload.vendor.customerCode}
              </>
            )}
          </p>
        </div>
        <div>
          <strong>To (buyer)</strong>
          <p>
            {payload.buyer.name}
            <br />
            {payload.buyer.address}
          </p>
        </div>
      </div>
      <p>
        <strong>Deliver to:</strong> {payload.destination.code} —{' '}
        {payload.destination.name}
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Landed</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {payload.lines.map((line, i) => (
              <tr key={i}>
                <td>{line.description}</td>
                <td>{line.quantity}</td>
                <td>{formatMoney(line.unitCost)}</td>
                <td>{formatMoney(line.landedUnitCost)}</td>
                <td>{formatMoney(line.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="row" style={{ justifyContent: 'flex-end', gap: '1.5rem' }}>
        <span>Freight: {formatMoney(payload.freightCost)}</span>
        <span>Duty: {formatMoney(payload.customsDuty)}</span>
        <span>Clearing: {formatMoney(payload.clearingFees)}</span>
        <strong>Total: {formatMoney(payload.totalAmount)}</strong>
      </div>
      {payload.notes && <p className="muted">Notes: {payload.notes}</p>}
      <button
        className="btn btn-primary"
        onClick={() => window.print()}
        type="button"
      >
        Print document
      </button>
    </div>
  );
}

export function ProcurementPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'orders' | 'vendors'>('orders');
  const [msg, setMsg] = useState('');
  const [viewDocId, setViewDocId] = useState<string | null>(null);
  const [vendorCustomerId, setVendorCustomerId] = useState('');
  const [poForm, setPoForm] = useState({
    supplierId: '',
    destinationStationId: '',
    freightCost: 0,
    customsDuty: 0,
    clearingFees: 0,
    notes: '',
    itemDescription: '',
    quantity: 1,
    unitCost: 0,
  });

  const { data: orders } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () =>
      (await api.get<PurchaseOrder[]>('/procurement/orders')).data,
  });

  const { data: vendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => (await api.get<SupplierRow[]>('/suppliers')).data,
  });

  const { data: eligibleCustomers } = useQuery({
    queryKey: ['eligible-vendor-customers'],
    queryFn: async () =>
      (await api.get<CustomerRow[]>('/suppliers/eligible-customers')).data,
    enabled: tab === 'vendors',
  });

  const { data: stations } = useQuery({
    queryKey: ['stations-list'],
    queryFn: async () =>
      (await api.get<Array<{ id: string; code: string; name: string }>>('/stations'))
        .data,
  });

  const customerVendors = (vendors ?? []).filter((v) => v.customerId);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['purchase-orders'] });
    qc.invalidateQueries({ queryKey: ['vendors'] });
    qc.invalidateQueries({ queryKey: ['eligible-vendor-customers'] });
  };

  const registerVendor = useMutation({
    mutationFn: () =>
      api.post('/suppliers', { customerId: vendorCustomerId }),
    onSuccess: () => {
      setMsg('Customer registered as vendor');
      setVendorCustomerId('');
      invalidate();
    },
  });

  const createPo = useMutation({
    mutationFn: () =>
      api.post('/procurement/orders', {
        supplierId: poForm.supplierId,
        destinationStationId: poForm.destinationStationId || undefined,
        freightCost: poForm.freightCost,
        customsDuty: poForm.customsDuty,
        clearingFees: poForm.clearingFees,
        notes: poForm.notes || undefined,
        lines: [
          {
            itemDescription: poForm.itemDescription,
            quantity: poForm.quantity,
            unitCost: poForm.unitCost,
          },
        ],
      }),
    onSuccess: () => {
      setMsg('Draft order created — quotation generated');
      invalidate();
    },
  });

  const action = useMutation({
    mutationFn: ({ id, step }: { id: string; step: string }) =>
      api.post(`/procurement/orders/${id}/${step}`),
    onSuccess: () => {
      setMsg('Order updated');
      invalidate();
    },
  });

  const onCreatePo = (e: FormEvent) => {
    e.preventDefault();
    if (!poForm.supplierId || !poForm.itemDescription) return;
    createPo.mutate();
  };

  const onRegisterVendor = (e: FormEvent) => {
    e.preventDefault();
    if (!vendorCustomerId) return;
    registerVendor.mutate();
  };

  return (
    <div className="stack">
      <PageHeader
        title="Procurement"
        subtitle="Customer-linked vendors, quotations, POs, invoices & receipts"
      />
      {msg && <div className="panel ok-panel">{msg}</div>}

      <div className="row">
        <button
          className={`btn ${tab === 'orders' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('orders')}
        >
          Purchase orders
        </button>
        <button
          className={`btn ${tab === 'vendors' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('vendors')}
        >
          Vendors
        </button>
        <span className="badge">{customerVendors.length} customer vendors</span>
      </div>

      {viewDocId && (
        <DocumentViewer docId={viewDocId} onClose={() => setViewDocId(null)} />
      )}

      {tab === 'vendors' && (
        <div className="grid two">
          <div className="panel">
            <h3 className="panel-title">Register vendor from customer</h3>
            <p className="muted">
              Vendors can only be created from existing customers in the system.
            </p>
            <form className="stack" onSubmit={onRegisterVendor}>
              <label>
                Customer
                <select
                  value={vendorCustomerId}
                  onChange={(e) => setVendorCustomerId(e.target.value)}
                  required
                >
                  <option value="">Select customer…</option>
                  {(eligibleCustomers ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customerCode} — {c.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn btn-primary" type="submit">
                Register as vendor
              </button>
            </form>
          </div>
          <div className="panel">
            <h3 className="panel-title">Active vendors</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Customer</th>
                  </tr>
                </thead>
                <tbody>
                  {customerVendors.map((v) => (
                    <tr key={v.id}>
                      <td>{v.code}</td>
                      <td>{v.name}</td>
                      <td>{v.customer?.customerCode ?? '—'}</td>
                    </tr>
                  ))}
                  {!customerVendors.length && (
                    <tr>
                      <td colSpan={3} className="muted">
                        No customer-linked vendors yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <>
          <div className="panel">
            <h3 className="panel-title">Create purchase order (quotation)</h3>
            <form className="grid two" onSubmit={onCreatePo}>
              <label>
                Vendor (customer-linked)
                <select
                  value={poForm.supplierId}
                  onChange={(e) =>
                    setPoForm({ ...poForm, supplierId: e.target.value })
                  }
                  required
                >
                  <option value="">Select vendor…</option>
                  {customerVendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.code} — {v.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Destination station
                <select
                  value={poForm.destinationStationId}
                  onChange={(e) =>
                    setPoForm({ ...poForm, destinationStationId: e.target.value })
                  }
                >
                  <option value="">Central hub</option>
                  {(stations ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Item description
                <input
                  value={poForm.itemDescription}
                  onChange={(e) =>
                    setPoForm({ ...poForm, itemDescription: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Quantity
                <input
                  type="number"
                  min="1"
                  value={poForm.quantity}
                  onChange={(e) =>
                    setPoForm({ ...poForm, quantity: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Unit cost (MWK)
                <input
                  type="number"
                  min="0"
                  value={poForm.unitCost}
                  onChange={(e) =>
                    setPoForm({ ...poForm, unitCost: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Freight
                <input
                  type="number"
                  min="0"
                  value={poForm.freightCost}
                  onChange={(e) =>
                    setPoForm({ ...poForm, freightCost: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Notes
                <input
                  value={poForm.notes}
                  onChange={(e) =>
                    setPoForm({ ...poForm, notes: e.target.value })
                  }
                />
              </label>
              <div className="row" style={{ alignItems: 'end' }}>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={!customerVendors.length || createPo.isPending}
                >
                  Create draft + quotation
                </button>
              </div>
            </form>
            {!customerVendors.length && (
              <p className="muted" style={{ marginTop: '0.75rem' }}>
                Register a customer as a vendor first (Vendors tab).
              </p>
            )}
          </div>

          <div className="panel">
            <h3 className="panel-title">Purchase orders</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>PO #</th>
                    <th>Vendor</th>
                    <th>Destination</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Documents</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(orders ?? []).map((po) => (
                    <tr key={po.id}>
                      <td>{po.poNumber}</td>
                      <td>
                        {po.supplier.name}
                        {po.supplier.customer && (
                          <div className="muted">
                            {po.supplier.customer.customerCode}
                          </div>
                        )}
                      </td>
                      <td>{po.destinationStation?.code ?? 'Central'}</td>
                      <td>{formatMoney(Number(po.totalAmount))}</td>
                      <td>
                        <span className="badge">{po.status.replaceAll('_', ' ')}</span>
                      </td>
                      <td>
                        <div className="row" style={{ flexWrap: 'wrap', gap: '0.25rem' }}>
                          {(po.documents ?? []).map((d) => (
                            <button
                              key={d.id}
                              className="btn btn-sm btn-ghost"
                              onClick={() => setViewDocId(d.id)}
                            >
                              {d.documentType.slice(0, 3)}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="row" style={{ flexWrap: 'wrap' }}>
                        {po.status === 'DRAFT' && (
                          <button
                            className="btn btn-sm"
                            onClick={() =>
                              action.mutate({ id: po.id, step: 'submit' })
                            }
                          >
                            Submit
                          </button>
                        )}
                        {po.status === 'PENDING_APPROVAL' && (
                          <button
                            className="btn btn-sm"
                            onClick={() =>
                              action.mutate({ id: po.id, step: 'approve' })
                            }
                          >
                            Approve
                          </button>
                        )}
                        {po.status === 'APPROVED' && (
                          <button
                            className="btn btn-sm"
                            onClick={() =>
                              action.mutate({ id: po.id, step: 'place-order' })
                            }
                          >
                            Place order
                          </button>
                        )}
                        {po.status === 'ORDERED' && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() =>
                              action.mutate({ id: po.id, step: 'receive' })
                            }
                          >
                            Receive GRN
                          </button>
                        )}
                        {po.status === 'RECEIVED' && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() =>
                              action.mutate({ id: po.id, step: 'pay' })
                            }
                          >
                            Pay supplier
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!orders?.length && (
                    <tr>
                      <td colSpan={7} className="muted">
                        No purchase orders yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
