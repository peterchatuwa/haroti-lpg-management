import { CheckCircle2, Info, Loader2, X, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useToastStore, type ToastItem } from '../store/toast';

function ToastIcon({ type }: { type: ToastItem['type'] }) {
  if (type === 'success') return <CheckCircle2 size={22} className="toast-icon toast-icon--success" />;
  if (type === 'error') return <XCircle size={22} className="toast-icon toast-icon--error" />;
  if (type === 'loading') {
    return <Loader2 size={22} className="toast-icon toast-icon--loading spin" />;
  }
  return <Info size={22} className="toast-icon toast-icon--info" />;
}

function ToastCard({ toast }: { toast: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    if (toast.duration == null) return;
    const remaining = toast.duration - (Date.now() - toast.createdAt);
    const timeout = window.setTimeout(
      () => dismiss(toast.id),
      Math.max(remaining, 0),
    );
    return () => window.clearTimeout(timeout);
  }, [toast.id, toast.duration, toast.createdAt, dismiss]);

  return (
    <div
      className={`toast toast--${toast.type}`}
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <ToastIcon type={toast.type} />
      <div className="toast-body">
        <strong>{toast.title}</strong>
        {toast.detail ? <p>{toast.detail}</p> : null}
        {toast.reference ? (
          <p className="toast-ref">Ref: {toast.reference}</p>
        ) : null}
      </div>
      <button
        type="button"
        className="toast-close"
        aria-label="Dismiss"
        onClick={() => dismiss(toast.id)}
      >
        <X size={16} />
      </button>
      {toast.duration != null ? (
        <span
          className="toast-progress"
          style={{ animationDuration: `${toast.duration}ms` }}
        />
      ) : null}
    </div>
  );
}

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);

  if (!toasts.length) return null;

  return (
    <div className="toast-host" aria-label="Notifications">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  );
}
