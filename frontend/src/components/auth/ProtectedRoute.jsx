import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-margin-sm">
        <div className="w-full max-w-sm bg-surface-container-lowest rounded-xl p-space-lg shadow-level1 flex flex-col items-center text-center gap-space-md">
          <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-on-primary shadow-sm">
            <span className="material-symbols-outlined text-[24px] animate-spin">sync</span>
          </div>
          <div>
            <h2 className="text-headline-sm text-on-surface">Restoring your workspace…</h2>
            <p className="text-body-sm text-on-surface-variant mt-1">Verifying your session</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
