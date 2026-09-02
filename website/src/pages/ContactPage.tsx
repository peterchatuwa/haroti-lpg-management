import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { FormInput } from '../components/forms/FormInput';
import { FormTextarea } from '../components/forms/FormTextarea';
import { FormSelect } from '../components/forms/FormSelect';
import { CONTACT_ADDRESS_LINES, CONTACT_EMAIL, CONTACT_PHONES } from '../config/contact';
import { formDataToObject, submitContactForm } from '../lib/api';

export const ContactPage = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitContactForm(formDataToObject(e.currentTarget));
      setFormSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      e.currentTarget.reset();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-haroti-paper">
      <section className="relative bg-gradient-to-r from-haroti-forest to-haroti-forest-deep text-white py-16 md:py-24">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
          <p className="text-xl md:text-2xl text-white/80">
            We're here to help. Get in touch with us today.
          </p>
        </div>
      </section>

      {formSubmitted && (
        <section className="py-8 bg-green-50 border-b-4 border-green-500">
          <div className="container-custom text-green-800">
            <strong>Message Sent!</strong> We'll respond within 24 hours.
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-8">Get in Touch</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-haroti-forest/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-haroti-forest" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Head Office</h3>
                    <p className="text-haroti-muted">
                      {CONTACT_ADDRESS_LINES.map((line, index) => (
                        <span key={line}>
                          {line}
                          {index < CONTACT_ADDRESS_LINES.length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-haroti-orange/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="text-haroti-orange" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Phone</h3>
                    <p className="text-haroti-muted space-y-1">
                      {CONTACT_PHONES.map((phone) => (
                        <a
                          key={phone.href}
                          href={`tel:${phone.href}`}
                          className="block text-haroti-forest hover:text-haroti-orange transition-colors"
                        >
                          {phone.display}
                        </a>
                      ))}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-haroti-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="text-haroti-green" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Email</h3>
                    <p className="text-haroti-muted">
                      <a
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="text-haroti-forest hover:text-haroti-orange transition-colors"
                      >
                        {CONTACT_EMAIL}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Office Hours</h3>
                    <p className="text-haroti-muted">
                      Monday - Friday: 8:00 AM - 5:00 PM
                      <br />
                      Saturday: 8:00 AM - 1:00 PM
                      <br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-haroti-paper rounded-xl p-8 shadow-md">
              <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                <div className="grid md:grid-cols-2 gap-6">
                  <FormInput label="First Name" name="firstName" required />
                  <FormInput label="Last Name" name="lastName" required />
                </div>

                <FormInput label="Email Address" name="email" type="email" required />
                <FormInput label="Phone Number" name="phone" type="tel" />

                <FormSelect
                  label="Subject"
                  name="subject"
                  options={[
                    { value: 'general', label: 'General Enquiry' },
                    { value: 'payc', label: 'PAYC Programme' },
                    { value: 'franchise', label: 'Franchise Information' },
                    { value: 'support', label: 'Customer Support' },
                    { value: 'complaint', label: 'Complaint' },
                    { value: 'other', label: 'Other' },
                  ]}
                  required
                />

                <FormTextarea
                  label="Message"
                  name="message"
                  required
                  rows={5}
                  placeholder="How can we help you?"
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
                {submitError && (
                  <p className="text-sm text-red-600 text-center">{submitError}</p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
