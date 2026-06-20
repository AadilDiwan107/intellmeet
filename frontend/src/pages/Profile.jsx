import React from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const store = useAuthStore();
  const navigate = useNavigate();

  // Extract logged-in user details from the authenticated state store
  const rawUser = store.user || store.authUser;
  const loggedInUser = rawUser?.user ? rawUser.user : rawUser;

  return (
    <div className="container-fluid min-vh-100 bg-dark text-white p-4 position-relative overflow-hidden">
      
      {/* BACKGROUND GRAPHIC GLOW */}
      <div
        className="position-absolute top-50 start-50 translate-middle"
        style={{
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(23, 162, 184, 0.15), transparent)",
          filter: "blur(100px)",
          zIndex: 0,
        }}
      />

      <div className="container position-relative" style={{ zIndex: 1, maxWidth: "600px" }}>
        
        {/* 🔙 BACK TO HOME / DASHBOARD HEADER ACTION */}
        <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
          <button 
            className="btn btn-outline-info d-flex align-items-center gap-2 fw-semibold btn-sm px-3"
            onClick={() => navigate("/dashboard")}
            style={{ borderRadius: "8px" }}
          >
            <span>⬅️</span> Back to Dashboard
          </button>
          <h4 className="mb-0 fw-bold text-info">My IntellMeet Profile</h4>
        </div>

        {/* 💎 USER ACCOUNT CARD PROFILE PANEL */}
        <div 
          className="p-4 shadow-lg text-center"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "20px",
            backdropFilter: "blur(15px)",
            WebkitBackdropFilter: "blur(15px)",
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}
        >
          {/* AVATAR WRAPPER */}
          <div className="position-relative d-inline-block mb-4">
            <div 
              className="rounded-circle bg-info text-dark d-flex align-items-center justify-content-center fw-bold shadow-lg"
              style={{ width: "100px", height: "100px", fontSize: "2.5rem" }}
            >
              {loggedInUser?.name ? loggedInUser.name.charAt(0).toUpperCase() : "U"}
            </div>
            <span className="position-absolute bottom-0 end-0 bg-success border border-dark rounded-circle p-2" title="Online Session Status"></span>
          </div>

          {/* MAIN TITLES */}
          <h2 className="fw-bold text-white mb-1">{loggedInUser?.name || "Guest User"}</h2>
          <span className="badge bg-primary px-3 py-2 text-uppercase mb-4 tracking-wider fs-7">
            ⚙️ System {loggedInUser?.role || "user"}
          </span>

          {/* ACCOUNT DETAILS FIELD ELEMENTS */}
          <div className="text-start d-flex flex-column gap-3 mt-2">
            
            {/* DATABASE ID */}
            <div className="p-3 rounded-3" style={{ background: "rgba(0, 0, 0, 0.2)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <label className="text-light small d-block mb-1 fw-semibold text-uppercase tracking-wider">
                MongoDB Document Cluster ID
              </label>
              <code className="text-warning fs-6 bg-black px-2 py-1 rounded d-inline-block border border-secondary mt-1 text-break">
                {loggedInUser?._id || loggedInUser?.id || "No Live Connection String"}
              </code>
            </div>

            {/* REGISTERED EMAIL */}
            <div className="p-3 rounded-3" style={{ background: "rgba(0, 0, 0, 0.2)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <label className="text-light small d-block mb-1 fw-semibold text-uppercase tracking-wider">
                Primary Contact Email Address
              </label>
              <span className="text-light fs-5 d-block text-truncate">
                {loggedInUser?.email || "Not Available"}
              </span>
            </div>

            {/* CREATED TIMESTAMP */}
            {loggedInUser?.createdAt && (
              <div className="p-3 rounded-3" style={{ background: "rgba(0, 0, 0, 0.2)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <label className="text-light small d-block mb-1 fw-semibold text-uppercase tracking-wider">
                  Account Onboarding Date
                </label>
                <span className="text-light small d-block">
                  {new Date(loggedInUser.createdAt).toLocaleString()}
                </span>
              </div>
            )}

          </div>

          {/* SECURITY TIP FOOTER */}
          <p className="text-light small mt-4 pt-2 mb-0 border-top border-secondary border-opacity-50">
            🔒 This enterprise account session is verified for the 2026 application landscape.
          </p>

        </div>
      </div>
    </div>
  );
};

export default Profile;