import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();
  
  // Redirect based on user role
  if (user?.role === 'faculty') {
    return <Navigate to="/faculty-dashboard" replace />;
  } else if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  } else {
    return <Navigate to="/dashboard" replace />;
  }
};

export default Index;
