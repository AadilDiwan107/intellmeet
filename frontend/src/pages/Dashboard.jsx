import React, { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const store = useAuthStore();
  const navigate = useNavigate();

  const rawUser = store.user || store.authUser;
  const loggedInUser = rawUser?.user ? rawUser.user : rawUser;
  const logout = store.logout;

  useEffect(() => {
    console.log("Verified User Object:", loggedInUser);
  }, [loggedInUser]);

  const handleLogout = () => {
    if (logout) logout();
    navigate("/login");
  };

  return (
    <div className="container-fluid min-vh-100 bg-dark text-white p-4">
      
      {/* 🔹 TOP BAR NAVBAR CONTROL */}
      <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          {/* 🔥 TRIGGER BUTTON FOR SIDEBAR */}
          <button 
            className="btn btn-outline-info d-flex align-items-center justify-content-center" 
            type="button" 
            data-bs-toggle="offcanvas" 
            data-bs-target="#intellMeetSidebar" 
            aria-controls="intellMeetSidebar"
            style={{ width: "42px", height: "42px", borderRadius: "10px" }}
          >
            <i className="bi bi-list fs-4">☰</i>
          </button>
          <div>
            <h1 className="fw-bold mb-0 h3">IntellMeet Dashboard</h1>
            <p className="text-light small mb-0">Enterprise Meeting Intelligence Platform</p>
          </div>
        </div>
        
        <button className="btn btn-outline-danger btn-sm d-none d-sm-inline-block" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* 💎 PREMIUM GLASSMORPHIC SIDEBAR MENU (OFFCANVAS) */}
      <div 
        className="offcanvas offcanvas-start text-white" 
        tabIndex="-1" 
        id="intellMeetSidebar" 
        aria-labelledby="intellMeetSidebarLabel"
        style={{
          background: "rgba(20, 24, 33, 0.9)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(255, 255, 255, 0.1)",
          width: "300px"
        }}
      >
        {/* SIDEBAR HEADER */}
        <div className="offcanvas-header border-bottom border-secondary">
          <h5 className="offcanvas-title fw-bold text-info" id="intellMeetSidebarLabel">
            ✨ IntellMeet Navigation
          </h5>
          <button 
            type="button" 
            className="btn-close btn-close-white" 
            data-bs-dismiss="offcanvas" 
            aria-label="Close"
          ></button>
        </div>

        {/* SIDEBAR BODY LINKS */}
        <div className="offcanvas-body d-flex flex-column justify-content-between">
          <div className="d-flex flex-column gap-3">
            
            {/* QUICK ACTIONS SECTION */}
            <div className="small text-light text-uppercase fw-bold tracking-wider mt-2">Workspace Actions</div>
            
            <button 
              className="btn btn-primary w-100 text-start py-2.5 d-flex align-items-center gap-2 fw-semibold"
              onClick={() => { navigate("/lobby"); }}
              data-bs-dismiss="offcanvas"
              style={{ borderRadius: "10px", background: "linear-gradient(135deg, #0d6efd, #0056b3)", border: "none" }}
            >
              <span className="fs-5">➕</span> Create Meeting
            </button>

            <button 
              className="btn btn-outline-light w-100 text-start py-2.5 d-flex align-items-center gap-2"
              onClick={() => { navigate("/lobby"); }}
              data-bs-dismiss="offcanvas"
              style={{ borderRadius: "10px", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              <span className="fs-5">🔑</span> Join Meeting
            </button>

            {/* SYSTEM SHORTCUTS */}
            <div className="small text-light text-uppercase fw-bold tracking-wider mt-3">Account Operations</div>
            
            <button 
              className="btn btn-link text-white text-decoration-none text-start p-2 d-flex align-items-center gap-2 rounded w-100"
              onClick={() => navigate("/profile")}
              style={{ background: "rgba(255,255,255,0.05)" }}
              data-bs-dismiss="offcanvas"
            >
              <span>👤</span> View Profile Details
            </button>
            
          </div>

          {/* SIDEBAR FOOTER (USER MINI PROFILE + ACTION) */}
          <div className="border-top border-secondary pt-3 pb-2">
            <div className="d-flex align-items-center gap-2 mb-3 px-1">
              <div 
                className="rounded-circle bg-info text-dark d-flex align-items-center justify-content-center fw-bold"
                style={{ width: "38px", height: "38px" }}
              >
                {loggedInUser?.name ? loggedInUser.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="overflow-hidden">
                <h6 className="mb-0 text-truncate text-white small fw-bold">{loggedInUser?.name || "Guest User"}</h6>
                <small className="text-primary d-block text-truncate x-small">{loggedInUser?.email || "N/A"}</small>
              </div>
            </div>
            
            <button 
              className="btn btn-danger w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold" 
              onClick={handleLogout}
              data-bs-dismiss="offcanvas"
              style={{ borderRadius: "8px" }}
            >
              <span>🚪</span> Log Out Session
            </button>
          </div>

        </div>
      </div>

      {/* 🎛️ MAIN CONTENT AREA CONTAINER */}
      <div className="row g-4">
        {/* LEFT CARD: ACCOUNT SUMMARY */}
        <div className="col-md-5 col-lg-4">
          <div className="p-4 shadow-sm h-100" style={{ background: "rgba(255, 255, 255, 0.05)", borderRadius: "15px", border: "1px solid rgba(255, 255, 255, 0.1)", backdropFilter: "blur(10px)" }}>
            <h4 className="fw-bold text-info mb-3">User Details</h4>
            
            <div className="mb-3">
              <label className="text-light small d-block">IntellMeet ID </label>
              <code className="text-warning fs-6 bg-black px-2 py-1 rounded d-inline-block border border-secondary mt-1">
                {loggedInUser?._id || loggedInUser?.id || "No ID Loaded"}
              </code>
            </div>

            <div className="mb-3">
              <label className="text-light small d-block">User Name</label>
              <span className="fw-semibold d-block text-info fs-5">
                {loggedInUser?.name || "Guest User"}
              </span>
            </div>

            <div className="mb-3">
              <label className="text-light small d-block">Registered Email</label>
              <span className="text-primary d-block">
                {loggedInUser?.email || "N/A"}
              </span>
            </div>

            <div>
              <label className="text-white-50 small d-block">User Role</label>
              <span className="badge bg-primary px-3 py-2 mt-1">
                {loggedInUser?.role || "user"}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT AREA PANEL: FUNCTIONAL PROJECT MODULES */}
        <div className="col-md-7 col-lg-8">
          <div className="d-flex flex-column gap-4 h-100">
            
            {/* 🔗 QUICK MEETING INTERACTION HUB */}
            <div 
              className="p-4" 
              style={{ 
                background: "rgba(255, 255, 255, 0.03)", 
                borderRadius: "15px", 
                border: "1px solid rgba(255, 255, 255, 0.08)" 
              }}
            >
              <h5 className="text-info fw-bold mb-1">⚡ Instant Collaboration Rooms</h5>
              <p className="text-muted small mb-4">Launch zero-latency video rooms or bridge real-time text environments instantly.</p>
              
              <div className="row g-3">
                <div className="col-sm-6">
                  <div 
                    className="p-3 h-100 d-flex flex-column justify-content-between text-start border border-secondary border-opacity-20 transition-all"
                    style={{ background: "rgba(0, 0, 0, 0.2)", borderRadius: "12px", cursor: "pointer" }}
                    onClick={() => navigate("/lobby")}
                  >
                    <div>
                      <div className="fs-3 mb-2">📹</div>
                      <h6 className="fw-bold text-white mb-1">Create Meeting Session</h6>
                      <p className="text-muted small mb-3">Generate a secure unique WebRTC connection room token.</p>
                    </div>
                    <span className="text-primary small fw-semibold">Launch Room &rarr;</span>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div 
                    className="p-3 h-100 d-flex flex-column justify-content-between text-start border border-secondary border-opacity-20 transition-all"
                    style={{ background: "rgba(0, 0, 0, 0.2)", borderRadius: "12px", cursor: "pointer" }}
                    onClick={() => navigate("/lobby")}
                  >
                    <div>
                      <div className="fs-3 mb-2">🔑</div>
                      <h6 className="fw-bold text-white mb-1">Join with ID Key</h6>
                      <p className="text-muted small mb-3">Enter an active target channel hash string directly.</p>
                    </div>
                    <span className="text-info small fw-semibold">Connect &rarr;</span>
                  </div>
                </div>
              </div>
            </div>

           

          </div>
        </div>
      </div>
{/* 🚀 FOOTER */}
<footer
  className="mt-5 py-4 text-center"
  style={{
    borderTop: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(10px)",
  }}
>
  <div className="container">
    <h5 className="fw-bold text-info mb-2">IntellMeet</h5>

    <p className="text-light small mb-2">
      Enterprise Meeting Intelligence Platform
    </p>

    <div className="d-flex justify-content-center gap-3 mb-3 flex-wrap">
      <button
        className="btn btn-sm btn-outline-info"
        onClick={() => navigate("/dashboard")}
      >
        Dashboard
      </button>

      <button
        className="btn btn-sm btn-outline-info"
        onClick={() => navigate("/lobby")}
      >
        Meetings
      </button>

      <button
        className="btn btn-sm btn-outline-info"
        onClick={() => navigate("/profile")}
      >
        Profile
      </button>
    </div>

    <small className="text-secondary">
      © {new Date().getFullYear()} IntellMeet. All Rights Reserved.
      <br />
      Logged in as{" "}
      <span className="text-info">
        {loggedInUser?.name || "Guest User"}
      </span>
    </small>
  </div>
</footer>
    </div>
  );
};

export default Dashboard;