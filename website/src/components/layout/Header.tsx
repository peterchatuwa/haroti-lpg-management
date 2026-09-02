import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Phone, Mail } from 'lucide-react';
import { CONTACT_EMAIL, PRIMARY_PHONE } from '../../config/contact';

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
    <header className="bg-haroti-paper shadow-sm sticky top-0 z-50">
      <div className="bg-haroti-forest text-white py-2">
        <div className="container-custom flex justify-between items-center text-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <a
              href={`tel:${PRIMARY_PHONE.href}`}
              className="flex items-center gap-1 hover:text-haroti-orange transition-colors"
            >
              <Phone size={14} />
              <span className="hidden sm:inline">{PRIMARY_PHONE.display}</span>
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="flex items-center gap-1 hover:text-haroti-orange transition-colors"
            >
              <Mail size={14} />
              <span className="hidden md:inline">{CONTACT_EMAIL}</span>
            </a>
          </div>
          <span className="hidden md:inline text-xs">Powering Clean Cooking Across Malawi</span>
        </div>
      </div>

      <nav className="container-custom py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-12 h-12 bg-haroti-orange rounded-full flex items-center justify-center text-white font-bold text-xl">
              HG
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-xl text-haroti-forest">HAROTI GAS</div>
              <div className="text-xs text-haroti-muted">Powering the World</div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="px-3 py-2 text-sm font-medium text-haroti-ink/90 hover:text-haroti-flame hover:bg-haroti-mist rounded-md transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden lg:block">
            <Link to="/franchise" className="btn-primary text-sm py-2 px-4">
              Apply for Franchise
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-md text-haroti-ink/90 hover:bg-haroti-mist"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t pt-4">
            <div className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-base font-medium text-haroti-ink/90 hover:text-haroti-orange hover:bg-haroti-paper rounded-md transition-colors"
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
