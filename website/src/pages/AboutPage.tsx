import { Target, Heart, Users, Award, TrendingUp, Leaf } from 'lucide-react';

export const AboutPage = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-haroti-blue to-blue-800 text-white py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About Haroti Gas</h1>
            <p className="text-xl md:text-2xl text-blue-100">
              Transforming lives across Malawi through clean, affordable LPG energy solutions
            </p>
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-16 md:py-24">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="section-heading">Our Story</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Haroti Holdings Limited, trading as Haroti Gas, is a Malawian energy company 
                  dedicated to revolutionizing how families cook across our nation. We operate 
                  comprehensive LPG bulk import, storage, and retail distribution services.
                </p>
                <p>
                  Our innovative Pay-As-You-Cook (PAYC) programme is changing the landscape of 
                  clean cooking in Malawi. By removing the barrier of large upfront costs, we're 
                  making clean, safe LPG cooking accessible to every household.
                </p>
                <p>
                  With a growing franchise network of women- and youth-led refill stations, we're 
                  not just providing energy—we're creating economic opportunities and building 
                  sustainable livelihoods across communities.
                </p>
                <p className="font-semibold text-haroti-blue">
                  Our ambitious goal: 150,000 active PAYC households by Year 5.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-haroti-orange to-orange-600 rounded-2xl p-12 text-white">
              <div className="space-y-8">
                <div>
                  <div className="text-5xl font-bold mb-2">150,000</div>
                  <div className="text-orange-100">Target PAYC Households</div>
                </div>
                <div>
                  <div className="text-5xl font-bold mb-2">8</div>
                  <div className="text-orange-100">Stations Across Malawi</div>
                </div>
                <div>
                  <div className="text-5xl font-bold mb-2">100%</div>
                  <div className="text-orange-100">Clean Energy Solution</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision, Mission, Values */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-heading">Our Vision, Mission & Values</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Vision */}
            <div className="bg-white rounded-xl p-8 shadow-md">
              <div className="w-16 h-16 bg-haroti-blue/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Target className="text-haroti-blue" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center">Our Vision</h3>
              <p className="text-gray-600 text-center">
                To be the leading provider of clean, affordable LPG energy solutions in Malawi, 
                powering sustainable development and improving lives in every community we serve.
              </p>
            </div>

            {/* Mission */}
            <div className="bg-white rounded-xl p-8 shadow-md">
              <div className="w-16 h-16 bg-haroti-orange/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Heart className="text-haroti-orange" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center">Our Mission</h3>
              <p className="text-gray-600 text-center">
                To make clean cooking accessible to every Malawian household through innovative 
                payment models, reliable distribution, and a commitment to safety, sustainability, 
                and community empowerment.
              </p>
            </div>

            {/* Values */}
            <div className="bg-white rounded-xl p-8 shadow-md">
              <div className="w-16 h-16 bg-haroti-green/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Award className="text-haroti-green" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center">Our Values</h3>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-haroti-green mt-1">•</span>
                  <span><strong>Safety First:</strong> In everything we do</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-haroti-green mt-1">•</span>
                  <span><strong>Accessibility:</strong> Energy for all</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-haroti-green mt-1">•</span>
                  <span><strong>Innovation:</strong> Leading with technology</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-haroti-green mt-1">•</span>
                  <span><strong>Empowerment:</strong> Supporting communities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-haroti-green mt-1">•</span>
                  <span><strong>Sustainability:</strong> Protecting our planet</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What Sets Us Apart */}
      <section className="py-16 md:py-24">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-heading">What Sets Us Apart</h2>
            <p className="section-subheading max-w-2xl mx-auto">
              We're more than just an LPG supplier—we're partners in Malawi's clean energy future
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
              <Users className="text-haroti-blue mb-4" size={32} />
              <h3 className="text-xl font-bold mb-3">Community-Centered</h3>
              <p className="text-gray-700">
                Our franchise model prioritizes women and youth leadership, creating jobs and 
                economic opportunities where they're needed most.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
              <TrendingUp className="text-haroti-orange mb-4" size={32} />
              <h3 className="text-xl font-bold mb-3">Innovation-Driven</h3>
              <p className="text-gray-700">
                PAYC micro-installment model, USSD access, mobile app, and digital payment 
                integration make clean cooking truly accessible.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
              <Leaf className="text-haroti-green mb-4" size={32} />
              <h3 className="text-xl font-bold mb-3">ESG Committed</h3>
              <p className="text-gray-700">
                Carbon-finance partnerships, deforestation reduction, and alignment with 
                Sustainable Development Goals drive everything we do.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
              <Award className="text-purple-600 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-3">Quality Assured</h3>
              <p className="text-gray-700">
                Rigorous safety standards, certified equipment, trained personnel, and strict 
                compliance ensure your family's safety.
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6">
              <Target className="text-indigo-600 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-3">Nationwide Reach</h3>
              <p className="text-gray-700">
                8 strategically located stations across Salima, Lilongwe, and Blantyre with 
                plans for continued expansion.
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6">
              <Heart className="text-pink-600 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-3">Customer First</h3>
              <p className="text-gray-700">
                24/7 support, flexible payment options, transparent pricing, and a commitment 
                to serving every customer with excellence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-heading">Our Leadership</h2>
            <p className="section-subheading">
              Experienced team committed to clean energy and community development
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Placeholder leadership profiles */}
            <div className="bg-white rounded-xl overflow-hidden shadow-md">
              <div className="h-64 bg-gradient-to-br from-haroti-blue to-blue-600"></div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1">Executive Leadership</h3>
                <p className="text-haroti-orange font-semibold mb-3">General Manager</p>
                <p className="text-gray-600 text-sm">
                  Leading Haroti Gas's strategic vision and operational excellence across 
                  all business units.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-md">
              <div className="h-64 bg-gradient-to-br from-haroti-orange to-orange-600"></div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1">Financial Leadership</h3>
                <p className="text-haroti-orange font-semibold mb-3">Chief Financial Officer</p>
                <p className="text-gray-600 text-sm">
                  Managing financial strategy, investor relations, and sustainable growth 
                  planning.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-md">
              <div className="h-64 bg-gradient-to-br from-haroti-green to-green-600"></div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1">Operations Leadership</h3>
                <p className="text-haroti-orange font-semibold mb-3">Operations Director</p>
                <p className="text-gray-600 text-sm">
                  Ensuring safe, efficient operations across our network of stations and 
                  distribution channels.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partnerships */}
      <section className="py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-heading">Our Partnerships</h2>
            <p className="section-subheading">
              Working with leading organizations to scale clean cooking across Malawi
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center hover:border-haroti-blue transition-colors">
              <div className="text-gray-400 font-bold text-lg">DFI Partners</div>
              <p className="text-sm text-gray-600 mt-2">Development Finance Institutions</p>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center hover:border-haroti-blue transition-colors">
              <div className="text-gray-400 font-bold text-lg">WESM</div>
              <p className="text-sm text-gray-600 mt-2">Carbon Finance Partnership</p>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center hover:border-haroti-blue transition-colors">
              <div className="text-gray-400 font-bold text-lg">MEDF/GETF</div>
              <p className="text-sm text-gray-600 mt-2">Malawi Enterprise Development Fund</p>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center hover:border-haroti-blue transition-colors">
              <div className="text-gray-400 font-bold text-lg">Local Partners</div>
              <p className="text-sm text-gray-600 mt-2">Community Organizations</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-haroti-blue text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Join Us in Powering Malawi's Clean Energy Future
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Whether you're a customer, potential franchise partner, or investor, there's a 
            place for you in the Haroti Gas family.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/franchise" className="btn-primary">
              Become a Franchisee
            </a>
            <a href="/contact" className="bg-white text-haroti-blue hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg transition-colors">
              Get in Touch
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
