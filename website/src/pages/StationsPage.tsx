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
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-haroti-blue to-blue-800 text-white py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Find a Station Near You</h1>
            <p className="text-xl md:text-2xl text-blue-100">
              8 conveniently located stations across Salima, Lilongwe, and Blantyre
            </p>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-8 bg-gray-50 border-b">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-haroti-orange mb-1">8</div>
              <div className="text-gray-600 text-sm">Total Stations</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-haroti-orange mb-1">3</div>
              <div className="text-gray-600 text-sm">Districts Served</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-haroti-orange mb-1">7</div>
              <div className="text-gray-600 text-sm">Days a Week</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-haroti-orange mb-1">24/7</div>
              <div className="text-gray-600 text-sm">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-white border-b sticky top-16 z-40 shadow-sm">
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-haroti-blue focus:border-transparent"
                />
              </div>
            </div>

            {/* District Filter */}
            <div className="md:w-64">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-haroti-blue focus:border-transparent"
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
          <div className="mt-4 text-gray-600">
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
              <h3 className="text-xl font-bold text-gray-700 mb-2">No stations found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStations.map((station) => (
                <div
                  key={station.code}
                  className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-haroti-orange hover:shadow-lg transition-all"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-haroti-blue to-blue-700 text-white p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{station.name}</h3>
                        <div className="text-blue-100 text-sm">{station.code}</div>
                      </div>
                      <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">
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
                        <div className="font-semibold text-sm text-gray-500 mb-1">Location</div>
                        <div className="text-gray-700">{station.address}</div>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start gap-3 mb-4">
                      <Phone className="text-haroti-orange flex-shrink-0 mt-1" size={20} />
                      <div>
                        <div className="font-semibold text-sm text-gray-500 mb-1">Contact</div>
                        <a href={`tel:${station.phone}`} className="text-haroti-blue hover:text-haroti-orange transition-colors">
                          {station.phone}
                        </a>
                      </div>
                    </div>

                    {/* Hours */}
                    <div className="flex items-start gap-3 mb-4">
                      <Clock className="text-haroti-orange flex-shrink-0 mt-1" size={20} />
                      <div>
                        <div className="font-semibold text-sm text-gray-500 mb-1">Operating Hours</div>
                        <div className="text-gray-700 text-sm">{station.hours}</div>
                      </div>
                    </div>

                    {/* Services */}
                    <div className="mb-4">
                      <div className="font-semibold text-sm text-gray-500 mb-2">Services Available</div>
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
                        className="flex-1 bg-haroti-blue hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg transition-colors text-sm font-semibold"
                      >
                        Get Directions
                      </a>
                      <a
                        href={`tel:${station.phone}`}
                        className="flex-1 border-2 border-haroti-blue text-haroti-blue hover:bg-haroti-blue hover:text-white text-center py-2 px-4 rounded-lg transition-all text-sm font-semibold"
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
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-8">
            <h2 className="section-heading">Station Locations Map</h2>
            <p className="section-subheading">
              Interactive map view coming soon
            </p>
          </div>

          <div className="bg-white rounded-xl overflow-hidden shadow-lg">
            <div className="h-96 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 font-semibold">Interactive Map</p>
                <p className="text-gray-500 text-sm">Coming Soon</p>
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
              <div className="w-16 h-16 bg-haroti-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="text-haroti-blue" size={28} />
              </div>
              <h3 className="font-bold mb-2">Fast Service</h3>
              <p className="text-gray-600 text-sm">
                Quick refills and minimal wait times
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-haroti-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="text-haroti-orange" size={28} />
              </div>
              <h3 className="font-bold mb-2">Safety Certified</h3>
              <p className="text-gray-600 text-sm">
                All equipment meets safety standards
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-haroti-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="text-haroti-green" size={28} />
              </div>
              <h3 className="font-bold mb-2">Trained Staff</h3>
              <p className="text-gray-600 text-sm">
                Friendly, knowledgeable team members
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="text-purple-600" size={28} />
              </div>
              <h3 className="font-bold mb-2">Clean Facilities</h3>
              <p className="text-gray-600 text-sm">
                Well-maintained, organized stations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-haroti-blue text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Can't Find a Station Near You?
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            We're expanding! Join our franchise network and bring clean cooking to your community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/franchise" className="btn-primary">
              Franchise Opportunities
            </a>
            <a href="/contact" className="bg-white text-haroti-blue hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg transition-colors">
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
