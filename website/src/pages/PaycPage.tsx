import { Link } from 'react-router-dom';
import {
  Flame,
  Shield,
  Phone,
  Smartphone,
  Check,
  AlertTriangle,
  Home,
  Truck,
  Wallet,
  RefreshCw,
} from 'lucide-react';
import {
  CONTACT_EMAIL,
  PAYC_USSD_DIAL,
  PAYC_USSD_HREF,
  PRIMARY_PHONE,
} from '../config/contact';
import {
  PAYC_ACQUISITION_STEPS,
  PAYC_BENEFITS,
  PAYC_SAFETY,
  PAYC_TOPUP_STEPS,
} from '../config/payc';

const benefitIcons = [Wallet, Flame, Shield, Smartphone, RefreshCw, Phone] as const;

const acquisitionIcons = [Phone, Check, Truck, Wallet, Flame, RefreshCw] as const;

export const PaycPage = () => {
  return (
    <div className="bg-haroti-paper">
      <section className="relative bg-gradient-to-r from-haroti-green to-haroti-blue text-white py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-widest text-white/70 mb-3">How Haroti PAYC Works</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Pay-As-You-Cook (PAYC)</h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8">
              Smart, affordable clean cooking — sign up, get installed, top up with mobile money, and
              never worry about running out of gas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={PAYC_USSD_HREF}
                className="bg-haroti-paper text-haroti-blue hover:bg-haroti-mist font-semibold py-3 px-6 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <Phone size={20} />
                Dial {PAYC_USSD_DIAL}
              </a>
              <a
                href={`tel:${PRIMARY_PHONE.href}`}
                className="border-2 border-white text-white hover:bg-haroti-paper hover:text-haroti-blue font-semibold py-3 px-6 rounded-lg transition-all inline-flex items-center justify-center gap-2"
              >
                <Phone size={20} />
                Call {PRIMARY_PHONE.display}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-heading">Why PAYC?</h2>
            <p className="section-subheading max-w-2xl mx-auto">
              The same pay-as-you-go model trusted across East Africa — adapted for Malawian households
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PAYC_BENEFITS.map((benefit, index) => {
              const Icon = benefitIcons[index] ?? Flame;
              return (
                <div
                  key={benefit.title}
                  className="bg-haroti-paper rounded-xl p-6 shadow-md border border-haroti-mist hover:border-haroti-green/40 transition-colors"
                >
                  <div className="w-12 h-12 bg-haroti-green/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="text-haroti-green" size={24} />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                  <p className="text-haroti-muted text-sm">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-haroti-mist">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-heading">How To Get PAYC</h2>
            <p className="section-subheading">From sign-up to your first meal — six simple steps</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {PAYC_ACQUISITION_STEPS.map((item, index) => {
              const Icon = acquisitionIcons[index] ?? Home;
              return (
                <div key={item.step} className="bg-haroti-paper rounded-xl p-6 shadow-md relative">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="text-2xl font-bold text-haroti-blue/30 leading-none mb-2">
                        {item.step}
                      </div>
                      <div className="w-10 h-10 bg-haroti-blue/10 rounded-full flex items-center justify-center">
                        <Icon className="text-haroti-blue" size={20} />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                      <p className="text-haroti-muted text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-heading">How To Top Up PAYC</h2>
            <p className="section-subheading">
              Add credit in minutes using USSD — works on any phone
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {PAYC_TOPUP_STEPS.map((step) => (
                <div
                  key={step.step}
                  className="flex gap-4 bg-haroti-paper rounded-xl p-5 shadow-sm border border-haroti-mist"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-haroti-green text-white rounded-full flex items-center justify-center font-bold">
                    {step.step}
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">{step.title}</h3>
                    <p className="text-haroti-muted text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-haroti-muted mt-8">
              You can also top up via the Haroti Gas mobile app or at any Haroti station with cash or
              mobile money.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-haroti-mist">
        <div className="container-custom">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 bg-red-50 text-red-700 px-6 py-3 rounded-full mb-6">
              <Shield size={24} />
              <span className="font-semibold">Safety Guidelines</span>
            </div>
            <h2 className="section-heading">Cook Safely with PAYC</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[PAYC_SAFETY.detectLeak, PAYC_SAFETY.leakResponse, PAYC_SAFETY.fireEmergency].map(
              (section) => (
                <div key={section.title} className="bg-haroti-paper rounded-xl p-6 shadow-md">
                  <h3 className="font-bold text-lg mb-4 text-haroti-green">{section.title}</h3>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-haroti-muted">
                        <span className="text-haroti-green mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ),
            )}
          </div>

          <div className="max-w-3xl mx-auto mt-10 bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-red-900 mb-2">Emergency contact</h3>
                <p className="text-red-800 text-sm mb-3">
                  If you smell gas or need urgent help, call us immediately:
                </p>
                <a
                  href={`tel:${PRIMARY_PHONE.href}`}
                  className="font-bold text-red-900 underline hover:text-red-700"
                >
                  {PRIMARY_PHONE.display}
                </a>
                <span className="text-red-800 text-sm"> or </span>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-bold text-red-900 underline hover:text-red-700"
                >
                  {CONTACT_EMAIL}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-haroti-green to-haroti-blue text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Upgrade your home with Haroti PAYC</h2>
          <p className="text-xl mb-8 text-white/80 max-w-2xl mx-auto">
            Dial {PAYC_USSD_DIAL} or call {PRIMARY_PHONE.display} to enjoy clean cooking today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={PAYC_USSD_HREF}
              className="bg-haroti-paper text-haroti-blue hover:bg-haroti-mist font-semibold py-3 px-8 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
            >
              <Phone size={20} />
              Dial {PAYC_USSD_DIAL}
            </a>
            <Link
              to="/stations"
              className="border-2 border-white text-white hover:bg-haroti-paper hover:text-haroti-blue font-semibold py-3 px-8 rounded-lg transition-all inline-flex items-center justify-center"
            >
              Find a Station
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
