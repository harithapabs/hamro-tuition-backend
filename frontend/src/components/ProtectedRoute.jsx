import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loading text="Verifying access..." />;
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute;
