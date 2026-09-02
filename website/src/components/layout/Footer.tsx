import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import { BrandFooter } from '../BrandFooter';
import { CONTACT_ADDRESS_LINES, CONTACT_EMAIL, CONTACT_PHONES } from '../../config/contact';

export const Footer = () => {
  return (
    <footer className="bg-haroti-forest-deep text-white">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-haroti-orange rounded-full flex items-center justify-center text-white font-bold">
                HG
              </div>
              <div>
                <div className="font-bold text-lg">HAROTI GAS</div>
                <div className="text-xs text-gray-400">Powering the World</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Leading provider of clean LPG energy solutions across Malawi,
              committed to sustainable and affordable cooking for all.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-gray-400 hover:text-haroti-orange transition-colors">About Us</Link></li>
              <li><Link to="/products" className="text-gray-400 hover:text-haroti-orange transition-colors">Products & PAYC</Link></li>
              <li><Link to="/stations" className="text-gray-400 hover:text-haroti-orange transition-colors">Find a Station</Link></li>
              <li><Link to="/franchise" className="text-gray-400 hover:text-haroti-orange transition-colors">Franchise Opportunities</Link></li>
              <li><Link to="/impact" className="text-gray-400 hover:text-haroti-orange transition-colors">Impact & ESG</Link></li>
              <li><Link to="/investors" className="text-gray-400 hover:text-haroti-orange transition-colors">Investors & Partners</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/news" className="text-gray-400 hover:text-haroti-orange transition-colors">News & Updates</Link></li>
              <li><Link to="/careers" className="text-gray-400 hover:text-haroti-orange transition-colors">Careers</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-haroti-orange transition-colors">Contact Us</Link></li>
              <li><Link to="/legal/privacy" className="text-gray-400 hover:text-haroti-orange transition-colors">Privacy Policy</Link></li>
              <li><Link to="/legal/terms" className="text-gray-400 hover:text-haroti-orange transition-colors">Terms of Use</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-1 flex-shrink-0 text-haroti-orange" />
                <span>
                  {CONTACT_ADDRESS_LINES.map((line, index) => (
                    <span key={line}>
                      {line}
                      {index < CONTACT_ADDRESS_LINES.length - 1 && <br />}
                    </span>
                  ))}
                </span>
              </li>
              {CONTACT_PHONES.map((phone) => (
                <li key={phone.href} className="flex items-center gap-2">
                  <Phone size={16} className="flex-shrink-0 text-haroti-orange" />
                  <a href={`tel:${phone.href}`} className="hover:text-haroti-orange transition-colors">
                    {phone.display}
                  </a>
                </li>
              ))}
              <li className="flex items-center gap-2">
                <Mail size={16} className="flex-shrink-0 text-haroti-orange" />
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-haroti-orange transition-colors">
                  {CONTACT_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-haroti-leaf/20 mt-8 pt-8 text-center text-sm text-white/60">
          <p>&copy; {new Date().getFullYear()} Haroti Holdings Limited (T/A Haroti Gas). All rights reserved.</p>
          <p className="mt-2">Registered in Malawi | Committed to clean cooking and sustainable energy</p>
        </div>
      </div>

      <BrandFooter variant="dark" />
    </footer>
  );
};
