import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks';
import { Navbar, Footer, ErrorBoundary } from './components/ui';
import Landing from './pages/Landing';
import { Loader2 } from 'lucide-react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const StudySession = lazy(() => import('./pages/StudySession'));
const GuestMode = lazy(() => import('./pages/GuestMode'));
const NotFound = lazy(() => import('./pages/NotFound'));

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-midnight text-accent">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  if (!isAuthenticated) return <Navigate to="/" />;

  return children;
};

function App() {
  const { loading } = useAuth();

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
      <main className="flex-1 flex flex-col w-full relative">
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-midnight text-accent">
                <Loader2 className="w-10 h-10 animate-spin" />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/try" element={<GuestMode />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
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
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}

export default App;
