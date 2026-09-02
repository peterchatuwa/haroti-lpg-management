import { useState } from 'react';
import { Users, TrendingUp, Heart, Award, Check, Send } from 'lucide-react';
import { FormInput } from '../components/forms/FormInput';
import { FormTextarea } from '../components/forms/FormTextarea';
import { FormSelect } from '../components/forms/FormSelect';
import { PRIMARY_PHONE } from '../config/contact';

export const FranchisePage = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setFormSubmitted(true);
    
    // Scroll to success message
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const benefits = [
    'Proven business model with ongoing support',
    'Access to established supply chain',
    'Marketing and brand support',
    'Training and technical assistance',
    'Priority pricing for franchisees',
    'Women and youth-led programme priority',
    'Flexible investment packages',
    'Growing market with strong demand',
  ];

  const requirements = [
    'Malawian citizen or registered business',
    'Suitable location in target area',
    'Basic business management skills',
    'Commitment to safety standards',
    'Initial capital investment (varies by location)',
    'Willingness to undergo training',
  ];

  const districts = [
    { value: 'salima', label: 'Salima' },
    { value: 'lilongwe', label: 'Lilongwe' },
    { value: 'blantyre', label: 'Blantyre' },
    { value: 'mzuzu', label: 'Mzuzu' },
    { value: 'zomba', label: 'Zomba' },
    { value: 'mangochi', label: 'Mangochi' },
    { value: 'karonga', label: 'Karonga' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="bg-haroti-paper">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-haroti-orange to-haroti-flame-hot text-white py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Franchise Opportunities</h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8">
              Join our growing network of women- and youth-led LPG distribution stations across Malawi
            </p>
            <a href="#apply" className="bg-haroti-paper text-haroti-orange hover:bg-haroti-mist font-semibold py-3 px-8 rounded-lg transition-colors inline-block">
              Apply Now
            </a>
          </div>
        </div>
      </section>

      {/* Success Message */}
      {formSubmitted && (
        <section className="py-8 bg-green-50 border-b-4 border-green-500">
          <div className="container-custom">
            <div className="flex items-center gap-4 text-green-800">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                <Check size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Application Submitted Successfully!</h3>
                <p className="text-green-700">
                  Thank you for your interest. Our Franchise Compliance Manager will review your application 
                  and contact you within 5 business days.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Why Franchise */}
      <section className="py-16 md:py-24">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-heading">Why Choose a Haroti Gas Franchise?</h2>
            <p className="section-subheading max-w-2xl mx-auto">
              Be part of Malawi's clean energy revolution while building a sustainable business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-haroti-paper p-6 rounded-xl shadow-md text-center">
              <div className="w-16 h-16 bg-haroti-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="text-haroti-forest" size={32} />
              </div>
              <h3 className="font-bold text-lg mb-3">Growing Market</h3>
              <p className="text-haroti-muted text-sm">
                Expanding demand for clean cooking solutions across Malawi
              </p>
            </div>

            <div className="bg-haroti-paper p-6 rounded-xl shadow-md text-center">
              <div className="w-16 h-16 bg-haroti-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="text-haroti-orange" size={32} />
              </div>
              <h3 className="font-bold text-lg mb-3">Proven Model</h3>
              <p className="text-haroti-muted text-sm">
                Established business systems and ongoing operational support
              </p>
            </div>

            <div className="bg-haroti-paper p-6 rounded-xl shadow-md text-center">
              <div className="w-16 h-16 bg-haroti-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="text-haroti-green" size={32} />
              </div>
              <h3 className="font-bold text-lg mb-3">Social Impact</h3>
              <p className="text-haroti-muted text-sm">
                Make a difference while earning a sustainable income
              </p>
            </div>

            <div className="bg-haroti-paper p-6 rounded-xl shadow-md text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-purple-600" size={32} />
              </div>
              <h3 className="font-bold text-lg mb-3">Priority Support</h3>
              <p className="text-haroti-muted text-sm">
                Women and youth-led initiatives receive special consideration
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits & Requirements */}
      <section className="py-16 bg-haroti-paper">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Benefits */}
            <div>
              <h2 className="text-3xl font-bold mb-6">Franchise Benefits</h2>
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3 bg-haroti-paper p-4 rounded-lg shadow-sm">
                    <Check className="text-haroti-green flex-shrink-0 mt-1" size={20} />
                    <span className="text-haroti-ink/90">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div>
              <h2 className="text-3xl font-bold mb-6">Basic Requirements</h2>
              <div className="space-y-3">
                {requirements.map((requirement, index) => (
                  <div key={index} className="flex items-start gap-3 bg-haroti-paper p-4 rounded-lg shadow-sm">
                    <Check className="text-haroti-forest flex-shrink-0 mt-1" size={20} />
                    <span className="text-haroti-ink/90">{requirement}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-heading">How the Franchise Process Works</h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-haroti-orange rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                  1
                </div>
                <h3 className="font-bold mb-2">Apply</h3>
                <p className="text-sm text-haroti-muted">Submit your application online</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-haroti-orange rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                  2
                </div>
                <h3 className="font-bold mb-2">Review</h3>
                <p className="text-sm text-haroti-muted">We assess your application and location</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-haroti-orange rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                  3
                </div>
                <h3 className="font-bold mb-2">Training</h3>
                <p className="text-sm text-haroti-muted">Complete our franchise training programme</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-haroti-orange rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                  4
                </div>
                <h3 className="font-bold mb-2">Launch</h3>
                <p className="text-sm text-haroti-muted">Open your station with our support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="py-16 bg-haroti-paper">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="section-heading">Franchise Application Form</h2>
              <p className="text-haroti-muted">
                Fill out the form below to start your journey as a Haroti Gas franchisee
              </p>
            </div>

            <div className="bg-haroti-paper rounded-xl shadow-lg p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-xl font-bold mb-4 pb-2 border-b">Personal Information</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormInput
                      label="First Name"
                      name="firstName"
                      required
                      placeholder="Enter your first name"
                    />
                    <FormInput
                      label="Last Name"
                      name="lastName"
                      required
                      placeholder="Enter your last name"
                    />
                    <FormInput
                      label="Email Address"
                      name="email"
                      type="email"
                      required
                      placeholder="your@email.com"
                    />
                    <FormInput
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      required
                      placeholder={PRIMARY_PHONE.display}
                    />
                    <FormInput
                      label="National ID Number"
                      name="nationalId"
                      required
                      placeholder="Enter your National ID"
                    />
                    <FormInput
                      label="Date of Birth"
                      name="dateOfBirth"
                      type="date"
                      required
                    />
                  </div>
                </div>

                {/* Location Information */}
                <div>
                  <h3 className="text-xl font-bold mb-4 pb-2 border-b">Proposed Location</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormSelect
                      label="Preferred District"
                      name="district"
                      options={districts}
                      required
                    />
                    <FormInput
                      label="Town/Area"
                      name="town"
                      required
                      placeholder="Enter town or area name"
                    />
                  </div>
                  <div className="mt-6">
                    <FormTextarea
                      label="Proposed Location Details"
                      name="locationDetails"
                      required
                      placeholder="Describe the proposed location (e.g., near market, main road, etc.)"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Business Experience */}
                <div>
                  <h3 className="text-xl font-bold mb-4 pb-2 border-b">Background</h3>
                  <div className="space-y-6">
                    <FormSelect
                      label="Do you have previous business experience?"
                      name="hasExperience"
                      options={[
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' },
                      ]}
                      required
                    />
                    <FormTextarea
                      label="Why do you want to become a Haroti Gas franchisee?"
                      name="motivation"
                      required
                      placeholder="Tell us about your motivation and goals"
                      rows={4}
                    />
                    <FormSelect
                      label="Available Capital Investment Range"
                      name="capitalRange"
                      options={[
                        { value: 'under-500k', label: 'Under MWK 500,000' },
                        { value: '500k-1m', label: 'MWK 500,000 - 1,000,000' },
                        { value: '1m-2m', label: 'MWK 1,000,000 - 2,000,000' },
                        { value: 'over-2m', label: 'Over MWK 2,000,000' },
                      ]}
                      required
                    />
                  </div>
                </div>

                {/* Women/Youth Programme */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                  <h3 className="font-bold mb-4 text-purple-900">
                    Women & Youth-Led Programme
                  </h3>
                  <div className="space-y-4">
                    <FormSelect
                      label="Are you applying under the women or youth-led programme?"
                      name="specialProgramme"
                      options={[
                        { value: 'none', label: 'Not applicable' },
                        { value: 'women', label: 'Yes - Women-led' },
                        { value: 'youth', label: 'Yes - Youth-led (under 35)' },
                      ]}
                      required
                    />
                    <p className="text-sm text-purple-800">
                      Women and youth-led applications receive priority consideration and additional support.
                    </p>
                  </div>
                </div>

                {/* Additional Comments */}
                <div>
                  <FormTextarea
                    label="Additional Information (Optional)"
                    name="additionalInfo"
                    placeholder="Any additional information you'd like to share"
                    rows={3}
                  />
                </div>

                {/* Terms */}
                <div className="bg-haroti-paper p-6 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      className="mt-1 w-5 h-5 text-haroti-forest focus:ring-haroti-forest border-haroti-muted/30 rounded"
                    />
                    <span className="text-sm text-haroti-ink/90">
                      I confirm that the information provided is accurate and complete. I understand that 
                      Haroti Gas will review my application and contact me regarding next steps. I agree 
                      to the terms and conditions of the franchise programme.
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-haroti-orange hover:bg-haroti-flame-hot disabled:bg-gray-400 text-white font-bold py-4 px-8 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      <span>Submit Application</span>
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-haroti-muted">
                  Applications are typically reviewed within 5 business days. You will receive 
                  confirmation via email and phone.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-haroti-forest text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Have Questions About Franchising?
          </h2>
          <p className="text-xl mb-8 text-white/80 max-w-2xl mx-auto">
            Our Franchise Compliance Manager is here to help you understand the process
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact" className="btn-primary">
              Contact Us
            </a>
            <a
              href={`tel:${PRIMARY_PHONE.href}`}
              className="bg-haroti-paper text-haroti-forest hover:bg-haroti-mist font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Call {PRIMARY_PHONE.display}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
