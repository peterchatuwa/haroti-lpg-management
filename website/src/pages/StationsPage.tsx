import { useState } from 'react';
import { MapPin, Phone, Clock, Check, Search } from 'lucide-react';
import { stations } from '../data/stations';

export const StationsPage = () => {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const districts = ['all', ...Array.from(new Set(stations.map(s => s.district)))];

  const filteredStations = stations.filter(station => {
    const matchesDistrict = selectedDistrict === 'all' || station.district === selectedDistrict;
    const matchesSearch = station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         station.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDistrict && matchesSearch;
  });

  return (
    <div className="bg-haroti-paper">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-haroti-forest to-haroti-forest-deep text-white py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Find a Station Near You</h1>
            <p className="text-xl md:text-2xl text-white/80">
              8 conveniently located stations across Salima, Lilongwe, and Blantyre
            </p>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-8 bg-haroti-paper border-b">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-haroti-orange mb-1">8</div>
              <div className="text-haroti-muted text-sm">Total Stations</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-haroti-orange mb-1">3</div>
              <div className="text-haroti-muted text-sm">Districts Served</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-haroti-orange mb-1">7</div>
              <div className="text-haroti-muted text-sm">Days a Week</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-haroti-orange mb-1">24/7</div>
              <div className="text-haroti-muted text-sm">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-haroti-paper border-b sticky top-16 z-40 shadow-sm">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search stations by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-haroti-muted/30 rounded-lg focus:ring-2 focus:ring-haroti-forest focus:border-transparent"
                />
              </div>
            </div>

            {/* District Filter */}
            <div className="md:w-64">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full px-4 py-3 border border-haroti-muted/30 rounded-lg focus:ring-2 focus:ring-haroti-forest focus:border-transparent"
              >
                {districts.map(district => (
                  <option key={district} value={district}>
                    {district === 'all' ? 'All Districts' : district}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-haroti-muted">
            Showing {filteredStations.length} of {stations.length} stations
          </div>
        </div>
      </section>

      {/* Stations List */}
      <section className="py-12">
        <div className="container-custom">
          {filteredStations.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-bold text-haroti-ink/90 mb-2">No stations found</h3>
              <p className="text-haroti-muted">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStations.map((station) => (
                <div
                  key={station.code}
                  className="bg-haroti-paper border-2 border-haroti-mist rounded-xl overflow-hidden hover:border-haroti-orange hover:shadow-lg transition-all"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-haroti-forest to-haroti-leaf text-white p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{station.name}</h3>
                        <div className="text-white/80 text-sm">{station.code}</div>
                      </div>
                      <div className="bg-haroti-paper/20 px-3 py-1 rounded-full text-xs font-semibold">
                        {station.district}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Address */}
                    <div className="flex items-start gap-3 mb-4">
                      <MapPin className="text-haroti-orange flex-shrink-0 mt-1" size={20} />
                      <div>
                        <div className="font-semibold text-sm text-haroti-muted mb-1">Location</div>
                        <div className="text-haroti-ink/90">{station.address}</div>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start gap-3 mb-4">
                      <Phone className="text-haroti-orange flex-shrink-0 mt-1" size={20} />
                      <div>
                        <div className="font-semibold text-sm text-haroti-muted mb-1">Contact</div>
                        <a href={`tel:${station.phone}`} className="text-haroti-forest hover:text-haroti-orange transition-colors">
                          {station.phone}
                        </a>
                      </div>
                    </div>

                    {/* Hours */}
                    <div className="flex items-start gap-3 mb-4">
                      <Clock className="text-haroti-orange flex-shrink-0 mt-1" size={20} />
                      <div>
                        <div className="font-semibold text-sm text-haroti-muted mb-1">Operating Hours</div>
                        <div className="text-haroti-ink/90 text-sm">{station.hours}</div>
                      </div>
                    </div>

                    {/* Services */}
                    <div className="mb-4">
                      <div className="font-semibold text-sm text-haroti-muted mb-2">Services Available</div>
                      <div className="flex flex-wrap gap-2">
                        {station.services.map((service, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 bg-haroti-green/10 text-haroti-green text-xs px-2 py-1 rounded-full"
                          >
                            <Check size={12} />
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${station.lat},${station.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-haroti-forest hover:bg-haroti-leaf text-white text-center py-2 px-4 rounded-lg transition-colors text-sm font-semibold"
                      >
                        Get Directions
                      </a>
                      <a
                        href={`tel:${station.phone}`}
                        className="flex-1 border-2 border-haroti-forest text-haroti-forest hover:bg-haroti-forest hover:text-white text-center py-2 px-4 rounded-lg transition-all text-sm font-semibold"
                      >
                        Call Now
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Map Section (Placeholder) */}
      <section className="py-16 bg-haroti-paper">
        <div className="container-custom">
          <div className="text-center mb-8">
            <h2 className="section-heading">Station Locations Map</h2>
            <p className="section-subheading">
              Interactive map view coming soon
            </p>
          </div>

          <div className="bg-haroti-paper rounded-xl overflow-hidden shadow-lg">
            <div className="h-96 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-haroti-muted font-semibold">Interactive Map</p>
                <p className="text-haroti-muted text-sm">Coming Soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Information */}
      <section className="py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-heading">What to Expect at Our Stations</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-haroti-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="text-haroti-forest" size={28} />
              </div>
              <h3 className="font-bold mb-2">Fast Service</h3>
              <p className="text-haroti-muted text-sm">
                Quick refills and minimal wait times
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-haroti-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="text-haroti-orange" size={28} />
              </div>
              <h3 className="font-bold mb-2">Safety Certified</h3>
              <p className="text-haroti-muted text-sm">
                All equipment meets safety standards
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-haroti-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="text-haroti-green" size={28} />
              </div>
              <h3 className="font-bold mb-2">Trained Staff</h3>
              <p className="text-haroti-muted text-sm">
                Friendly, knowledgeable team members
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="text-purple-600" size={28} />
              </div>
              <h3 className="font-bold mb-2">Clean Facilities</h3>
              <p className="text-haroti-muted text-sm">
                Well-maintained, organized stations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-haroti-forest text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Can't Find a Station Near You?
          </h2>
          <p className="text-xl mb-8 text-white/80 max-w-2xl mx-auto">
            We're expanding! Join our franchise network and bring clean cooking to your community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/franchise" className="btn-primary">
              Franchise Opportunities
            </a>
            <a href="/contact" className="bg-haroti-paper text-haroti-forest hover:bg-haroti-mist font-semibold py-3 px-6 rounded-lg transition-colors">
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
