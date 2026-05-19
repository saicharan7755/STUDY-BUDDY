import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './hooks';
import useNavigationGuard from './hooks/useNavigationGuard';
import { startDeadLinkScanner } from './utils/deadLinkScanner';
import {
  Navbar,
  Footer,
  ErrorBoundary,
  CookieConsentBanner,
  BrandedLoadingScreen,
  ProtectedRoute,
  PublicOnlyRoute,
  SessionExpiredModal,
} from './components/ui';
import Landing from './pages/Landing';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const DueCards = lazy(() => import('./pages/DueCards'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const StudyProgressDashboard = lazy(() => import('./pages/StudyProgressDashboard'));
const StudySession = lazy(() => import('./pages/StudySession'));
const GuestMode = lazy(() => import('./pages/GuestMode'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));

const PublicLayout = () => <Outlet />;
const DashboardLayout = () => <Outlet />;

function App() {
  const { sessionExpired, clearSessionExpired, login } = useAuth();
  const location = useLocation();

  useNavigationGuard();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const blockedPaths = ['/login', '/signup', '/forgot-password', '/reset-password'];
    const shouldPersist = !blockedPaths.some((path) => location.pathname.startsWith(path));

    if (shouldPersist) {
      window.sessionStorage.setItem('cramAI_lastRoute', location.pathname + location.search);
    }
  }, [location]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isDevelopment = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';
    if (!isDevelopment) return;
    startDeadLinkScanner();
  }, []);

  const AuthRedirect = () => {
    const { authStatus, isAuthenticated } = useAuth();

    if (authStatus === 'loading') {
      return <BrandedLoadingScreen />;
    }

    return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-midnight text-white transition-opacity duration-150 ease-out selection:bg-accent selection:text-white">
      <Navbar />
      <CookieConsentBanner />
      <main className="flex-1 flex flex-col w-full relative">
        <ErrorBoundary>
          <Suspense fallback={<BrandedLoadingScreen />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                className="flex min-h-full flex-1 flex-col"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <Routes location={location}>
                  <Route element={<PublicLayout />}>
                    <Route path="/" element={<Landing />} />
                    <Route element={<PublicOnlyRoute />}>
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    </Route>
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                    <Route path="/terms-of-service" element={<TermsPage />} />
                    <Route path="/auth/*" element={<AuthRedirect />} />
                  </Route>

                  <Route element={<ProtectedRoute />}>
                    <Route element={<DashboardLayout />}>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/due" element={<DueCards />} />
                      <Route path="/progress" element={<StudyProgressDashboard />} />
                      <Route path="/session/:id" element={<StudySession />} />
                    </Route>
                  </Route>

                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <SessionExpiredModal isOpen={sessionExpired} onClose={clearSessionExpired} onLogin={login} />
    </div>
  );
}

export default App;
