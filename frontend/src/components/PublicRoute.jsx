import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

const PublicRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token);

  if (token) {
    return <Navigate to="/video" replace />;
  }

  return children;
};

export default PublicRoute;