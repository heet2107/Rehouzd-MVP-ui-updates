import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Box } from '@chakra-ui/react';
import LandingPage from './rehouzd/estimator/landing/LandingPage';
import Navbar from './rehouzd/estimator/landing/components/Navbar';
import Footer from './rehouzd/estimator/landing/components/Footer';
import AccountSettingsPage from "./rehouzd/estimator/auth/components/AccountSettingsPage";
import EstimatePage from "./rehouzd/estimator/estimates/EstimatePage";
import PricingPage from './rehouzd/estimator/pricing/PricingPage';
import SavedEstimatesPage from './rehouzd/estimator/estimates/components/SavedEstimatesPage';

// ScrollToTop component to handle scrolling to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function App() {
  return (
    <BrowserRouter>
      <Box display="flex" flexDirection="column" minH="100vh">
        <Navbar />
        <ScrollToTop />
        <Box flex="1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/account" element={<AccountSettingsPage />} />
            <Route path="/estimate" element={<EstimatePage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/saved-estimates" element={<SavedEstimatesPage />} />
          </Routes>
        </Box>
        <Footer />
      </Box>
    </BrowserRouter>
  );
}

export default App;
