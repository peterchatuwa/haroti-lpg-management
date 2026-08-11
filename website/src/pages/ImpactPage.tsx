import { Leaf, Users, TrendingDown, Heart, Globe, Target } from 'lucide-react';

export const ImpactPage = () => {
  const sdgs = [
    { number: 7, title: 'Affordable and Clean Energy' },
    { number: 13, title: 'Climate Action' },
    { number: 5, title: 'Gender Equality' },
    { number: 8, title: 'Decent Work and Economic Growth' },
    { number: 15, title: 'Life on Land' },
  ];

  return (
    <div className="bg-haroti-paper">
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-haroti-green to-green-700 text-white py-16 md:py-24">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Impact & ESG</h1>
          <p className="text-xl md:text-2xl text-green-100 max-w-3xl">
            Driving environmental sustainability, social inclusion, and good governance across Malawi
          </p>
        </div>
      </section>

      {/* Impact KPIs Dashboard */}
      <section className="py-16 bg-haroti-paper">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-heading">Our Impact by the Numbers</h2>
            <p className="section-subheading">Real-time metrics tracking our progress toward 150,000 households</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-haroti-paper rounded-xl p-6 shadow-md text-center">
              <Users className="mx-auto text-haroti-forest mb-3" size={40} />
              <div className="text-4xl font-bold text-haroti-forest mb-2">12,450</div>
              <div className="text-haroti-muted font-semibold mb-1">Active PAYC Households</div>
              <div className="text-sm text-haroti-muted">Target: 150,000 by Year 5</div>
            </div>

            <div className="bg-haroti-paper rounded-xl p-6 shadow-md text-center">
              <TrendingDown className="mx-auto text-haroti-green mb-3" size={40} />
              <div className="text-4xl font-bold text-haroti-green mb-2">2,840</div>
              <div className="text-haroti-muted font-semibold mb-1">Tonnes CO₂ Avoided</div>
              <div className="text-sm text-haroti-muted">Annual reduction</div>
            </div>

            <div className="bg-haroti-paper rounded-xl p-6 shadow-md text-center">
              <Leaf className="mx-auto text-green-600 mb-3" size={40} />
              <div className="text-4xl font-bold text-green-600 mb-2">4,200</div>
              <div className="text-haroti-muted font-semibold mb-1">Tonnes Charcoal Saved</div>
              <div className="text-sm text-haroti-muted">Deforestation prevented</div>
            </div>

            <div className="bg-haroti-paper rounded-xl p-6 shadow-md text-center">
              <Heart className="mx-auto text-haroti-orange mb-3" size={40} />
              <div className="text-4xl font-bold text-haroti-orange mb-2">245</div>
              <div className="text-haroti-muted font-semibold mb-1">Jobs Created</div>
              <div className="text-sm text-haroti-muted">65% women, 40% youth</div>
            </div>
          </div>
        </div>
      </section>

      {/* Environmental Impact */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="section-heading text-center mb-12">Environmental Impact</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-green-50 rounded-xl p-8">
              <Leaf className="text-haroti-green mb-4" size={48} />
              <h3 className="text-2xl font-bold mb-4">Deforestation Reduction</h3>
              <p className="text-haroti-ink/90 mb-4">
                Every household switching from charcoal to LPG saves approximately 340kg of charcoal 
                annually, protecting Malawi's forests and biodiversity.
              </p>
              <div className="font-semibold text-haroti-green">4,200 tonnes charcoal saved annually</div>
            </div>

            <div className="bg-haroti-mist rounded-xl p-8">
              <TrendingDown className="text-haroti-forest mb-4" size={48} />
              <h3 className="text-2xl font-bold mb-4">Carbon Emissions Avoided</h3>
              <p className="text-haroti-ink/90 mb-4">
                LPG produces significantly lower emissions than charcoal. Our programme avoids 
                thousands of tonnes of CO₂ equivalent emissions each year.
              </p>
              <div className="font-semibold text-haroti-forest">2,840 tonnes CO₂e avoided annually</div>
            </div>

            <div className="bg-purple-50 rounded-xl p-8">
              <Heart className="text-purple-600 mb-4" size={48} />
              <h3 className="text-2xl font-bold mb-4">Health Benefits</h3>
              <p className="text-haroti-ink/90 mb-4">
                Reduced indoor air pollution from clean LPG cooking improves respiratory health, 
                especially for women and children.
              </p>
              <div className="font-semibold text-purple-600">12,450 households breathing cleaner air</div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Impact */}
      <section className="py-16 bg-haroti-paper">
        <div className="container-custom">
          <h2 className="section-heading text-center mb-12">Social Impact</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-haroti-paper rounded-xl p-8 shadow-md">
              <Users className="text-haroti-orange mb-4" size={48} />
              <h3 className="text-2xl font-bold mb-4">Women & Youth Empowerment</h3>
              <ul className="space-y-3 text-haroti-ink/90">
                <li className="flex items-start gap-2">
                  <span className="text-haroti-orange mt-1">•</span>
                  <span>65% of franchise stations are women-led</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-haroti-orange mt-1">•</span>
                  <span>40% of employees are youth (under 35)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-haroti-orange mt-1">•</span>
                  <span>Economic opportunities in underserved communities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-haroti-orange mt-1">•</span>
                  <span>Business training and capacity building programmes</span>
                </li>
              </ul>
            </div>

            <div className="bg-haroti-paper rounded-xl p-8 shadow-md">
              <Target className="text-haroti-forest mb-4" size={48} />
              <h3 className="text-2xl font-bold mb-4">Economic Development</h3>
              <ul className="space-y-3 text-haroti-ink/90">
                <li className="flex items-start gap-2">
                  <span className="text-haroti-forest mt-1">•</span>
                  <span>245 direct jobs created across the value chain</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-haroti-forest mt-1">•</span>
                  <span>PAYC makes clean cooking affordable for low-income families</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-haroti-forest mt-1">•</span>
                  <span>Reduced household energy costs by up to 30%</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-haroti-forest mt-1">•</span>
                  <span>Support for local suppliers and service providers</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Carbon Finance Partnership */}
      <section className="py-16">
        <div className="container-custom">
          <div className="bg-gradient-to-r from-haroti-forest to-haroti-forest-deep text-white rounded-2xl p-12">
            <div className="max-w-3xl mx-auto text-center">
              <Globe className="mx-auto mb-6" size={64} />
              <h2 className="text-3xl font-bold mb-4">Carbon Finance Partnership</h2>
              <p className="text-xl text-white/80 mb-6">
                Our partnership with WESM (World's Energy Solutions for Malawi) enables carbon credit 
                generation from avoided deforestation and emission reductions.
              </p>
              <p className="text-white/80">
                These carbon credits support programme expansion, making clean cooking accessible to 
                more households while contributing to global climate goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SDG Alignment */}
      <section className="py-16 bg-haroti-paper">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-heading">UN Sustainable Development Goals</h2>
            <p className="section-subheading">Our work directly contributes to multiple SDGs</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-4xl mx-auto">
            {sdgs.map((sdg) => (
              <div key={sdg.number} className="bg-haroti-paper rounded-lg p-6 text-center shadow-md">
                <div className="w-16 h-16 bg-gradient-to-br from-haroti-forest to-haroti-leaf rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-2xl">
                  {sdg.number}
                </div>
                <div className="text-sm font-semibold text-haroti-ink/90">{sdg.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Governance */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="section-heading text-center mb-12">Environmental & Social Governance</h2>
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-haroti-paper rounded-xl p-8 shadow-md border-l-4 border-haroti-forest">
              <h3 className="text-xl font-bold mb-3">Environmental Safeguards</h3>
              <p className="text-haroti-ink/90">
                We maintain strict environmental standards aligned with international best practices, 
                including safe LPG handling, proper waste disposal, and continuous monitoring of our 
                environmental footprint.
              </p>
            </div>

            <div className="bg-haroti-paper rounded-xl p-8 shadow-md border-l-4 border-haroti-orange">
              <h3 className="text-xl font-bold mb-3">Social Safeguards Framework</h3>
              <p className="text-haroti-ink/90">
                Our ESMS Framework ensures data protection, non-discrimination, fair labor practices, 
                and community engagement. All franchise applications and customer data are handled with 
                strict confidentiality and consent procedures.
              </p>
            </div>

            <div className="bg-haroti-paper rounded-xl p-8 shadow-md border-l-4 border-haroti-green">
              <h3 className="text-xl font-bold mb-3">Good Governance</h3>
              <p className="text-haroti-ink/90">
                Transparent financial management, regular impact reporting, third-party audits, and 
                accountable leadership ensure that Haroti Gas operates with integrity and delivers 
                on its commitments to all stakeholders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-haroti-green text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Partner with Us for Sustainable Impact
          </h2>
          <p className="text-xl mb-8 text-green-100 max-w-2xl mx-auto">
            Investors, DFIs, and carbon off-takers: join us in scaling clean cooking across Malawi
          </p>
          <a href="/investors" className="btn-primary">
            Learn About Investment Opportunities
          </a>
        </div>
      </section>
    </div>
  );
};
