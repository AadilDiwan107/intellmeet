import { useEffect, useRef, useState } from "react";
import socket from "../socket";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate, useLocation } from "react-router-dom";

const VideoCall = () => {
  const localVideo = useRef(null);
  const peersRef = useRef({});
  const streamRef = useRef(null);
  const chatEndRef = useRef(null);
  const screenTrackRef = useRef(null);

  // 🎥 RECORDING
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const { name, roomId, videoOn, audioOn } = location.state || {};
  const myName = name || "You";

  const [remoteStreams, setRemoteStreams] = useState({});
  const [users, setUsers] = useState({});
  const [participants, setParticipants] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  const [isSharing, setIsSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const typingTimeoutRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // =========================
  // 🎥 START MEDIA
  // =========================
  useEffect(() => {
    socket.connect();

    const start = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoOn !== false,
        audio: audioOn !== false,
      });

      streamRef.current = stream;

      if (localVideo.current) {
        localVideo.current.srcObject = stream;
      }

      socket.emit("join-room", {
        roomId: roomId || "room1",
        name: myName,
      });

      // ✅ ADD YOURSELF
      setParticipants([
        {
          id: socket.id,
          name: myName,
          mic: true,
          camera: true,
          online: true,
        },
      ]);
    };

    start();

    // =========================
    // 👤 USER JOINED
    // =========================
    socket.on("user-joined", async ({ userId, name }) => {
      setUsers((prev) => ({ ...prev, [userId]: name }));

      // ✅ PARTICIPANTS
      setParticipants((prev) => [
        ...prev,
        {
          id: userId,
          name,
          mic: true,
          camera: true,
          online: true,
        },
      ]);

      const peer = new RTCPeerConnection();
      peersRef.current[userId] = peer;

      streamRef.current.getTracks().forEach((track) => {
        peer.addTrack(track, streamRef.current);
      });

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

    // =========================
    // 📞 OFFER
    // =========================
    socket.on("offer", async ({ offer, from }) => {
      const peer = new RTCPeerConnection();
      peersRef.current[from] = peer;

      streamRef.current.getTracks().forEach((track) => {
        peer.addTrack(track, streamRef.current);
      });

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

    // =========================
    // ✅ ANSWER
    // =========================
    socket.on("answer", async ({ answer, from }) => {
      const peer = peersRef.current[from];
      if (peer) await peer.setRemoteDescription(answer);
    });

    // =========================
    // ❄️ ICE
    // =========================
    socket.on("ice-candidate", async ({ candidate, from }) => {
      const peer = peersRef.current[from];
      if (peer) await peer.addIceCandidate(candidate);
    });

    // =========================
    // 💬 CHAT
    // =========================
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

    // =========================
    // ✍️ TYPING
    // =========================
    socket.on("user-typing", ({ userId }) => {
      setTypingUsers((prev) =>
        prev.includes(userId) ? prev : [...prev, userId]
      );
    });

    socket.on("user-stop-typing", ({ userId }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    });

    // =========================
    // ❌ USER LEFT
    // =========================
    socket.on("user-left", ({ userId }) => {
      setParticipants((prev) =>
        prev.filter((user) => user.id !== userId)
      );

      setRemoteStreams((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    });

    return () => socket.disconnect();
  }, []);

  // =========================
  // 🔽 AUTO SCROLL
  // =========================
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // =========================
  // 💬 SEND MESSAGE
  // =========================
  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("send-message", {
      roomId,
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
    socket.emit("stop-typing", { roomId });
  };

  // =========================
  // ⌨️ TYPING
  // =========================
  const handleTyping = (value) => {
    setMessage(value);

    socket.emit("typing", { roomId });

    clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop-typing", { roomId });
    }, 1000);
  };

  // =========================
  // 🖥️ SCREEN SHARE
  // =========================
  const startScreenShare = async () => {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });

    const screenTrack = screenStream.getVideoTracks()[0];
    screenTrackRef.current = screenTrack;

    Object.values(peersRef.current).forEach((peer) => {
      const sender = peer
        .getSenders()
        .find((s) => s.track?.kind === "video");

      if (sender) sender.replaceTrack(screenTrack);
    });

    localVideo.current.srcObject = screenStream;
    setIsSharing(true);

    screenTrack.onended = stopScreenShare;
  };

  const stopScreenShare = () => {
    const videoTrack = streamRef.current.getVideoTracks()[0];

    Object.values(peersRef.current).forEach((peer) => {
      const sender = peer
        .getSenders()
        .find((s) => s.track?.kind === "video");

      if (sender) sender.replaceTrack(videoTrack);
    });

    localVideo.current.srcObject = streamRef.current;
    setIsSharing(false);
  };

  // =========================
  // 🎥 RECORDING
  // =========================
  const startRecording = () => {
    const stream = streamRef.current;

    const recorder = new MediaRecorder(stream);

    mediaRecorderRef.current = recorder;
    recordedChunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, {
        type: "video/webm",
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "recording.webm";
      a.click();
    };

    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  return (
    <div className="vh-100 d-flex flex-column bg-dark text-white">

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-black">
        <h5 className="m-0">🎥 IntellMeet</h5>

        <button
          onClick={() => setShowParticipants(!showParticipants)}
          className="btn btn-outline-light btn-sm"
        >
          👥 Participants ({participants.length})
        </button>
      </div>

      <div className="d-flex flex-grow-1 position-relative">

        {/* VIDEO AREA */}
        <div className="flex-grow-1 position-relative p-2">

          {/* REMOTE VIDEOS */}
          <div className="row g-2 h-100">
            {Object.entries(remoteStreams).map(([id, stream]) => (
              <div
                key={id}
                className="col-md-6 h-100 position-relative"
              >
                <video
                  autoPlay
                  playsInline
                  className="w-100 h-100 rounded"
                  style={{
                    objectFit: "cover",
                    background: "#000",
                  }}
                  ref={(video) => {
                    if (video) {
                      video.srcObject = stream;
                    }
                  }}
                />

                <div className="position-absolute bottom-0 start-0 m-2 px-3 py-1 bg-dark rounded-pill small d-flex align-items-center gap-2">
                  <span className="text-success">🟢</span>
                  {users[id] || "User"}
                </div>
              </div>
            ))}
          </div>

          {/* SELF VIDEO */}
          <div className="position-absolute bottom-0 end-0 m-3">
            <div className="position-relative">
              <video
                ref={localVideo}
                autoPlay
                muted
                playsInline
                className="rounded shadow-lg"
                style={{
                  width: "220px",
                  height: "160px",
                  objectFit: "cover",
                  border: "2px solid white",
                  background: "#000",
                }}
              />

              <div className="position-absolute bottom-0 start-0 m-1 px-3 py-1 bg-dark rounded-pill small">
                🟢 {myName}
              </div>
            </div>
          </div>

          {/* RECORDING */}
          {isRecording && (
            <div className="position-absolute top-0 start-0 m-3 text-danger fw-bold bg-dark px-3 py-2 rounded-pill">
              🔴 Recording...
            </div>
          )}
        </div>

        {/* CHAT */}
        <div
          className="bg-secondary p-3 d-flex flex-column"
          style={{
            width: "320px",
          }}
        >
          <h6 className="mb-3">💬 Chat</h6>

          <div
            className="flex-grow-1"
            style={{
              overflowY: "auto",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-2 ${msg.self ? "text-end" : ""}`}
              >
                <small className="text-info">
                  {msg.senderName}
                </small>

                <div
                  className={`p-2 rounded ${
                    msg.self
                      ? "bg-primary"
                      : "bg-dark"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {typingUsers.length > 0 && (
              <div className="small text-light">
                {typingUsers
                  .map((id) => users[id] || "Someone")
                  .join(", ")}{" "}
                is typing...
              </div>
            )}

            <div ref={chatEndRef}></div>
          </div>

          <div className="d-flex mt-3">
            <input
              className="form-control me-2"
              value={message}
              onChange={(e) =>
                handleTyping(e.target.value)
              }
              onKeyDown={(e) =>
                e.key === "Enter" && sendMessage()
              }
              placeholder="Type message..."
            />

            <button
              onClick={sendMessage}
              className="btn btn-primary"
            >
              Send
            </button>
          </div>
        </div>

        {/* 👥 PARTICIPANTS PANEL */}
        {showParticipants && (
          <div
            className="position-absolute top-0 end-0 bg-dark text-white shadow-lg border-start border-secondary"
            style={{
              width: "320px",
              height: "100%",
              zIndex: 999,
              overflowY: "auto",
            }}
          >
            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary">
              <div>
                <h5 className="m-0">
                  👥 Participants
                </h5>

                <small className="text-light">
                  {participants.length} in meeting
                </small>
              </div>

              <button
                className="btn btn-sm btn-outline-light rounded-circle"
                onClick={() =>
                  setShowParticipants(false)
                }
              >
                ✕
              </button>
            </div>

            {/* PARTICIPANTS LIST */}
            <div className="p-2">
              {participants.map((user) => (
                <div
                  key={user.id}
                  className="d-flex justify-content-between align-items-center rounded p-3 mb-2"
                  style={{
                    background:
                      user.name === myName
                        ? "rgba(13,110,253,0.25)"
                        : "rgba(255,255,255,0.05)",
                    border:
                      user.name === myName
                        ? "1px solid rgba(13,110,253,0.5)"
                        : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="d-flex align-items-center gap-3">

                    {/* AVATAR */}
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                      style={{
                        width: "45px",
                        height: "45px",
                        background:
                          "linear-gradient(135deg,#0d6efd,#3b82f6)",
                      }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>

                    {/* INFO */}
                    <div>
                      <div className="fw-semibold d-flex align-items-center gap-2">
                        {user.name}

                        {user.name === myName && (
                          <span className="badge bg-primary">
                            You
                          </span>
                        )}
                      </div>

                      <small className="text-success">
                        🟢 Online
                      </small>
                    </div>
                  </div>

                  {/* STATUS ICONS */}
                  <div className="d-flex gap-2 fs-5">
                    <span title="Microphone">
                      🎤
                    </span>

                    <span title="Camera">
                      📷
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* CONTROL BAR */}
      <div className="bg-black border-top p-3 d-flex justify-content-center align-items-center gap-3">

        {/* SCREEN SHARE */}
        <button
          onClick={
            isSharing
              ? stopScreenShare
              : startScreenShare
          }
          className={`btn rounded-circle ${
            isSharing
              ? "btn-warning"
              : "btn-dark"
          }`}
          style={{
            width: "55px",
            height: "55px",
          }}
        >
          🖥️
        </button>

        {/* RECORD */}
        <button
          onClick={
            isRecording
              ? stopRecording
              : startRecording
          }
          className={`btn rounded-circle ${
            isRecording
              ? "btn-danger"
              : "btn-dark"
          }`}
          style={{
            width: "55px",
            height: "55px",
          }}
        >
          🔴
        </button>

        {/* PARTICIPANTS */}
        <button
          onClick={() =>
            setShowParticipants(!showParticipants)
          }
          className="btn btn-dark rounded-circle"
          style={{
            width: "55px",
            height: "55px",
          }}
        >
          👥
        </button>

        {/* LEAVE */}
        <button
          onClick={handleLogout}
          className="btn btn-danger rounded-pill px-4"
        >
          Leave
        </button>
      </div>
    </div>
  );
};

export default VideoCall;