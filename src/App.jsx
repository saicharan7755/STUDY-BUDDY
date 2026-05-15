import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './hooks';
import { Navbar, Footer, ErrorBoundary, CookieConsentBanner } from './components/ui';
import Landing from './pages/Landing';
import Signup from './pages/Signup';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import { Loader2 } from 'lucide-react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const DueCards = lazy(() => import('./pages/DueCards'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const StudyProgressDashboard = lazy(() => import('./pages/StudyProgressDashboard'));
const StudySession = lazy(() => import('./pages/StudySession'));
const GuestMode = lazy(() => import('./pages/GuestMode'));
const Login = lazy(() => import('./pages/Login'));
const NotFound = lazy(() => import('./pages/NotFound'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-midnight text-accent">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
};

function App() {
  const { loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center text-accent">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-midnight text-white selection:bg-accent selection:text-white">
      <Navbar />
      <CookieConsentBanner />
      <main className="flex-1 flex flex-col w-full relative">
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-midnight text-accent">
                <Loader2 className="w-10 h-10 animate-spin" />
              </div>
            }
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                className="flex min-h-full flex-1 flex-col"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <Routes location={location}>
                  <Route path="/" element={<Landing />} />
                  <Route path="/try" element={<GuestMode />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms-of-service" element={<TermsPage />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/due"
                    element={
                      <ProtectedRoute>
                        <DueCards />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/progress"
                    element={
                      <ProtectedRoute>
                        <StudyProgressDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/session/:id"
                    element={
                      <ProtectedRoute>
                        <StudySession />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}

export default App;
