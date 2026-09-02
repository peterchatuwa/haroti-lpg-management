import { useState } from 'react';
import { Briefcase, Users, TrendingUp, Heart, Send, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { FormInput } from '../components/forms/FormInput';
import { FormTextarea } from '../components/forms/FormTextarea';
import { FormSelect } from '../components/forms/FormSelect';
import { openPositions } from '../data/careers';

export const CareersPage = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedJob, setExpandedJob] = useState<number | null>(0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setFormSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-haroti-paper">
      <section className="relative bg-gradient-to-r from-haroti-orange to-haroti-flame-hot text-white py-16 md:py-24">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Careers at Haroti Gas</h1>
          <p className="text-xl md:text-2xl text-white/80">
            Join our team and help power Malawi's clean energy revolution
          </p>
        </div>
      </section>

      {formSubmitted && (
        <section className="py-8 bg-green-50 border-b-4 border-green-500">
          <div className="container-custom text-green-800">
            <strong>Application Submitted!</strong> Our HR team will review and contact you soon.
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="container-custom">
          <h2 className="section-heading text-center mb-12">Why Work at Haroti Gas?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-haroti-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="text-haroti-forest" size={32} />
              </div>
              <h3 className="font-bold mb-2">Growth Opportunity</h3>
              <p className="text-haroti-muted text-sm">Expanding company with career advancement</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-haroti-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="text-haroti-orange" size={32} />
              </div>
              <h3 className="font-bold mb-2">Meaningful Work</h3>
              <p className="text-haroti-muted text-sm">Make a real difference in communities</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-haroti-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-haroti-green" size={32} />
              </div>
              <h3 className="font-bold mb-2">Great Team</h3>
              <p className="text-haroti-muted text-sm">Collaborative, supportive culture</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="text-purple-600" size={32} />
              </div>
              <h3 className="font-bold mb-2">Competitive Benefits</h3>
              <p className="text-haroti-muted text-sm">Fair compensation and benefits</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-haroti-paper">
        <div className="container-custom">
          <h2 className="section-heading text-center mb-4">Current Openings</h2>
          <p className="text-center text-haroti-muted mb-12 max-w-2xl mx-auto">
            We are actively recruiting for the roles below. Click a position to view details, then
            apply using the form at the bottom of the page.
          </p>
          <div className="max-w-4xl mx-auto space-y-4">
            {openPositions.map((job, idx) => (
              <div key={job.title} className="bg-haroti-paper rounded-lg shadow-md overflow-hidden">
                <button
                  type="button"
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-haroti-mist/30 transition-colors"
                  onClick={() => setExpandedJob(expandedJob === idx ? null : idx)}
                >
                  <div>
                    <h3 className="font-bold text-lg mb-1">{job.title}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-haroti-muted">
                      <span>{job.location}</span>
                      <span>•</span>
                      <span>{job.type}</span>
                      <span>•</span>
                      <span>{job.department}</span>
                    </div>
                  </div>
                  {expandedJob === idx ? (
                    <ChevronUp className="text-haroti-muted flex-shrink-0" size={20} />
                  ) : (
                    <ChevronDown className="text-haroti-muted flex-shrink-0" size={20} />
                  )}
                </button>
                {expandedJob === idx && (
                  <div className="px-6 pb-6 border-t border-haroti-muted/20">
                    <p className="text-haroti-ink/90 mt-4 mb-6">{job.summary}</p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-bold mb-2">Key responsibilities</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-haroti-muted">
                          {job.responsibilities.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold mb-2">Requirements</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-haroti-muted">
                          {job.requirements.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <a href="#apply" className="btn-secondary inline-block mt-6 text-sm py-2 px-4">
                      Apply for this role
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="apply" className="py-16">
        <div className="container-custom max-w-3xl">
          <h2 className="section-heading text-center mb-8">Apply for a Position</h2>
          <div className="bg-haroti-paper rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormInput label="First Name" name="firstName" required />
                <FormInput label="Last Name" name="lastName" required />
                <FormInput label="Email" name="email" type="email" required />
                <FormInput label="Phone" name="phone" type="tel" required />
              </div>
              <FormSelect
                label="Position Applying For"
                name="position"
                options={openPositions.map((job) => ({ value: job.title, label: job.title }))}
                required
              />
              <FormTextarea
                label="Cover Letter"
                name="coverLetter"
                required
                rows={6}
                placeholder="Tell us why you're a great fit..."
              />
              <div>
                <label className="block text-sm font-semibold text-haroti-ink/90 mb-2">
                  Upload CV/Resume <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-haroti-muted/30 rounded-lg p-6 text-center">
                  <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-sm text-haroti-muted">Click to upload or drag and drop</p>
                  <p className="text-xs text-haroti-muted">PDF, DOC, DOCX (Max 5MB)</p>
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={20} />
                )}
                <span>{isSubmitting ? 'Submitting...' : 'Submit Application'}</span>
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};
