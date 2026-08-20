export type PaymentBannerState = 'waiting' | 'success' | 'failed';

export interface PaymentStatusInfo {
  state: PaymentBannerState;
  title: string;
  detail?: string;
  reference?: string;
}

export function PaymentStatusBanner({ status }: { status: PaymentStatusInfo | null }) {
  if (!status) return null;

  const className =
    status.state === 'success'
      ? 'payment-status payment-status--success'
      : status.state === 'failed'
        ? 'payment-status payment-status--failed'
        : 'payment-status payment-status--waiting';

  return (
    <div className={className} role="status" aria-live="polite">
      <strong>{status.title}</strong>
      {status.detail ? <p>{status.detail}</p> : null}
      {status.reference ? (
        <p className="payment-status-ref">Reference: {status.reference}</p>
      ) : null}
    </div>
  );
}

export function paychanguStatusToBanner(
  status: string,
  options?: { amount?: number; reference?: string; failureReason?: string },
): PaymentStatusInfo | null {
  const reference = options?.reference;
  const amountLabel =
    options?.amount != null
      ? new Intl.NumberFormat('en-MW', {
          style: 'currency',
          currency: 'MWK',
          maximumFractionDigits: 0,
        }).format(options.amount)
      : null;

  if (status === 'COMPLETED') {
    return {
      state: 'success',
      title: 'Payment successful',
      detail: amountLabel
        ? `${amountLabel} received via PayChangu.`
        : 'PayChangu confirmed this payment.',
      reference,
    };
  }

  if (status === 'FAILED' || status === 'CANCELLED' || status === 'EXPIRED') {
    const reason =
      options?.failureReason ||
      (status === 'CANCELLED'
        ? 'Payment was cancelled.'
        : status === 'EXPIRED'
          ? 'Payment expired before confirmation.'
          : 'Payment was not completed.');
    return {
      state: 'failed',
      title: 'Payment failed',
      detail: reason,
      reference,
    };
  }

  if (status === 'PENDING' || status === 'PROCESSING') {
    return {
      state: 'waiting',
      title: 'Waiting for PayChangu',
      detail: 'Approve the mobile money prompt on the customer phone.',
      reference,
    };
  }

  return null;
}
