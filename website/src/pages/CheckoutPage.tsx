import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Send, ShoppingCart, Trash2 } from 'lucide-react';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { FormTextarea } from '../components/forms/FormTextarea';
import { formatMwk } from '../data/product-display';
import { fetchStations, submitOrder, type PublicStation } from '../lib/api';
import { useCart } from '../store/cart-context';

type FulfillmentType = 'pickup' | 'delivery' | 'installation';

export const CheckoutPage = () => {
  const { lines, subtotal, itemCount, setQuantity, removeItem, clearCart } = useCart();
  const [stations, setStations] = useState<PublicStation[]>([]);
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('pickup');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderReference, setOrderReference] = useState<string | null>(null);

  useEffect(() => {
    fetchStations().then(setStations).catch(() => setStations([]));
  }, []);

  const stationOptions = stations.map((s) => ({
    value: s.code,
    label: `${s.name} (${s.district})`,
  }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (lines.length === 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const form = new FormData(e.currentTarget);
    const get = (name: string) => String(form.get(name) ?? '').trim();

    try {
      const result = await submitOrder({
        firstName: get('firstName'),
        lastName: get('lastName'),
        email: get('email'),
        phone: get('phone'),
        nationalId: get('nationalId') || undefined,
        fulfillmentType,
        preferredStationCode: get('preferredStationCode') || undefined,
        deliveryAddress: get('deliveryAddress') || undefined,
        deliveryArea: get('deliveryArea') || undefined,
        deliveryDistrict: get('deliveryDistrict') || undefined,
        installationNotes: get('installationNotes') || undefined,
        customerNotes: get('customerNotes') || undefined,
        lines: lines.map((l) => ({ sku: l.sku, quantity: l.quantity })),
      });
      setOrderReference(result.orderReference);
      clearCart();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderReference) {
    return (
      <div className="bg-haroti-paper py-16">
        <div className="container-custom max-w-2xl text-center">
          <div className="bg-green-50 border border-green-200 rounded-xl p-8">
            <h1 className="text-2xl font-bold text-green-900 mb-4">Order request received</h1>
            <p className="text-green-800 mb-2">
              Reference: <strong>{orderReference}</strong>
            </p>
            <p className="text-green-800 mb-6">
              Our operations team has been notified and will contact you shortly to confirm your
              order, payment, and pickup, delivery, or installation arrangements.
            </p>
            <Link to="/store" className="btn-primary inline-block">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-haroti-paper py-10 md:py-14">
      <div className="container-custom">
        <div className="mb-8">
          <Link to="/store" className="text-haroti-forest hover:text-haroti-orange text-sm font-medium">
            ← Back to store
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">Checkout</h1>
          <p className="text-haroti-muted mt-2">
            Complete your details below. No payment is taken online — operations will follow up with
            you.
          </p>
        </div>

        {itemCount === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <ShoppingCart className="mx-auto text-haroti-muted mb-4" size={48} />
            <p className="text-haroti-muted mb-6">Your cart is empty.</p>
            <Link to="/store" className="btn-primary">
              Browse catalogue
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-10">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold">Your order</h2>
              {lines.map((line) => (
                <div
                  key={line.sku}
                  className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-3"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-semibold">{line.name}</p>
                      <p className="text-sm text-haroti-muted">{line.sku}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(line.sku)}
                      className="text-red-500 hover:text-red-700 p-1"
                      aria-label="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.sku, line.quantity - 1)}
                        className="w-8 h-8 rounded border border-haroti-mist flex items-center justify-center"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-medium">{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(line.sku, line.quantity + 1)}
                        disabled={line.quantity >= line.maxQuantity}
                        className="w-8 h-8 rounded border border-haroti-mist flex items-center justify-center disabled:opacity-40"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="font-semibold">{formatMwk(line.unitPrice * line.quantity)}</p>
                  </div>
                </div>
              ))}
              <div className="bg-haroti-forest text-white rounded-xl p-4 flex justify-between items-center">
                <span className="font-semibold">Estimated total</span>
                <span className="text-xl font-bold">{formatMwk(subtotal)}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white rounded-xl shadow-md p-6 md:p-8 space-y-8">
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

              <section>
                <h2 className="text-xl font-bold mb-4 pb-2 border-b">Your details</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <FormInput label="First name" name="firstName" required />
                  <FormInput label="Last name" name="lastName" required />
                  <FormInput label="Email" name="email" type="email" required />
                  <FormInput label="Phone (WhatsApp preferred)" name="phone" type="tel" required />
                  <div className="md:col-span-2">
                    <FormInput
                      label="National ID (optional)"
                      name="nationalId"
                      placeholder="For faster account setup"
                    />
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-4 pb-2 border-b">Fulfillment</h2>
                <div className="space-y-3 mb-6">
                  {(
                    [
                      ['pickup', 'Pickup at a Haroti station'],
                      ['delivery', 'Home / business delivery'],
                      ['installation', 'Delivery + installation (e.g. starter kit, PAYC setup)'],
                    ] as const
                  ).map(([value, label]) => (
                    <label
                      key={value}
                      className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer ${
                        fulfillmentType === value
                          ? 'border-haroti-orange bg-haroti-orange/5'
                          : 'border-haroti-mist'
                      }`}
                    >
                      <input
                        type="radio"
                        name="fulfillmentTypeUi"
                        checked={fulfillmentType === value}
                        onChange={() => setFulfillmentType(value)}
                        className="mt-1"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>

                {(fulfillmentType === 'pickup' || stationOptions.length > 0) && (
                  <FormSelect
                    label={
                      fulfillmentType === 'pickup'
                        ? 'Pickup station'
                        : 'Preferred station (optional)'
                    }
                    name="preferredStationCode"
                    options={[
                      ...(fulfillmentType !== 'pickup'
                        ? [{ value: '', label: 'No preference' }]
                        : []),
                      ...stationOptions,
                    ]}
                    required={fulfillmentType === 'pickup'}
                  />
                )}

                {fulfillmentType !== 'pickup' && (
                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div className="md:col-span-2">
                      <FormInput
                        label="Delivery address"
                        name="deliveryAddress"
                        required
                        placeholder="Street, plot, building"
                      />
                    </div>
                    <FormInput label="Area / landmark" name="deliveryArea" placeholder="e.g. Area 47" />
                    <FormInput label="District" name="deliveryDistrict" required />
                  </div>
                )}

                {fulfillmentType === 'installation' && (
                  <div className="mt-6">
                    <FormTextarea
                      label="Installation details"
                      name="installationNotes"
                      required
                      rows={4}
                      placeholder="Describe what needs to be installed, preferred dates, access instructions..."
                    />
                  </div>
                )}
              </section>

              <section>
                <FormTextarea
                  label="Additional notes (optional)"
                  name="customerNotes"
                  rows={3}
                  placeholder="Preferred contact time, special requests, etc."
                />
              </section>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary flex items-center justify-center gap-2 py-4"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting order...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Submit order request
                  </>
                )}
              </button>

              {submitError && (
                <p className="text-sm text-red-600 text-center">{submitError}</p>
              )}

              <p className="text-xs text-haroti-muted text-center">
                By submitting, you agree to be contacted by Haroti operations regarding this order.
                Prices are estimates until confirmed by our team.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
