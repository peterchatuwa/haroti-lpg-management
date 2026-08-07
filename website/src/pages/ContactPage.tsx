import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { FormInput } from '../components/forms/FormInput';
import { FormTextarea } from '../components/forms/FormTextarea';
import { FormSelect } from '../components/forms/FormSelect';

export const ContactPage = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setFormSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-haroti-blue to-blue-800 text-white py-16 md:py-24">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
          <p className="text-xl md:text-2xl text-blue-100">
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

      {/* Contact Info & Form */}
      <section className="py-16">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold mb-8">Get in Touch</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-haroti-blue/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-haroti-blue" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Head Office</h3>
                    <p className="text-gray-600">
                      Haroti Holdings Limited<br />
                      [Address Line 1]<br />
                      [City], Malawi
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-haroti-orange/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="text-haroti-orange" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Phone</h3>
                    <p className="text-gray-600">
                      General: <a href="tel:+265" className="text-haroti-blue hover:text-haroti-orange">+265 XXX XXX XXX</a><br />
                      Emergency: <a href="tel:+265" className="text-haroti-blue hover:text-haroti-orange">+265 XXX XXX XXX</a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-haroti-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="text-haroti-green" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Email</h3>
                    <p className="text-gray-600">
                      General: <a href="mailto:info@harotiholdingslimited.com" className="text-haroti-blue hover:text-haroti-orange">info@harotiholdingslimited.com</a><br />
                      Support: <a href="mailto:support@harotiholdingslimited.com" className="text-haroti-blue hover:text-haroti-orange">support@harotiholdingslimited.com</a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Office Hours</h3>
                    <p className="text-gray-600">
                      Monday - Friday: 8:00 AM - 5:00 PM<br />
                      Saturday: 8:00 AM - 1:00 PM<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="mt-8 pt-8 border-t">
                <h3 className="font-bold mb-4">Follow Us</h3>
                <div className="flex gap-3">
                  <a href="#" className="w-10 h-10 bg-haroti-blue hover:bg-blue-700 rounded-full flex items-center justify-center text-white transition-colors">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-haroti-blue hover:bg-blue-700 rounded-full flex items-center justify-center text-white transition-colors">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-haroti-blue hover:bg-blue-700 rounded-full flex items-center justify-center text-white transition-colors">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-gray-50 rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
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
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="h-96 bg-gray-200">
        <div className="h-full flex items-center justify-center text-gray-500">
          <div className="text-center">
            <MapPin className="mx-auto mb-2" size={48} />
            <p className="font-semibold">Map Integration</p>
            <p className="text-sm">Coming Soon</p>
          </div>
        </div>
      </section>
    </div>
  );
};
