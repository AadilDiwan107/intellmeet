import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore"; // 🔥 Integrated your Zustand instance

const Lobby = () => {
  const store = useAuthStore();
  const navigate = useNavigate();
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Extract logged-in user details to automatically bind name variables
  const rawUser = store.user || store.authUser;
  const loggedInUser = rawUser?.user ? rawUser.user : rawUser;

  // Initialize name automatically from active session or fallback gracefully
  const [name, setName] = useState(loggedInUser?.name || "");
  const [roomId, setRoomId] = useState("");

  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);

  // Synchronize state value if session parameters hydrate slowly
  useEffect(() => {
    if (loggedInUser?.name) {
      setName(loggedInUser.name);
    }
  }, [loggedInUser]);

  // Handle stream cycles natively based on hardware status flags
  useEffect(() => {
    if (videoOn) {
      startMedia();
    } else {
      stopMedia();
    }
    return () => stopMedia();
  }, [videoOn]);

  const startMedia = async () => {
    try {
      // Release any existing tracks before requesting a fresh hardware lock
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      // Apply initial mute/unmute states to tracks immediately
      stream.getAudioTracks().forEach((t) => (t.enabled = audioOn));
      stream.getVideoTracks().forEach((t) => (t.enabled = videoOn));

      if (videoRef.current && videoOn) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Media hardware allocation error:", err);
    }
  };

  const stopMedia = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const toggleAudio = () => {
    const enabled = !audioOn;
    setAudioOn(enabled);
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = enabled));
  };

  const toggleVideo = () => {
    setVideoOn((prev) => !prev);
  };

  // Utility logic to generate high-end room tokens instantly
  const generateRandomRoom = () => {
    const randomHash = Math.random().toString(36).substring(2, 7) + "-" + Math.random().toString(36).substring(2, 7);
    setRoomId(randomHash);
  };

  const handleJoin = () => {
    if (!name.trim()) {
      alert("Please provide an identity name string.");
      return;
    }
    if (!roomId.trim()) {
      alert("Please specify or generate an active Target Room ID.");
      return;
    }

    // Pass structured route matrices onwards to the active WebRTC view container
    navigate("/video", {
      state: { name, roomId, videoOn, audioOn },
    });
  };

  return (
    <div className="container-fluid min-vh-100 bg-dark text-white p-4 d-flex flex-column justify-content-between position-relative overflow-hidden">
      
      {/* BACKGROUND BLUR DESIGN GLOW */}
      <div
        className="position-absolute top-50 start-50 translate-middle"
        style={{
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(13, 110, 253, 0.1), transparent)",
          filter: "blur(120px)",
          zIndex: 0,
        }}
      />

      <div className="container my-auto position-relative" style={{ zIndex: 1, maxWidth: "1100px" }}>
        
        {/* 🔙 BACK TO WORKSPACE CONTROLLER HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-5 pb-3 border-bottom border-secondary border-opacity-50">
          <button 
            className="btn btn-outline-info d-flex align-items-center gap-2 fw-semibold btn-sm px-3"
            onClick={() => navigate("/dashboard")}
            style={{ borderRadius: "8px" }}
          >
            <span>⬅️</span> Return to Dashboard
          </button>
          <div>
            <h4 className="mb-0 fw-bold text-info text-end">Pre-Flight Device Lobby</h4>
            <small className="text-muted d-block text-end">Configure hardware peripherals before access validation</small>
          </div>
        </div>

        <div className="row g-4 align-items-center">
          
          {/* 🎥 THEMED VIDEO SCREEN (LEFT SIDE CONTAINER) */}
          <div className="col-lg-6">
            <div 
              className="position-relative bg-black rounded-4 shadow-lg border border-secondary overflow-hidden d-flex flex-column align-items-center justify-content-center"
              style={{ minHeight: "360px", background: "linear-gradient(145deg, #0f111a, #050608)" }}
            >
              {videoOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-100 h-100 rounded-4"
                  style={{ maxHeight: "380px", objectFit: "cover", transform: "scaleX(-1)" }} // Mirror effect for standard webcam comfort
                />
              ) : (
                <div className="text-center p-5">
                  <div className="fs-1 mb-2 text-secondary">🚫</div>
                  <div className="text-muted fw-semibold">Video Stream Feed Suspended</div>
                  <small className="text-white-50 x-small d-block mt-1">Activate camera peripheral below to register signal</small>
                </div>
              )}

              {/* OVERLAID DEVICE FEEDS TRIGGER CONTROL ROW */}
              <div 
                className="position-absolute bottom-0 start-50 translate-middle-x mb-3 d-flex gap-3 px-3 py-2 rounded-pill shadow-lg border border-white border-opacity-10"
                style={{ background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(12px)" }}
              >
                <button
                  onClick={toggleAudio}
                  className={`btn rounded-circle d-flex align-items-center justify-content-center ${audioOn ? "btn-outline-light" : "btn-danger"}`}
                  style={{ width: "45px", height: "45px", transition: "all 0.2s" }}
                  title={audioOn ? "Mute Microphone" : "Unmute Microphone"}
                >
                  <span className="fs-5">{audioOn ? "🎤" : "🔇"}</span>
                </button>

                <button
                  onClick={toggleVideo}
                  className={`btn rounded-circle d-flex align-items-center justify-content-center ${videoOn ? "btn-outline-light" : "btn-danger"}`}
                  style={{ width: "45px", height: "45px", transition: "all 0.2s" }}
                  title={videoOn ? "Kill Video Stream" : "Initialize Video Stream"}
                >
                  <span className="fs-5">{videoOn ? "📷" : "🚫"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 🎛️ IDENTITY CONFIGURATION CONTROLS (RIGHT SIDE PANEL) */}
          <div className="col-lg-6">
            <div 
              className="p-4 shadow-lg border border-white border-opacity-10"
              style={{ 
                background: "rgba(255, 255, 255, 0.03)", 
                borderRadius: "20px", 
                backdropFilter: "blur(15px)" 
              }}
            >
              <h3 className="fw-bold text-white mb-1">Secure Channel Validation</h3>
              <p className="text-muted small mb-4">Confirm your display identity signature and channel target space token matrix.</p>

              {/* FIELD: NAME */}
              <div className="mb-3">
                <label className="text-light small d-block mb-1.5 fw-semibold tracking-wide">Display Name Signature</label>
                <div className="position-relative">
                  <input
                    type="text"
                    placeholder="Provide meeting name label..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-control bg-dark text-white border-secondary py-2.5 ps-3"
                    style={{ borderRadius: "10px" }}
                  />
                </div>
              </div>

              {/* FIELD: ROOM ID KEY WITH DYNAMIC GENERATOR */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1.5">
                  <label className="text-light small fw-semibold tracking-wide mb-0">Target Channel Room ID Key</label>
                  <button 
                    type="button" 
                    className="btn btn-link text-info text-decoration-none x-small p-0 fw-semibold"
                    onClick={generateRandomRoom}
                  >
                    ✨ Auto-Generate Secure Key
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Enter custom room string or click generate..."
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="form-control bg-dark text-white border-secondary py-2.5"
                  style={{ borderRadius: "10px", fontFamily: roomId ? "monospace" : "inherit" }}
                />
              </div>

              {/* PRIMARY GATEWAY REDIRECT TRIGGER BUTTON */}
              <button
                onClick={handleJoin}
                className="btn btn-primary w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 shadow"
                style={{ 
                  borderRadius: "12px", 
                  background: "linear-gradient(135deg, #0d6efd, #0056b3)", 
                  border: "none",
                  fontSize: "1.05rem" 
                }}
              >
                Establish Workspace Connection 🚀
              </button>

              <div className="mt-4 text-center">
                <small className="text-muted text-uppercase tracking-wider x-small d-block">
                  🔒 End-to-Peer Stream Protocols Enforced
                </small>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* FOOTER METADATA NOTICE */}
      <div className="text-center mt-5 position-relative" style={{ zIndex: 1 }}>
        <p className="x-small text-muted mb-0">IntellMeet Platform Cluster v2.0 • Real-Time Gateway</p>
      </div>

    </div>
  );
};

export default Lobby;