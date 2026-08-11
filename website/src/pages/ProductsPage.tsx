import { Flame, Shield, Phone, CreditCard, Smartphone, DollarSign, Check, AlertTriangle } from 'lucide-react';

export const ProductsPage = () => {
  const cylinders = [
    { size: '6kg', price: 'MWK XXXX', usage: 'Perfect for 1-2 people', duration: '2-3 weeks' },
    { size: '9kg', price: 'MWK XXXX', usage: 'Ideal for small families', duration: '3-4 weeks' },
    { size: '13kg', price: 'MWK XXXX', usage: 'Most popular choice', duration: '4-6 weeks', popular: true },
    { size: '19kg', price: 'MWK XXXX', usage: 'Large families', duration: '6-8 weeks' },
    { size: '48kg', price: 'MWK XXXX', usage: 'Commercial & bulk users', duration: '12+ weeks' },
  ];

  const paycFeatures = [
    'No large upfront payment',
    'Flexible micro-installments',
    'Pay only for what you use',
    'Easy mobile money payments',
    'USSD & App access',
    '24/7 customer support',
    'Free starter kit delivery',
    'No hidden fees',
  ];

  const safetyTips = [
    'Always check for gas leaks before use',
    'Keep cylinders upright and well-ventilated',
    'Never use damaged or expired cylinders',
    'Turn off gas when not in use',
    'Keep away from heat sources and flames',
    'Store in cool, dry places away from sunlight',
    'Use only certified regulators and accessories',
    'Report any gas smell immediately',
  ];

  return (
    <div className="bg-haroti-paper">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-haroti-orange to-haroti-flame-hot text-white py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Products & Pay-As-You-Cook</h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8">
              Clean LPG cooking solutions with flexible payment options that fit your lifestyle
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="tel:*XXX#" className="bg-haroti-paper text-haroti-orange hover:bg-haroti-mist font-semibold py-3 px-6 rounded-lg transition-colors inline-flex items-center justify-center gap-2">
                <Phone size={20} />
                Dial *XXX# to Start
              </a>
              <a href="#" className="border-2 border-white text-white hover:bg-haroti-paper hover:text-haroti-orange font-semibold py-3 px-6 rounded-lg transition-all inline-flex items-center justify-center gap-2">
                <Smartphone size={20} />
                Download App
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* PAYC Overview */}
      <section className="py-16 md:py-24 bg-haroti-paper">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-heading">What is Pay-As-You-Cook (PAYC)?</h2>
            <p className="section-subheading max-w-3xl mx-auto">
              Revolutionary micro-installment model that makes clean LPG cooking affordable for everyone
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <div className="bg-haroti-paper rounded-2xl p-8 shadow-lg">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-haroti-orange/10 rounded-full flex items-center justify-center">
                    <Flame className="text-haroti-orange" size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">How PAYC Works</h3>
                    <p className="text-haroti-muted">Simple, flexible, affordable</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-haroti-orange rounded-full flex items-center justify-center text-white font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Sign Up</h4>
                      <p className="text-haroti-muted text-sm">Register via USSD (*XXX#) or mobile app in minutes</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-haroti-orange rounded-full flex items-center justify-center text-white font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Get Your Starter Kit</h4>
                      <p className="text-haroti-muted text-sm">Receive cylinder, regulator, and accessories—no large upfront cost</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-haroti-orange rounded-full flex items-center justify-center text-white font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Pay As You Use</h4>
                      <p className="text-haroti-muted text-sm">Make small payments via mobile money (Airtel Money, TNM Mpamba)</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-haroti-orange rounded-full flex items-center justify-center text-white font-bold">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Refill Anytime</h4>
                      <p className="text-haroti-muted text-sm">Visit any Haroti Gas station when you need a refill</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-6">PAYC Benefits</h3>
              <div className="grid grid-cols-2 gap-4">
                {paycFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="text-haroti-green flex-shrink-0 mt-1" size={20} />
                    <span className="text-haroti-ink/90">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-haroti-forest text-white rounded-xl p-6">
                <h4 className="text-xl font-bold mb-3">Target Impact</h4>
                <div className="text-4xl font-bold mb-2">150,000</div>
                <p className="text-white/80">
                  Active PAYC households by Year 5, transforming lives across Malawi
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LPG Cylinder Products */}
      <section className="py-16 md:py-24">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-heading">LPG Cylinder Sizes</h2>
            <p className="section-subheading">
              Choose the perfect size for your household needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {cylinders.map((cylinder) => (
              <div
                key={cylinder.size}
                className={`relative bg-haroti-paper rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow ${
                  cylinder.popular ? 'ring-2 ring-haroti-orange' : ''
                }`}
              >
                {cylinder.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-haroti-orange text-white text-xs font-bold px-3 py-1 rounded-full">
                      POPULAR
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-haroti-forest to-haroti-leaf-bright rounded-full flex items-center justify-center">
                    <Flame className="text-white" size={32} />
                  </div>
                  <div className="text-3xl font-bold text-haroti-forest mb-2">{cylinder.size}</div>
                  <div className="text-xl font-semibold text-haroti-ink/90 mb-4">{cylinder.price}</div>
                  <div className="space-y-2 text-sm text-haroti-muted">
                    <p className="font-semibold">{cylinder.usage}</p>
                    <p>Lasts: {cylinder.duration}</p>
                  </div>
                  <button className="mt-6 w-full bg-haroti-orange hover:bg-haroti-flame-hot text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                    Order Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-haroti-muted mb-4">
              * Prices and availability may vary by location. Contact your nearest station for current pricing.
            </p>
          </div>
        </div>
      </section>

      {/* Payment Channels */}
      <section className="py-16 bg-haroti-paper">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-heading">Easy Payment Options</h2>
            <p className="section-subheading">
              Multiple channels to pay for your LPG—choose what works best for you
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="bg-haroti-paper rounded-xl p-6 text-center shadow-md">
              <div className="w-16 h-16 bg-haroti-flame/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="text-haroti-orange" size={28} />
              </div>
              <h3 className="font-bold text-lg mb-2">USSD</h3>
              <p className="text-haroti-muted text-sm mb-3">Dial *XXX#</p>
              <p className="text-xs text-haroti-muted">Works on any phone, no internet needed</p>
            </div>

            <div className="bg-haroti-paper rounded-xl p-6 text-center shadow-md">
              <div className="w-16 h-16 bg-haroti-mist rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="text-haroti-forest" size={28} />
              </div>
              <h3 className="font-bold text-lg mb-2">Mobile App</h3>
              <p className="text-haroti-muted text-sm mb-3">Download & Install</p>
              <p className="text-xs text-haroti-muted">Full features, track usage, history</p>
            </div>

            <div className="bg-haroti-paper rounded-xl p-6 text-center shadow-md">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="text-haroti-green" size={28} />
              </div>
              <h3 className="font-bold text-lg mb-2">Mobile Money</h3>
              <p className="text-haroti-muted text-sm mb-3">Airtel Money, TNM Mpamba</p>
              <p className="text-xs text-haroti-muted">Instant, secure, convenient</p>
            </div>

            <div className="bg-haroti-paper rounded-xl p-6 text-center shadow-md">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="text-purple-600" size={28} />
              </div>
              <h3 className="font-bold text-lg mb-2">Cash</h3>
              <p className="text-haroti-muted text-sm mb-3">At any station</p>
              <p className="text-xs text-haroti-muted">Traditional payment option</p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Information */}
      <section className="py-16 md:py-24">
        <div className="container-custom">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 bg-red-50 text-red-700 px-6 py-3 rounded-full mb-6">
              <Shield size={24} />
              <span className="font-semibold">Your Safety is Our Priority</span>
            </div>
            <h2 className="section-heading">LPG Safety Guidelines</h2>
            <p className="section-subheading">
              Follow these essential safety tips for worry-free cooking
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {safetyTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-4 bg-haroti-paper rounded-lg p-4 shadow-sm border border-haroti-mist">
                  <div className="flex-shrink-0 w-8 h-8 bg-haroti-green/10 rounded-full flex items-center justify-center">
                    <Check className="text-haroti-green" size={18} />
                  </div>
                  <p className="text-haroti-ink/90">{tip}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-bold text-red-900 mb-2">In Case of Emergency</h3>
                  <p className="text-red-800 mb-4">
                    If you smell gas or suspect a leak:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-red-800">
                    <li>Turn off the gas cylinder immediately</li>
                    <li>Do not light matches or switch electrical appliances</li>
                    <li>Open windows and doors for ventilation</li>
                    <li>Leave the area and call our emergency line: <strong>+265 XXX XXX XXX</strong></li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accessories */}
      <section className="py-16 bg-haroti-paper">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-heading">Accessories & Equipment</h2>
            <p className="section-subheading">
              Quality accessories for safe and efficient cooking
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="bg-haroti-paper rounded-lg p-6 text-center shadow-sm">
              <div className="h-32 bg-gradient-to-br from-haroti-forest to-haroti-leaf-bright rounded-lg mb-4"></div>
              <h3 className="font-bold mb-2">Regulators</h3>
              <p className="text-sm text-haroti-muted mb-3">Certified safety regulators</p>
              <p className="font-semibold text-haroti-orange">MWK XXX</p>
            </div>

            <div className="bg-haroti-paper rounded-lg p-6 text-center shadow-sm">
              <div className="h-32 bg-gradient-to-br from-haroti-orange to-haroti-flame-hot rounded-lg mb-4"></div>
              <h3 className="font-bold mb-2">Gas Stoves</h3>
              <p className="text-sm text-haroti-muted mb-3">Single & double burner</p>
              <p className="font-semibold text-haroti-orange">MWK XXX</p>
            </div>

            <div className="bg-haroti-paper rounded-lg p-6 text-center shadow-sm">
              <div className="h-32 bg-gradient-to-br from-haroti-green to-green-600 rounded-lg mb-4"></div>
              <h3 className="font-bold mb-2">Hoses</h3>
              <p className="text-sm text-haroti-muted mb-3">High-quality gas hoses</p>
              <p className="font-semibold text-haroti-orange">MWK XXX</p>
            </div>

            <div className="bg-haroti-paper rounded-lg p-6 text-center shadow-sm">
              <div className="h-32 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg mb-4"></div>
              <h3 className="font-bold mb-2">Starter Kits</h3>
              <p className="text-sm text-haroti-muted mb-3">Complete cooking solution</p>
              <p className="font-semibold text-haroti-orange">MWK XXX</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-haroti-orange to-haroti-flame-hot text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Switch to Clean Cooking?
          </h2>
          <p className="text-xl mb-8 text-white/80 max-w-2xl mx-auto">
            Join thousands of families enjoying safe, affordable LPG cooking with PAYC
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:*XXX#" className="bg-haroti-paper text-haroti-orange hover:bg-haroti-mist font-semibold py-3 px-8 rounded-lg transition-colors inline-flex items-center justify-center gap-2">
              <Phone size={20} />
              Dial *XXX# Now
            </a>
            <a href="/stations" className="border-2 border-white text-white hover:bg-haroti-paper hover:text-haroti-orange font-semibold py-3 px-8 rounded-lg transition-all">
              Find a Station
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
