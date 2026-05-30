import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Nav from './components/Nav';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import NewsPage from './pages/NewsPage';
import TrainingPage from './pages/TrainingPage';
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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/*" element={
            <>
              <Nav />
              <Routes>
                <Route path="/"             element={<HomePage />} />
                <Route path="/programs"     element={<ProgramsPage />} />
                <Route path="/events"       element={<EventsPage />} />
                <Route path="/news"         element={<NewsPage />} />
                <Route path="/training"     element={<TrainingPage />} />
                <Route path="/members"      element={<MembersPage />} />
                <Route path="/membership"   element={<MembershipPage />} />
                <Route path="/policies"     element={<PoliciesPage />} />
                <Route path="/funding"      element={<FundingPage />} />
                <Route path="/partnerships" element={<PartnershipsPage />} />
                <Route path="/admin"         element={<AdminPage />} />
                <Route path="/contact-admin" element={<ContactAdminPage />} />
                <Route path="/terms"         element={<TermsPage />} />
                <Route path="/chatbot"       element={<ChatbotPage />} />
              </Routes>
              <Footer />
              <Chatbot />
            </>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
