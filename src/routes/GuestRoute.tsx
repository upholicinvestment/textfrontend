import { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const GuestRoute = () => {
  const { token, isLoading } = useContext(AuthContext);
  const location = useLocation();

  if (isLoading) {
    return <div className="text-center mt-10">Checking authentication...</div>;
  }

  // Allow a logged-in user to access /signup as a checkout page
  const qs = new URLSearchParams(location.search);
  const isPurchaseFlow = !!qs.get('productKey') || qs.get('mode') === 'purchase';

  if (token && !isPurchaseFlow) {
    const hinted = sessionStorage.getItem('postSignupPath');
    const target = hinted || '/dashboard';
    if (hinted) sessionStorage.removeItem('postSignupPath');
    return <Navigate to={target} replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default GuestRoute;
