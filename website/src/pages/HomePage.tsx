import { Link } from 'react-router-dom';
import { Flame, Users, MapPin, Leaf, TrendingUp, Award, ArrowRight, Phone, Download } from 'lucide-react';

export const HomePage = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-haroti-blue to-blue-800 py-20 text-white md:py-32">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/brand/malawian-mother.png)' }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-haroti-blue/95 via-blue-900/85 to-blue-800/75" />
        <div className="container-custom relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Clean, Affordable LPG Energy for Every Home
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Haroti Gas is transforming lives across Malawi with safe, reliable LPG cooking solutions 
              and the innovative Pay-As-You-Cook (PAYC) programme
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/stations" className="btn-primary inline-flex items-center justify-center gap-2">
                <MapPin size={20} />
                Find a Station Near You
              </Link>
              <Link to="/products" className="btn-outline inline-flex items-center justify-center gap-2 bg-white/10 border-white text-white hover:bg-white hover:text-haroti-blue">
                <Flame size={20} />
                Learn About PAYC
              </Link>
            </div>
            
            {/* Quick Actions */}
            <div className="mt-8 pt-8 border-t border-white/20">
              <p className="text-sm text-blue-100 mb-3">Get started with PAYC today:</p>
              <div className="flex flex-col sm:flex-row gap-3 text-sm">
                <a href="tel:*XXX#" className="flex items-center gap-2 hover:text-haroti-orange transition-colors">
                  <Phone size={16} />
                  <span>Dial <strong>*XXX#</strong> (USSD)</span>
                </a>
                <span className="hidden sm:inline text-blue-100">|</span>
                <a href="#" className="flex items-center gap-2 hover:text-haroti-orange transition-colors">
                  <Download size={16} />
                  <span>Download the <strong>Haroti Gas App</strong></span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-haroti-orange mb-2">150K+</div>
              <div className="text-gray-600">Target PAYC Households by Year 5</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-haroti-orange mb-2">8</div>
              <div className="text-gray-600">Stations Across Malawi</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-haroti-orange mb-2">100%</div>
              <div className="text-gray-600">Clean Energy Solution</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-haroti-orange mb-2">24/7</div>
              <div className="text-gray-600">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-heading">Why Choose Haroti Gas?</h2>
            <p className="section-subheading max-w-2xl mx-auto">
              We're committed to providing safe, affordable, and sustainable cooking solutions 
              that transform lives and protect our environment
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-haroti-orange/10 rounded-lg flex items-center justify-center mb-4">
                <Flame className="text-haroti-orange" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Pay-As-You-Cook (PAYC)</h3>
              <p className="text-gray-600 mb-4">
                Affordable micro-installment model that lets you pay for LPG as you use it. 
                No large upfront costs, just clean cooking made accessible.
              </p>
              <Link to="/products" className="text-haroti-orange font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
                Learn More <ArrowRight size={16} />
              </Link>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-haroti-blue/10 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="text-haroti-blue" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Nationwide Network</h3>
              <p className="text-gray-600 mb-4">
                8 stations across Salima, Lilongwe, and Blantyre, with a growing franchise 
                network bringing LPG closer to your community.
              </p>
              <Link to="/stations" className="text-haroti-orange font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
                Find a Station <ArrowRight size={16} />
              </Link>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-haroti-green/10 rounded-lg flex items-center justify-center mb-4">
                <Leaf className="text-haroti-green" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Environmental Impact</h3>
              <p className="text-gray-600 mb-4">
                Reduce deforestation and carbon emissions. Our clean LPG solutions contribute 
                to a healthier planet and carbon-finance partnerships.
              </p>
              <Link to="/impact" className="text-haroti-orange font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
                See Our Impact <ArrowRight size={16} />
              </Link>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="text-purple-600" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Women & Youth Empowerment</h3>
              <p className="text-gray-600 mb-4">
                Our franchise model prioritizes women- and youth-led stations, creating 
                economic opportunities and building sustainable livelihoods.
              </p>
              <Link to="/franchise" className="text-haroti-orange font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
                Franchise Opportunities <ArrowRight size={16} />
              </Link>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="text-orange-600" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Digital Innovation</h3>
              <p className="text-gray-600 mb-4">
                USSD and mobile app for easy onboarding, mobile-money payments, and 
                24/7 customer support. Modern solutions for modern needs.
              </p>
              <Link to="/products" className="text-haroti-orange font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
                Digital Platform <ArrowRight size={16} />
              </Link>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <Award className="text-yellow-600" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Safety & Quality</h3>
              <p className="text-gray-600 mb-4">
                Rigorous safety standards, certified equipment, and trained personnel ensure 
                your family's safety with every refill.
              </p>
              <Link to="/about" className="text-haroti-orange font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
                Our Standards <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Franchise */}
      <section className="py-16 bg-gradient-to-r from-haroti-orange to-orange-600 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Join Our Franchise Network
          </h2>
          <p className="text-xl mb-8 text-orange-100 max-w-2xl mx-auto">
            Be part of the clean energy revolution. Women- and youth-led franchise 
            opportunities available across Malawi.
          </p>
          <Link to="/franchise" className="bg-white text-haroti-orange hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors inline-flex items-center gap-2">
            Apply for Franchise <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* News/Updates Preview */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Latest News & Updates</h2>
              <p className="text-gray-600">Stay informed about Haroti Gas developments</p>
            </div>
            <Link to="/news" className="text-haroti-orange font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Placeholder news items - will be dynamic */}
            <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-br from-haroti-blue to-blue-600"></div>
              <div className="p-6">
                <div className="text-sm text-gray-500 mb-2">August 1, 2026</div>
                <h3 className="font-bold text-lg mb-2">Expanding to 150,000 Households</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Haroti Gas announces ambitious expansion plan to reach 150,000 PAYC households by Year 5...
                </p>
                <Link to="/news" className="text-haroti-orange font-semibold text-sm inline-flex items-center gap-1">
                  Read More <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-br from-haroti-green to-green-600"></div>
              <div className="p-6">
                <div className="text-sm text-gray-500 mb-2">July 25, 2026</div>
                <h3 className="font-bold text-lg mb-2">Carbon Finance Partnership</h3>
                <p className="text-gray-600 text-sm mb-4">
                  New partnership with WESM to advance clean cooking and carbon reduction...
                </p>
                <Link to="/news" className="text-haroti-orange font-semibold text-sm inline-flex items-center gap-1">
                  Read More <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-br from-haroti-orange to-orange-600"></div>
              <div className="p-6">
                <div className="text-sm text-gray-500 mb-2">July 15, 2026</div>
                <h3 className="font-bold text-lg mb-2">New Station Opening in Blantyre</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Haroti Gas opens new franchise station in Blantyre Zingwangwa...
                </p>
                <Link to="/news" className="text-haroti-orange font-semibold text-sm inline-flex items-center gap-1">
                  Read More <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-haroti-blue text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Switch to Clean Cooking?
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Get started with PAYC today or visit your nearest Haroti Gas station
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/stations" className="btn-primary">
              Find a Station
            </Link>
            <Link to="/contact" className="bg-white text-haroti-blue hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
