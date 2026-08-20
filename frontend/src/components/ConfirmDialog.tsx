import { AlertTriangle, HelpCircle, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useConfirmStore } from '../store/confirm';

export function ConfirmDialog() {
  const open = useConfirmStore((s) => s.open);
  const options = useConfirmStore((s) => s.options);
  const close = useConfirmStore((s) => s.close);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(false);
    };

    window.addEventListener('keydown', onKeyDown);
    confirmRef.current?.focus();
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  if (!open || !options) return null;

  const isDanger = options.variant === 'danger';
  const Icon = isDanger ? AlertTriangle : HelpCircle;

  return (
    <div
      className="confirm-overlay"
      role="presentation"
      onClick={() => close(false)}
    >
      <div
        className={`confirm-dialog confirm-dialog--${options.variant ?? 'default'}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={options.detail ? 'confirm-detail' : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="confirm-close"
          aria-label="Close"
          onClick={() => close(false)}
        >
          <X size={18} />
        </button>
        <div className="confirm-icon-wrap">
          <Icon size={28} aria-hidden />
        </div>
        <h2 id="confirm-title" className="confirm-title">
          {options.title}
        </h2>
        {options.detail ? (
          <p id="confirm-detail" className="confirm-detail">
            {options.detail}
          </p>
        ) : null}
        <div className="confirm-actions">
          <button type="button" className="btn btn-ghost" onClick={() => close(false)}>
            {options.cancelLabel ?? 'Cancel'}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={isDanger ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={() => close(true)}
          >
            {options.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
