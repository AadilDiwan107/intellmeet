import React, { useEffect, useRef, useState } from "react";
import socket from "../socket";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate, useLocation } from "react-router-dom";

const VideoCall = () => {
  const localVideo = useRef(null);
  const peersRef = useRef({});
  const streamRef = useRef(null);
  const chatEndRef = useRef(null);
  const screenTrackRef = useRef(null);

  // 🎥 RECORDING CONFIGURATIONS
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const navigate = useNavigate();
  const location = useLocation();

  const { name, roomId, videoOn, audioOn } = location.state || {};
  const myName = name || "You";
  const activeRoomId = roomId || "room1";

  const [remoteStreams, setRemoteStreams] = useState({});
  const [users, setUsers] = useState({});
  const [participants, setParticipants] = useState([]);
  
  // Sidebar visibility panels
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(true);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  const [isSharing, setIsSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [localAudioOn, setLocalAudioOn] = useState(audioOn !== false);
  const [localVideoOn, setLocalVideoOn] = useState(videoOn !== false);

  const typingTimeoutRef = useRef(null);

  // ✅ FIX: Safe disconnect utility that routes straight to Dashboard workspace
  const handleLeaveCall = () => {
    stopMedia();
    socket.emit("leave-room", { roomId: activeRoomId });
    socket.disconnect();
    navigate("/dashboard");
  };

  // =========================
  // 🎥 HARDWARE & LAYER LIFECYCLE
  // =========================
  useEffect(() => {
    socket.connect();

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: localVideoOn,
          audio: localAudioOn,
        });

        streamRef.current = stream;

        if (localVideo.current) {
          localVideo.current.srcObject = stream;
        }

        socket.emit("join-room", {
          roomId: activeRoomId,
          name: myName,
        });

        setParticipants([
          {
            id: socket.id,
            name: myName,
            mic: localAudioOn,
            camera: localVideoOn,
            online: true,
          },
        ]);
      } catch (err) {
        console.error("Failed to fetch internal hardware allocations:", err);
      }
    };

    start();

    // =========================
    // 👤 INTERCEPT SIGNAL ENGINES
    // =========================
    socket.on("user-joined", async ({ userId, name }) => {
      setUsers((prev) => ({ ...prev, [userId]: name }));

      setParticipants((prev) => {
        if (prev.some((p) => p.id === userId)) return prev;
        return [
          ...prev,
          {
            id: userId,
            name,
            mic: true,
            camera: true,
            online: true,
          },
        ];
      });

      const peer = new RTCPeerConnection();
      peersRef.current[userId] = peer;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          peer.addTrack(track, streamRef.current);
        });
      }

      peer.ontrack = (event) => {
        setRemoteStreams((prev) => ({
          ...prev,
          [userId]: event.streams[0],
        }));
      };

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            candidate: event.candidate,
            to: userId,
          });
        }
      };

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit("offer", { offer, to: userId });
    });

    socket.on("offer", async ({ offer, from }) => {
      const peer = new RTCPeerConnection();
      peersRef.current[from] = peer;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          peer.addTrack(track, streamRef.current);
        });
      }

      peer.ontrack = (event) => {
        setRemoteStreams((prev) => ({
          ...prev,
          [from]: event.streams[0],
        }));
      };

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            candidate: event.candidate,
            to: from,
          });
        }
      };

      await peer.setRemoteDescription(offer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("answer", { answer, to: from });
    });

    socket.on("answer", async ({ answer, from }) => {
      const peer = peersRef.current[from];
      if (peer) await peer.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async ({ candidate, from }) => {
      const peer = peersRef.current[from];
      if (peer) await peer.addIceCandidate(candidate);
    });

    socket.on("receive-message", ({ message, sender }) => {
      setMessages((prev) => [
        ...prev,
        {
          text: message,
          self: false,
          senderName: users[sender] || "User",
        },
      ]);
    });

    socket.on("user-typing", ({ userId }) => {
      setTypingUsers((prev) =>
        prev.includes(userId) ? prev : [...prev, userId]
      );
    });

    socket.on("user-stop-typing", ({ userId }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    });

    socket.on("user-left", ({ userId }) => {
      setParticipants((prev) => prev.filter((user) => user.id !== userId));
      setRemoteStreams((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    });

    return () => stopMedia();
  }, []);

  // Sync scroll on chat layout mutation
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const stopMedia = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
    }
  };

  // Peripheral stream control toggles
  const toggleLocalAudio = () => {
    const nextState = !localAudioOn;
    setLocalAudioOn(nextState);
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = nextState));
  };

  const toggleLocalVideo = () => {
    const nextState = !localVideoOn;
    setLocalVideoOn(nextState);
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = nextState));
  };

  // =========================
  // 💬 CHAT HUB ACTIONS
  // =========================
  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("send-message", {
      roomId: activeRoomId,
      message,
    });

    setMessages((prev) => [
      ...prev,
      {
        text: message,
        self: true,
        senderName: myName,
      },
    ]);

    setMessage("");
    socket.emit("stop-typing", { roomId: activeRoomId });
  };

  const handleTyping = (value) => {
    setMessage(value);
    socket.emit("typing", { roomId: activeRoomId });
    clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop-typing", { roomId: activeRoomId });
    }, 1200);
  };

  // =========================
  // 🖥️ SCREEN CAPTURE HANDLER
  // =========================
  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;

      Object.values(peersRef.current).forEach((peer) => {
        const sender = peer.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      });

      if (localVideo.current) localVideo.current.srcObject = screenStream;
      setIsSharing(true);

      screenTrack.onended = stopScreenShare;
    } catch (err) {
      console.error("Screen split allocation failure:", err);
    }
  };

  const stopScreenShare = () => {
    const videoTrack = streamRef.current.getVideoTracks()[0];

    Object.values(peersRef.current).forEach((peer) => {
      const sender = peer.getSenders().find((s) => s.track?.kind === "video");
      if (sender) sender.replaceTrack(videoTrack);
    });

    if (localVideo.current) localVideo.current.srcObject = streamRef.current;
    setIsSharing(false);
  };

  // =========================
  // 🎥 LIVE RECODER LOGIC
  // =========================
  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream) return;

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    recordedChunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `IntellMeet-Capture-${activeRoomId}.webm`;
      a.click();
    };

    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Calculate grid layout structures based on remote connection length
  const remotePeersCount = Object.keys(remoteStreams).length;
  const gridColsClass = remotePeersCount <= 1 ? "col-12" : remotePeersCount <= 2 ? "col-md-6" : "col-lg-4 col-md-6";

  return (
    <div className="vh-100 d-flex flex-column bg-dark text-white overflow-hidden" style={{ background: "#0b0c10" }}>
      
      {/* 🚀 GLOWING TELEMETRY APPLICATION BAR */}
      <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom border-secondary border-opacity-20" style={{ background: "rgba(10, 11, 14, 0.9)", backdropFilter: "blur(10px)" }}>
        <div className="d-flex align-items-center gap-3">
          <h5 className="m-0 fw-bold text-info tracking-wider">🎥 INTELLMEET</h5>
          <span className="badge bg-dark border border-secondary text-secondary font-monospace px-2.5 py-1.5 small">
            ROOM: {activeRoomId}
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
            className={`btn btn-sm fw-semibold px-3 ${showParticipants ? "btn-info text-dark" : "btn-outline-secondary text-light"}`}
            style={{ borderRadius: "8px" }}
          >
            👥 Roster ({participants.length})
          </button>
          <button
            onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
            className={`btn btn-sm fw-semibold px-3 ${showChat ? "btn-info text-dark" : "btn-outline-secondary text-light"}`}
            style={{ borderRadius: "8px" }}
          >
            💬 Chat Log
          </button>
        </div>
      </div>

      {/* MAIN CALL CONTENT SECTION SPLITTER */}
      <div className="d-flex flex-grow-1 position-relative overflow-hidden">
        
        {/* VIDEO COMPONENT MATRIX AREA */}
        <div className="flex-grow-1 position-relative p-3 overflow-y-auto bg-black bg-opacity-40">
          
          {remotePeersCount === 0 ? (
            // Idle waiting state illustration
            <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center">
              <div className="spinner-border text-info mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5 className="text-muted fw-semibold">Waiting for team members to join...</h5>
              <p className="text-white-50 small mb-0">Share Room ID Key <code className="text-warning bg-dark px-2 py-0.5 rounded">{activeRoomId}</code> to invite others.</p>
            </div>
          ) : (
            // Fully adaptive layout node loop
            <div className="row g-3 align-items-center justify-content-center h-100">
              {Object.entries(remoteStreams).map(([id, stream]) => (
                <div key={id} className={`${gridColsClass} position-relative`} style={{ minHeight: "260px" }}>
                  <div className="w-100 h-100 rounded-4 border border-secondary border-opacity-30 overflow-hidden shadow-lg position-relative" style={{ background: "#050608" }}>
                    <video
                      autoPlay
                      playsInline
                      className="w-100 h-100"
                      style={{ objectFit: "cover" }}
                      ref={(video) => { if (video) video.srcObject = stream; }}
                    />
                    <div className="position-absolute bottom-0 start-0 m-3 px-3 py-1.5 rounded-pill small d-flex align-items-center gap-2" style={{ background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(8px)" }}>
                      <span className="text-success small">●</span>
                      <span className="fw-medium text-white">{users[id] || "Remote User"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ⚡ FLOATING CORNER LOCAL USER AVATAR EMBEDDED LOOP */}
          <div className="position-absolute bottom-0 end-0 m-4 shadow-2xl" style={{ zIndex: 10 }}>
            <div className="position-relative rounded-4 border border-info border-opacity-40 overflow-hidden shadow-lg" style={{ background: "#000", width: "240px", height: "150px" }}>
              {localVideoOn ? (
                <video
                  ref={localVideo}
                  autoPlay
                  muted
                  playsInline
                  className="w-100 h-100"
                  style={{ objectFit: "cover", transform: "scaleX(-1)" }}
                />
              ) : (
                <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted small bg-dark bg-opacity-70">
                  <span>🎥 Camera NullIFIED</span>
                </div>
              )}
              <div className="position-absolute bottom-0 start-0 m-2 px-2.5 py-1 rounded-pill x-small fw-semibold" style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(6px)" }}>
                🟢 {myName} (You)
              </div>
            </div>
          </div>

          {/* RECORDING CONSOLE TELEMETRY */}
          {isRecording && (
            <div className="position-absolute top-0 start-0 m-4 bg-danger bg-opacity-20 border border-danger rounded-pill px-3 py-1.5 d-flex align-items-center gap-2 animate-pulse">
              <span className="text-danger fs-6">●</span>
              <small className="text-white font-monospace fw-bold tracking-widest">RECORDING LIVE</small>
            </div>
          )}
        </div>

        {/* 💬 SIDE PANEL CONTAINER: REAL-TIME CHAT ENGINE */}
        {showChat && (
          <div className="d-flex flex-column border-start border-secondary border-opacity-20" style={{ width: "350px", background: "rgba(15, 17, 24, 0.95)", backdropFilter: "blur(15px)" }}>
            <div className="p-3 border-bottom border-secondary border-opacity-10 d-flex justify-content-between align-items-center">
              <h6 className="m-0 fw-bold tracking-wide text-white-50">CHANNEL CONVERSATION</h6>
              <button className="btn p-0 text-muted btn-link text-decoration-none" onClick={() => setShowChat(false)}>✕</button>
            </div>

            <div className="flex-grow-1 p-3 overflow-y-auto d-flex flex-column gap-3" style={{ maxHeight: "calc(100vh - 180px)" }}>
              {messages.map((msg, i) => (
                <div key={i} className={`d-flex flex-column ${msg.self ? "align-items-end" : "align-items-start"}`}>
                  <small className="text-muted mb-1 x-small fw-semibold">{msg.senderName}</small>
                  <div 
                    className="p-2.5 rounded-3 max-w-75 text-break small shadow-sm"
                    style={{ 
                      background: msg.self ? "linear-gradient(135deg, #0d6efd, #0056b3)" : "rgba(255,255,255,0.06)",
                      border: msg.self ? "none" : "1px solid rgba(255,255,255,0.04)",
                      color: "#fff",
                      borderRadius: msg.self ? "12px 12px 2px 12px" : "12px 12px 12px 2px"
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {typingUsers.length > 0 && (
                <div className="x-small text-info italic mt-1 font-monospace animate-pulse">
                  ⚡ Connection typing node activity registered...
                </div>
              )}
              <div ref={chatEndRef}></div>
            </div>

            <div className="p-3 border-top border-secondary border-opacity-10 bg-black bg-opacity-20">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control bg-dark border-secondary text-white small py-2"
                  value={message}
                  style={{ borderRadius: "8px 0 0 8px" }}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Transmit securely..."
                />
                <button onClick={sendMessage} className="btn btn-primary px-3 fw-bold small" style={{ borderRadius: "0 8px 8px 0" }}>
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 👥 SIDE PANEL CONTAINER: ACTIVE PLATFORM PARTICIPANTS */}
        {showParticipants && (
          <div className="d-flex flex-column border-start border-secondary border-opacity-20 shadow-2xl" style={{ width: "350px", background: "rgba(15, 17, 24, 0.95)", backdropFilter: "blur(15px)" }}>
            <div className="p-3 border-bottom border-secondary border-opacity-10 d-flex justify-content-between align-items-center">
              <h6 className="m-0 fw-bold text-white-50">ACTIVE ROSTER POOL</h6>
              <button className="btn p-0 text-muted btn-link text-decoration-none" onClick={() => setShowParticipants(false)}>✕</button>
            </div>

            <div className="p-3 overflow-y-auto d-flex flex-column gap-2">
              {participants.map((user) => (
                <div 
                  key={user.id} 
                  className="d-flex justify-content-between align-items-center rounded-3 p-2.5"
                  style={{ 
                    background: user.name === myName ? "rgba(13, 110, 253, 0.1)" : "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255,255,255,0.04)" 
                  }}
                >
                  <div className="d-flex align-items-center gap-2.5">
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-dark x-small" style={{ width: "32px", height: "32px", background: "linear-gradient(135deg, #22d3ee, #06b6d4)" }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="small fw-semibold text-white-50">{user.name} {user.name === myName && "(You)"}</div>
                      <small className="text-success x-small d-block">● Secure Node</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* 🎛️ PREMIUM HUD USER CONTROL EMBED BAR */}
      <div className="p-3 border-top border-secondary border-opacity-10 d-flex justify-content-center align-items-center gap-3 position-relative" style={{ background: "#0a0b0e" }}>
        
        {/* MUTE CONTROLLER ELEMENT */}
        <button
          onClick={toggleLocalAudio}
          className={`btn rounded-circle d-flex align-items-center justify-content-center transition-all ${localAudioOn ? "btn-dark border border-secondary text-white" : "btn-danger shadow-lg"}`}
          style={{ width: "50px", height: "50px" }}
          title={localAudioOn ? "Mute Microphone" : "Unmute Microphone"}
        >
          <span className="fs-5">{localAudioOn ? "🎤" : "🔇"}</span>
        </button>

        {/* CAMERA KILL REACTION CONTROLLER */}
        <button
          onClick={toggleLocalVideo}
          className={`btn rounded-circle d-flex align-items-center justify-content-center transition-all ${localVideoOn ? "btn-dark border border-secondary text-white" : "btn-danger shadow-lg"}`}
          style={{ width: "50px", height: "50px" }}
          title={localVideoOn ? "Disable Camera" : "Enable Camera"}
        >
          <span className="fs-5">{localVideoOn ? "📷" : "🚫"}</span>
        </button>

        {/* DESKTOP SPLIT SHARE MANAGER */}
        <button
          onClick={isSharing ? stopScreenShare : startScreenShare}
          className={`btn rounded-circle d-flex align-items-center justify-content-center ${isSharing ? "btn-warning text-dark shadow" : "btn-dark border border-secondary text-white"}`}
          style={{ width: "50px", height: "50px" }}
          title={isSharing ? "Halt Monitor Sharing" : "Cast Desktop Stream"}
        >
          <span className="fs-5">🖥️</span>
        </button>

        {/* CAPTURE CONSOLE RECORD CONTROLLER */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`btn rounded-circle d-flex align-items-center justify-content-center ${isRecording ? "btn-danger shadow animate-pulse" : "btn-dark border border-secondary text-white"}`}
          style={{ width: "50px", height: "50px" }}
          title={isRecording ? "Terminate Call Recording" : "Archive Stream Feed Data"}
        >
          <span className="fs-5">🔴</span>
        </button>

        {/* PIPELINE DISCONNECT TRIGGER */}
        <button
          onClick={handleLeaveCall}
          className="btn btn-danger fw-bold px-4 tracking-wide shadow"
          style={{ borderRadius: "10px", background: "linear-gradient(145deg, #dc3545, #bd2130)", border: "none" }}
        >
          Disconnect Call
        </button>
      </div>

    </div>
  );
};

export default VideoCall;