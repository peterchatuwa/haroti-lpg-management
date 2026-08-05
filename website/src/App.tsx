import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';

// Placeholder components for other pages
const AboutPage = () => <div className="container-custom py-16"><h1 className="text-4xl font-bold">About Us</h1><p className="mt-4">Coming soon...</p></div>;
const ProductsPage = () => <div className="container-custom py-16"><h1 className="text-4xl font-bold">Products & PAYC</h1><p className="mt-4">Coming soon...</p></div>;
const StationsPage = () => <div className="container-custom py-16"><h1 className="text-4xl font-bold">Find a Station</h1><p className="mt-4">Coming soon...</p></div>;
const FranchisePage = () => <div className="container-custom py-16"><h1 className="text-4xl font-bold">Franchise Opportunities</h1><p className="mt-4">Coming soon...</p></div>;
const ImpactPage = () => <div className="container-custom py-16"><h1 className="text-4xl font-bold">Impact & ESG</h1><p className="mt-4">Coming soon...</p></div>;
const InvestorsPage = () => <div className="container-custom py-16"><h1 className="text-4xl font-bold">Investors & Partners</h1><p className="mt-4">Coming soon...</p></div>;
const NewsPage = () => <div className="container-custom py-16"><h1 className="text-4xl font-bold">News & Updates</h1><p className="mt-4">Coming soon...</p></div>;
const CareersPage = () => <div className="container-custom py-16"><h1 className="text-4xl font-bold">Careers</h1><p className="mt-4">Coming soon...</p></div>;
const ContactPage = () => <div className="container-custom py-16"><h1 className="text-4xl font-bold">Contact Us</h1><p className="mt-4">Coming soon...</p></div>;
const PrivacyPage = () => <div className="container-custom py-16"><h1 className="text-4xl font-bold">Privacy Policy</h1><p className="mt-4">Coming soon...</p></div>;
const TermsPage = () => <div className="container-custom py-16"><h1 className="text-4xl font-bold">Terms of Use</h1><p className="mt-4">Coming soon...</p></div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="stations" element={<StationsPage />} />
          <Route path="franchise" element={<FranchisePage />} />
          <Route path="impact" element={<ImpactPage />} />
          <Route path="investors" element={<InvestorsPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="careers" element={<CareersPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="legal/privacy" element={<PrivacyPage />} />
          <Route path="legal/terms" element={<TermsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
