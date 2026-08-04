import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import type { CustomerRow } from '../lib/erp-types';
import { formatMoney } from '../lib/format';

export function CustomersPage() {
  const qc = useQueryClient();
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    type: 'COMMERCIAL',
    creditLimit: 0,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => (await api.get<CustomerRow[]>('/customers')).data,
  });

  const create = useMutation({
    mutationFn: () => api.post('/customers', form),
    onSuccess: () => {
      setMsg('Customer registered');
      setForm({ fullName: '', phone: '', type: 'COMMERCIAL', creditLimit: 0 });
      qc.invalidateQueries({ queryKey: ['customers-list'] });
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate();
  };

  return (
    <div className="stack">
      <PageHeader
        title="Customers & credit"
        subtitle="AR controls, credit limits & wholesale accounts (Charter §1 & §2)"
      />
      {msg && <div className="panel ok-panel">{msg}</div>}

      <div className="grid two">
        <div className="panel">
          <h3 className="panel-title">Register customer</h3>
          <form className="stack" onSubmit={onSubmit}>
            <label>
              Full name
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </label>
            <label>
              Phone
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <label>
              Type
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="HOUSEHOLD">Household</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="INSTITUTIONAL">Institutional</option>
                <option value="AGENT">Agent</option>
              </select>
            </label>
            <label>
              Credit limit (MWK)
              <input
                type="number"
                value={form.creditLimit}
                onChange={(e) =>
                  setForm({ ...form, creditLimit: Number(e.target.value) })
                }
              />
            </label>
            <button className="btn btn-primary" type="submit">
              Save customer
            </button>
          </form>
        </div>

        <div className="panel">
          <h3 className="panel-title">Customer register</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Credit limit</th>
                  <th>Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {(customers ?? []).map((c) => (
                  <tr key={c.id}>
                    <td>{c.customerCode}</td>
                    <td>
                      {c.fullName}
                      <div className="muted">{c.type}</div>
                    </td>
                    <td>{formatMoney(Number(c.creditLimit))}</td>
                    <td>{formatMoney(Number(c.outstandingBalance))}</td>
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
