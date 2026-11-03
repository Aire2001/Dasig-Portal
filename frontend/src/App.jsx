import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Automatically scrolls window to top on route change for seamless navigation
function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, search]);
  return null;
}
import { AuthProvider } from './context/AuthContext';
import Nav from './components/Nav';
import ColdStartBanner from './components/ColdStartBanner';
import NetworkStatusToast from './components/NetworkStatusToast';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import HomePage from './pages/HomePage';
import NewsPage from './pages/NewsPage';
import ProgramsPage from './pages/ProgramsPage';
import MembersPage from './pages/MembersPage';
import MembershipPage from './pages/MembershipPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PoliciesPage from './pages/PoliciesPage';
import FundingPage from './pages/FundingPage';
import PartnershipsPage from './pages/PartnershipsPage';
import ContactAdminPage from './pages/ContactAdminPage';
import TermsPage from './pages/TermsPage';
import ChatbotPage from './pages/ChatbotPage';
import ProfilePage from './pages/ProfilePage';
import VerifyPassPage from './pages/VerifyPassPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ForgotPasswordPage />} />
          <Route path="/*" element={
            <>
              <ColdStartBanner />
              <NetworkStatusToast />
              <Nav />
              <main id="main-content" tabIndex={-1} style={{ outline: 'none' }}>
                <Routes>
                  <Route path="/"             element={<HomePage />} />
                  <Route path="/programs"     element={<ProgramsPage />} />
                  <Route path="/calendar"     element={<Navigate to="/programs?tab=calendar" replace />} />
                  <Route path="/event"        element={<Navigate to="/programs?tab=events" replace />} />
                  <Route path="/events"       element={<Navigate to="/programs?tab=events" replace />} />
                  <Route path="/news"         element={<NewsPage />} />
                  <Route path="/training"     element={<Navigate to="/programs?tab=training" replace />} />
                  <Route path="/trainings"    element={<Navigate to="/programs?tab=training" replace />} />
                  <Route path="/grants"       element={<Navigate to="/funding" replace />} />
                  <Route path="/members"      element={<MembersPage />} />
                  <Route path="/membership"   element={<MembershipPage />} />
                  <Route path="/policies"     element={<PoliciesPage />} />
                  <Route path="/funding"      element={<FundingPage />} />
                  <Route path="/partnerships" element={<PartnershipsPage />} />
                  <Route path="/admin"         element={<AdminPage />} />
                  <Route path="/contact-admin" element={<ContactAdminPage />} />
                  <Route path="/terms"         element={<TermsPage />} />
                  <Route path="/chatbot"       element={<ChatbotPage />} />
                  <Route path="/profile"       element={<ProfilePage />} />
                  <Route path="/verify-pass"   element={<VerifyPassPage />} />
                  <Route path="*"             element={<NotFoundPage />} />
                </Routes>
              </main>
              <Footer />
              <Chatbot />
            </>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
