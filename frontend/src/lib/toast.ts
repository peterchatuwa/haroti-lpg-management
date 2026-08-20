import { useToastStore, type ToastType } from '../store/toast';
import type { PaymentStatusInfo } from '../components/PaymentStatusBanner';
import { paychanguStatusToBanner } from '../components/PaymentStatusBanner';

type ToastOptions = {
  detail?: string;
  reference?: string;
  duration?: number | null;
};

function push(type: ToastType, title: string, options: ToastOptions = {}) {
  const { push } = useToastStore.getState();
  return push({
    type,
    title,
    detail: options.detail,
    reference: options.reference,
    duration:
      options.duration !== undefined
        ? options.duration
        : type === 'loading'
          ? null
          : type === 'error'
            ? 9000
            : 6500,
  });
}

export const toast = {
  success(title: string, options?: ToastOptions) {
    return push('success', title, options);
  },
  error(title: string, options?: ToastOptions) {
    return push('error', title, options);
  },
  info(title: string, options?: ToastOptions) {
    return push('info', title, options);
  },
  loading(title: string, options?: ToastOptions) {
    return push('loading', title, { ...options, duration: null });
  },
  update(id: string, patch: { title?: string; detail?: string; reference?: string; type?: ToastType }) {
    useToastStore.getState().update(id, patch);
  },
  dismiss(id: string) {
    useToastStore.getState().dismiss(id);
  },
  clear() {
    useToastStore.getState().clear();
  },
};

let activePaymentToastId: string | null = null;
let activeTxnToastId: string | null = null;

function dismissActiveTxnToast() {
  if (activeTxnToastId) {
    toast.dismiss(activeTxnToastId);
    activeTxnToastId = null;
  }
}

export const paymentToast = {
  processing(title: string, options?: ToastOptions) {
    dismissActiveTxnToast();
    if (activePaymentToastId) {
      toast.dismiss(activePaymentToastId);
    }
    activePaymentToastId = toast.loading(title, options);
    return activePaymentToastId;
  },
  success(title: string, options?: ToastOptions) {
    dismissActiveTxnToast();
    if (activePaymentToastId) {
      toast.dismiss(activePaymentToastId);
      activePaymentToastId = null;
    }
    return toast.success(title, options);
  },
  failed(title: string, options?: ToastOptions) {
    dismissActiveTxnToast();
    if (activePaymentToastId) {
      toast.dismiss(activePaymentToastId);
      activePaymentToastId = null;
    }
    return toast.error(title, { ...options, duration: 10000 });
  },
  updateDetail(detail: string) {
    if (activePaymentToastId) {
      toast.update(activePaymentToastId, { detail });
    }
  },
  dismiss() {
    if (activePaymentToastId) {
      toast.dismiss(activePaymentToastId);
      activePaymentToastId = null;
    }
  },
};

export const txnToast = {
  processing(title: string, options?: ToastOptions) {
    dismissActiveTxnToast();
    activeTxnToastId = toast.loading(title, options);
    return activeTxnToastId;
  },
  success(title: string, options?: ToastOptions) {
    dismissActiveTxnToast();
    return toast.success(title, options);
  },
  failed(title: string, options?: ToastOptions) {
    dismissActiveTxnToast();
    return toast.error(title, { ...options, duration: 9000 });
  },
  dismiss() {
    dismissActiveTxnToast();
  },
};

export function notifyPaymentStatus(status: PaymentStatusInfo) {
  if (status.state === 'waiting') {
    paymentToast.processing(status.title, {
      detail: status.detail,
      reference: status.reference,
    });
    return;
  }
  if (status.state === 'success') {
    paymentToast.success(status.title, {
      detail: status.detail,
      reference: status.reference,
    });
    return;
  }
  paymentToast.failed(status.title, {
    detail: status.detail,
    reference: status.reference,
  });
}

export function notifyPaychanguStatus(
  status: string,
  options?: { amount?: number; reference?: string; failureReason?: string },
) {
  const banner = paychanguStatusToBanner(status, options);
  if (banner) notifyPaymentStatus(banner);
}
