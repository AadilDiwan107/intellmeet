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
    };

    start();

    // USER JOIN
    socket.on("user-joined", async ({ userId, name }) => {
      setUsers((prev) => ({ ...prev, [userId]: name }));

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

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // =========================
  // 💬 CHAT
  // =========================
  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("send-message", { roomId, message });

    setMessages((prev) => [
      ...prev,
      { text: message, self: true, senderName: myName },
    ]);

    setMessage("");
    socket.emit("stop-typing", { roomId });
  };

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
      const sender = peer.getSenders().find((s) => s.track?.kind === "video");
      if (sender) sender.replaceTrack(screenTrack);
    });

    localVideo.current.srcObject = screenStream;
    setIsSharing(true);

    screenTrack.onended = stopScreenShare;
  };

  const stopScreenShare = () => {
    const videoTrack = streamRef.current.getVideoTracks()[0];

    Object.values(peersRef.current).forEach((peer) => {
      const sender = peer.getSenders().find((s) => s.track?.kind === "video");
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
      <div className="d-flex justify-content-between p-3 border-bottom">
        <h5>🎥 IntellMeet</h5>

        <div className="d-flex gap-2">

          {/* SCREEN SHARE */}
          <button
            onClick={isSharing ? stopScreenShare : startScreenShare}
            className={`btn ${
              isSharing ? "btn-warning" : "btn-success"
            } btn-sm`}
          >
            {isSharing ? "Stop Sharing" : "Share Screen"}
          </button>

          {/* RECORDING */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`btn ${
              isRecording ? "btn-danger" : "btn-outline-danger"
            } btn-sm`}
          >
            {isRecording ? "Stop Recording 🔴" : "Start Recording"}
          </button>

          <button onClick={handleLogout} className="btn btn-danger btn-sm">
            Leave
          </button>
        </div>
      </div>

      <div className="d-flex flex-grow-1">

        {/* VIDEO */}
        <div className="flex-grow-1 position-relative p-2">

          <div className="row g-2 h-100">
            {Object.entries(remoteStreams).map(([id, stream]) => (
              <div key={id} className="col-md-6 h-100 position-relative">
                <video
                  autoPlay
                  playsInline
                  className="w-100 h-100 rounded"
                  ref={(video) => video && (video.srcObject = stream)}
                />
                <div className="position-absolute bottom-0 start-0 m-2 px-2 py-1 bg-dark rounded small">
                  {users[id] || "User"}
                </div>
              </div>
            ))}
          </div>

          {/* SELF VIDEO */}
          <div className="position-absolute bottom-0 end-0 m-3">
            <video
              ref={localVideo}
              autoPlay
              muted
              playsInline
              className="rounded"
              style={{
                width: "200px",
                height: "150px",
                objectFit: "cover",
                border: "2px solid white",
              }}
            />
            <div className="position-absolute bottom-0 start-0 m-1 px-2 py-1 bg-dark rounded small">
              {myName}
            </div>
          </div>

          {/* 🔴 RECORD INDICATOR */}
          {isRecording && (
            <div className="position-absolute top-0 start-0 m-3 text-danger fw-bold">
              🔴 Recording...
            </div>
          )}
        </div>

        {/* CHAT */}
        <div className="bg-secondary p-2" style={{ width: "300px" }}>
          <h6>💬 Chat</h6>

          <div style={{ height: "65vh", overflowY: "auto" }}>
            {messages.map((msg, i) => (
              <div key={i} className={`mb-2 ${msg.self ? "text-end" : ""}`}>
                <small className="text-info">{msg.senderName}</small>
                <div
                  className={`p-2 rounded ${
                    msg.self ? "bg-primary" : "bg-dark"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {typingUsers.length > 0 && (
              <div className="text-muted small">
                {typingUsers.map((id) => users[id] || "Someone").join(", ")} is typing...
              </div>
            )}

            <div ref={chatEndRef}></div>
          </div>

          <div className="d-flex mt-2">
            <input
              className="form-control me-2"
              value={message}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage} className="btn btn-primary">
              Send
            </button>
          </div>

          
        </div>

      </div>
    </div>
  );
};

export default VideoCall;