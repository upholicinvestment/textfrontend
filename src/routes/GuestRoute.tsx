import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const GuestRoute = () => {
  const { token, isLoading } = useContext(AuthContext);
  if (isLoading) return <div className="text-center mt-10">Checking authentication...</div>;
  return token ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default GuestRoute;