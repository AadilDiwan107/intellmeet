import { Routes, Route } from "react-router-dom";
import VideoCall from "./pages/VideoCall";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
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

      {/* PROTECTED ROUTE */}
      <Route
        path="/video"
        element={
          <ProtectedRoute>
            <VideoCall />
          </ProtectedRoute>
        }
      />
      <Route path="/lobby" element={<Lobby />} />

    </Routes>
  );
}

export default App;