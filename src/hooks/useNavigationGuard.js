import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

const protectedPatterns = [/^\/dashboard($|\/)/, /^\/due($|\/)/, /^\/progress($|\/)/, /^\/session\//];
const publicPatterns = [/^\/$/, /^\/login($|\/)/, /^\/signup($|\/)/, /^\/forgot-password($|\/)/, /^\/reset-password($|\/)/, /^\/privacy-policy($|\/)/, /^\/terms-of-service($|\/)/];
const authRedirectPatterns = [/^\/auth($|\/)/];

const matches = (patterns, path) => patterns.some((pattern) => pattern.test(path));

export default function useNavigationGuard() {
  const { authStatus, isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (authStatus === 'loading') {
      return;
    }

    const path = location.pathname;
    const isProtected = matches(protectedPatterns, path);
    const isPublic = matches(publicPatterns, path);
    const isAuthRedirect = matches(authRedirectPatterns, path);
    const isKnownRoute = isProtected || isPublic || isAuthRedirect;

    if (isAuthRedirect) {
      console.info(
        `[NavigationGuard] Direct auth route detected: ${path}. Redirect should follow auth rule or route fallback.`
      );
      return;
    }

    if (isProtected && !isAuthenticated) {
      console.warn(
        `[NavigationGuard] Auth required route accessed while unauthenticated: ${path}`
      );
      return;
    }

    if (!isKnownRoute) {
      if (isAuthenticated) {
        console.warn(
          `[NavigationGuard] Authenticated user landed on unknown route: ${path}`
        );
      } else {
        console.warn(
          `[NavigationGuard] Unauthenticated user landed on unknown route: ${path}`
        );
      }
    }
  }, [authStatus, isAuthenticated, location.pathname]);
}
