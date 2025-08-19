import { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const GuestRoute = () => {
  const { token, isLoading } = useContext(AuthContext);
  const location = useLocation();

  if (isLoading) {
    return <div className="text-center mt-10">Checking authentication...</div>;
  }

  if (token) {
    // Respect the intended post-signup route if set
    const hinted = sessionStorage.getItem('postSignupPath');
    const target = hinted || '/dashboard';
    if (hinted) sessionStorage.removeItem('postSignupPath');
    return <Navigate to={target} replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default GuestRoute;
