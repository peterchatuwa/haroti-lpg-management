import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ProductsPage } from './pages/ProductsPage';
import { StationsPage } from './pages/StationsPage';
import { FranchisePage } from './pages/FranchisePage';
import { ImpactPage } from './pages/ImpactPage';
import { InvestorsPage } from './pages/InvestorsPage';
import { NewsPage } from './pages/NewsPage';
import { CareersPage } from './pages/CareersPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';

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
