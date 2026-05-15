import PropTypes from 'prop-types';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import BrandedLoadingScreen from './BrandedLoadingScreen';

const PublicOnlyRoute = ({ children }) => {
  const { authStatus, isAuthenticated, retryAuth } = useAuth();

  if (authStatus === 'loading') {
    return <BrandedLoadingScreen onRetry={retryAuth} />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children || <Outlet />;
};

PublicOnlyRoute.propTypes = {
  children: PropTypes.node,
};

export default PublicOnlyRoute;
