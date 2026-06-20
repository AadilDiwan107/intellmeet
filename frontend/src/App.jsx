import { Routes, Route } from "react-router-dom";
import VideoCall from "./pages/VideoCall";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard"; // ✅ Import your new Dashboard component
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import Profile from "./pages/Profile";
import Lobby from "./pages/Lobby";

function App() {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />
      <Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  }
/>

      {/* PROTECTED ROUTES */}
      {/* ✅ ADDED DASHBOARD ROUTE WRAPPED IN PROTECTEDROUTE */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/video"
        element={
          <ProtectedRoute>
            <VideoCall />
          </ProtectedRoute>
        }
      />

      {/* ✅ WRAPPED LOBBY IN PROTECTEDROUTE AS WELL */}
      <Route
        path="/lobby"
        element={
          <ProtectedRoute>
            <Lobby />
          </ProtectedRoute>
        }
      />

      {/* FALLBACK FOR UNMATCHED ROUTES */}
      <Route path="*" element={<div className="text-white p-5">404 - Page Not Found</div>} />
    </Routes>
  );
}

export default App;