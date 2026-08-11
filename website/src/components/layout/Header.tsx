import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Phone, Mail } from 'lucide-react';
import { erpUrl } from '../../config/urls';

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about' },
    { name: 'Products & PAYC', href: '/products' },
    { name: 'Find a Station', href: '/stations' },
    { name: 'Franchise', href: '/franchise' },
    { name: 'Impact & ESG', href: '/impact' },
    { name: 'Investors', href: '/investors' },
    { name: 'News', href: '/news' },
    { name: 'Careers', href: '/careers' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Top bar with contact info */}
      <div className="bg-haroti-blue text-white py-2">
        <div className="container-custom flex justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            <a href="tel:+265" className="flex items-center gap-1 hover:text-haroti-orange transition-colors">
              <Phone size={14} />
              <span className="hidden sm:inline">+265 XXX XXX XXX</span>
            </a>
            <a href="mailto:info@harotigas.com" className="flex items-center gap-1 hover:text-haroti-orange transition-colors">
              <Mail size={14} />
              <span className="hidden sm:inline">info@harotiholdingslimited.com</span>
            </a>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="hidden md:inline">Powering Clean Cooking Across Malawi</span>
            <a
              href={erpUrl('/portal')}
              className="hover:text-haroti-orange transition-colors"
            >
              Customer Portal
            </a>
            <a
              href={erpUrl('/login')}
              className="hover:text-haroti-orange transition-colors"
            >
              Staff Login
            </a>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="container-custom py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-12 h-12 bg-haroti-orange rounded-full flex items-center justify-center text-white font-bold text-xl">
              HG
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-xl text-haroti-blue">HAROTI GAS</div>
              <div className="text-xs text-gray-600">Powering the World</div>
            </div>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-haroti-orange hover:bg-gray-50 rounded-md transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* CTA Button - Desktop */}
          <div className="hidden lg:block">
            <Link to="/franchise" className="btn-primary text-sm py-2 px-4">
              Apply for Franchise
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t pt-4">
            <div className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-base font-medium text-gray-700 hover:text-haroti-orange hover:bg-gray-50 rounded-md transition-colors"
                >
                  {item.name}
                </Link>
              ))}
              <Link
                to="/franchise"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary text-center mt-4"
              >
                Apply for Franchise
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
