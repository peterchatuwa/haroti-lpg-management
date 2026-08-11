import { TrendingUp, Target, Shield, Users, Mail, Lock } from 'lucide-react';

export const InvestorsPage = () => {
  return (
    <div className="bg-haroti-paper">
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-haroti-forest to-haroti-forest-deep text-white py-16 md:py-24">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Investors & Partners</h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-3xl">
            Join us in scaling clean, affordable LPG energy across Malawi—a proven model with strong returns and measurable impact
          </p>
        </div>
      </section>

      {/* Investment Highlights */}
      <section className="py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-heading">Investment Highlights</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-haroti-mist to-haroti-paper rounded-xl p-6">
              <TrendingUp className="text-haroti-forest mb-4" size={40} />
              <h3 className="font-bold text-lg mb-2">Proven Business Model</h3>
              <p className="text-haroti-ink/90 text-sm">
                Operating profitably with strong unit economics and established supply chains
              </p>
            </div>

            <div className="bg-gradient-to-br from-haroti-flame-soft/40 to-haroti-mist rounded-xl p-6">
              <Target className="text-haroti-orange mb-4" size={40} />
              <h3 className="font-bold text-lg mb-2">Ambitious Growth</h3>
              <p className="text-haroti-ink/90 text-sm">
                Scaling to 150,000 active PAYC households by Year 5
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
              <Shield className="text-haroti-green mb-4" size={40} />
              <h3 className="font-bold text-lg mb-2">Carbon Finance</h3>
              <p className="text-haroti-ink/90 text-sm">
                Revenue diversification through verified carbon credits (WESM partnership)
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
              <Users className="text-purple-600 mb-4" size={40} />
              <h3 className="font-bold text-lg mb-2">Social Impact</h3>
              <p className="text-haroti-ink/90 text-sm">
                Women & youth empowerment, deforestation reduction, health benefits
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Facts */}
      <section className="py-16 bg-haroti-paper">
        <div className="container-custom">
          <h2 className="section-heading text-center mb-12">Key Facts from Business Proposal</h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-haroti-paper rounded-xl p-8 shadow-md text-center">
              <div className="text-4xl font-bold text-haroti-forest mb-2">8</div>
              <div className="text-haroti-muted font-semibold mb-3">Operating Stations</div>
              <p className="text-sm text-haroti-muted">
                Across Salima, Lilongwe & Blantyre with franchise network expansion
              </p>
            </div>

            <div className="bg-haroti-paper rounded-xl p-8 shadow-md text-center">
              <div className="text-4xl font-bold text-haroti-forest mb-2">12,450</div>
              <div className="text-haroti-muted font-semibold mb-3">Current PAYC Households</div>
              <p className="text-sm text-haroti-muted">
                Target: 150,000 by Year 5 (12x growth)
              </p>
            </div>

            <div className="bg-haroti-paper rounded-xl p-8 shadow-md text-center">
              <div className="text-4xl font-bold text-haroti-forest mb-2">2,840</div>
              <div className="text-haroti-muted font-semibold mb-3">Tonnes CO₂ Avoided</div>
              <p className="text-sm text-haroti-muted">
                Annual carbon credit potential
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Market Opportunity */}
      <section className="py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h2 className="section-heading text-center mb-12">Market Opportunity</h2>
            
            <div className="space-y-6">
              <div className="bg-haroti-paper rounded-xl p-8 shadow-md border-l-4 border-haroti-orange">
                <h3 className="text-xl font-bold mb-3">Large Underserved Market</h3>
                <p className="text-haroti-ink/90">
                  Malawi's population of 20+ million relies heavily on charcoal and firewood. LPG 
                  penetration remains low, presenting significant growth opportunity for clean cooking 
                  solutions.
                </p>
              </div>

              <div className="bg-haroti-paper rounded-xl p-8 shadow-md border-l-4 border-haroti-forest">
                <h3 className="text-xl font-bold mb-3">PAYC Innovation</h3>
                <p className="text-haroti-ink/90">
                  Our micro-installment model removes the primary barrier to LPG adoption—high upfront costs—
                  making clean cooking accessible to low- and middle-income households.
                </p>
              </div>

              <div className="bg-haroti-paper rounded-xl p-8 shadow-md border-l-4 border-haroti-green">
                <h3 className="text-xl font-bold mb-3">Policy Support</h3>
                <p className="text-haroti-ink/90">
                  Government commitment to clean energy, carbon finance initiatives, and support from DFIs 
                  (MEDF/GETF facility) create a favorable environment for growth.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use of Funds */}
      <section className="py-16 bg-haroti-paper">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h2 className="section-heading text-center mb-12">Use of Funds</h2>
            
            <div className="bg-haroti-paper rounded-xl p-8 shadow-lg">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-haroti-forest rounded-full flex items-center justify-center text-white font-bold">
                    40%
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">PAYC Starter Kit Deployment</h3>
                    <p className="text-haroti-muted text-sm">
                      Cylinders, regulators, and accessories for household onboarding
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-haroti-orange rounded-full flex items-center justify-center text-white font-bold">
                    30%
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Franchise Network Expansion</h3>
                    <p className="text-haroti-muted text-sm">
                      New station setup, training, and support for franchisees
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-haroti-green rounded-full flex items-center justify-center text-white font-bold">
                    20%
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Working Capital & Inventory</h3>
                    <p className="text-haroti-muted text-sm">
                      Bulk LPG imports and operational reserves
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    10%
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Technology & Operations</h3>
                    <p className="text-haroti-muted text-sm">
                      Digital platform, IoT systems, and operational infrastructure
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Investors */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="section-heading text-center mb-12">We Welcome</h2>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-haroti-paper rounded-xl p-6 shadow-md text-center">
              <h3 className="font-bold text-lg mb-3">Development Finance Institutions</h3>
              <p className="text-haroti-muted text-sm">
                Blended finance structures with impact and financial returns
              </p>
            </div>

            <div className="bg-haroti-paper rounded-xl p-6 shadow-md text-center">
              <h3 className="font-bold text-lg mb-3">Impact Investors</h3>
              <p className="text-haroti-muted text-sm">
                ESG-aligned investment with measurable SDG contribution
              </p>
            </div>

            <div className="bg-haroti-paper rounded-xl p-6 shadow-md text-center">
              <h3 className="font-bold text-lg mb-3">Carbon Credit Off-takers</h3>
              <p className="text-haroti-muted text-sm">
                Long-term offtake agreements for verified emission reductions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Secure Contact */}
      <section className="py-16 bg-haroti-forest text-white">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            <Lock className="mx-auto mb-6" size={64} />
            <h2 className="text-3xl font-bold mb-4">Confidential Investor Enquiry</h2>
            <p className="text-xl text-white/80 mb-8">
              For detailed business proposal, financial projections, and partnership discussions
            </p>
            
            <div className="bg-haroti-paper/10 backdrop-blur rounded-xl p-8">
              <div className="space-y-4 text-left">
                <div className="flex items-start gap-3">
                  <Mail className="flex-shrink-0 mt-1" size={20} />
                  <div>
                    <div className="font-semibold mb-1">Chief Financial Officer</div>
                    <a href="mailto:cfo@harotiholdingslimited.com" className="text-white/80 hover:text-white transition-colors">
                      cfo@harotiholdingslimited.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="flex-shrink-0 mt-1" size={20} />
                  <div>
                    <div className="font-semibold mb-1">General Manager</div>
                    <a href="mailto:gm@harotiholdingslimited.com" className="text-white/80 hover:text-white transition-colors">
                      gm@harotiholdingslimited.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-sm text-white/80">
                  All enquiries are handled confidentially per our data protection commitments. 
                  Non-Disclosure Agreements available upon request.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Current Partners */}
      <section className="py-16 bg-haroti-paper">
        <div className="container-custom">
          <h2 className="section-heading text-center mb-12">Current Partners & Supporters</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-haroti-paper rounded-lg p-6 text-center border-2 border-haroti-mist">
              <div className="font-bold text-lg text-haroti-muted">DFI Partners</div>
              <p className="text-sm text-haroti-muted mt-2">Development Finance</p>
            </div>

            <div className="bg-haroti-paper rounded-lg p-6 text-center border-2 border-haroti-mist">
              <div className="font-bold text-lg text-haroti-muted">WESM</div>
              <p className="text-sm text-haroti-muted mt-2">Carbon Finance</p>
            </div>

            <div className="bg-haroti-paper rounded-lg p-6 text-center border-2 border-haroti-mist">
              <div className="font-bold text-lg text-haroti-muted">MEDF/GETF</div>
              <p className="text-sm text-haroti-muted mt-2">Enterprise Development</p>
            </div>

            <div className="bg-haroti-paper rounded-lg p-6 text-center border-2 border-haroti-mist">
              <div className="font-bold text-lg text-haroti-muted">Local Banks</div>
              <p className="text-sm text-haroti-muted mt-2">Banking Partners</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
