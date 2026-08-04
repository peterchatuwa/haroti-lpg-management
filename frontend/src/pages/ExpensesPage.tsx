import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import { formatMoney } from '../lib/format';
import { useAuthStore } from '../store/auth';

export function ExpensesPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [category, setCategory] = useState('Transport');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(15000);
  const [depositAmount, setDepositAmount] = useState(100000);
  const [message, setMessage] = useState('');

  const { data: stations } = useQuery({
    queryKey: ['stations'],
    queryFn: async () => (await api.get('/stations')).data,
  });
  const stationId = user?.stationId || stations?.[0]?.id;

  const { data: expenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => (await api.get('/expenses')).data,
  });
  const { data: deposits } = useQuery({
    queryKey: ['deposits'],
    queryFn: async () => (await api.get('/deposits')).data,
  });

  const canApprove =
    user?.role === 'STATION_MANAGER' ||
    user?.role === 'OPERATIONS_MANAGER' ||
    user?.role === 'FINANCE_MANAGER' ||
    user?.role === 'SYSTEM_ADMIN' ||
    user?.role === 'DIRECTOR';

  const approveMutation = useMutation({
    mutationFn: async (id: string) =>
      (await api.post(`/expenses/${id}/approve`)).data,
    onSuccess: () => {
      setMessage('Expense approved and posted to GL');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const expenseMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post('/expenses', {
          stationId,
          category,
          description,
          amount,
          expenseDate: new Date().toISOString().slice(0, 10),
          paymentMethod: 'CASH',
        })
      ).data,
    onSuccess: () => {
      setMessage('Expense recorded');
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const depositMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post('/deposits', {
          stationId,
          depositDate: new Date().toISOString().slice(0, 10),
          amount: depositAmount,
          bankName: 'National Bank of Malawi',
          slipNumber: `SLIP-${Date.now().toString().slice(-6)}`,
        })
      ).data,
    onSuccess: () => {
      setMessage('Bank deposit recorded');
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
    },
  });

  function onExpense(e: FormEvent) {
    e.preventDefault();
    expenseMutation.mutate();
  }

  function onDeposit(e: FormEvent) {
    e.preventDefault();
    depositMutation.mutate();
  }

  return (
    <div className="stack">
      <PageHeader
        title="Cash & expenses"
        subtitle="Station expenses and bank deposit tracking"
      />
      {message && <div className="success">{message}</div>}

      <div className="grid two">
        <form className="panel stack" onSubmit={onExpense}>
          <h3 style={{ marginTop: 0 }}>Record expense</h3>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {[
                'Transport',
                'Electricity',
                'Fuel',
                'Security',
                'Maintenance',
                'Internet',
                'Stationery',
                'Other',
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Description
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </label>
          <label>
            Amount
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
            />
          </label>
          <button className="btn btn-primary">Save expense</button>
        </form>

        <form className="panel stack" onSubmit={onDeposit}>
          <h3 style={{ marginTop: 0 }}>Record bank deposit</h3>
          <label>
            Amount deposited
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(Number(e.target.value))}
              required
            />
          </label>
          <button className="btn btn-accent">Save deposit</button>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Slip</th>
                </tr>
              </thead>
              <tbody>
                {(deposits ?? []).slice(0, 5).map(
                  (d: {
                    id: string;
                    depositDate: string;
                    amount: string;
                    slipNumber?: string;
                  }) => (
                    <tr key={d.id}>
                      <td>{d.depositDate}</td>
                      <td>{formatMoney(d.amount)}</td>
                      <td>{d.slipNumber}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </form>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Recent expenses</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                {canApprove && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {(expenses ?? []).map(
                (e: {
                  id: string;
                  expenseDate: string;
                  category: string;
                  description: string;
                  amount: string;
                  status: string;
                }) => (
                  <tr key={e.id}>
                    <td>{e.expenseDate}</td>
                    <td>{e.category}</td>
                    <td>{e.description}</td>
                    <td>{formatMoney(e.amount)}</td>
                    <td>
                      <span className="badge">{e.status}</span>
                    </td>
                    {canApprove && (
                      <td>
                        {e.status === 'SUBMITTED' && (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => approveMutation.mutate(e.id)}
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
