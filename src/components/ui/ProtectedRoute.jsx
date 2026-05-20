import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import BrandedLoadingScreen from './BrandedLoadingScreen';

const ProtectedRoute = ({ children }) => {
  const { authStatus, isAuthenticated, accountDisabled, retryAuth } = useAuth();
  const location = useLocation();

  if (authStatus === 'loading') {
    return <BrandedLoadingScreen onRetry={retryAuth} />;
  }

  if (accountDisabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-midnight px-6 py-10 text-white">
        <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-slate-950/95 p-10 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
          <p className="text-sm uppercase tracking-[0.32em] text-accent-light">Account issue</p>
          <h1 className="mt-4 text-3xl font-heading font-bold text-white">This account has been disabled.</h1>
          <p className="mt-4 text-sm leading-7 text-gray-300">
            Please contact support if you believe this is an error. Your current work remains available in the browser.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
