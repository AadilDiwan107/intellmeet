import { useEffect, useRef, useState } from "react";
import socket from "../socket";

const VideoCall = () => {
  const localVideo = useRef(null);
  const peersRef = useRef({});
  const streamRef = useRef(null);

  const [remoteStreams, setRemoteStreams] = useState({});

  // 💬 CHAT
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  // 🔔 NOTIFICATIONS
  const [notifications, setNotifications] = useState([]);

  // 🔔 ADD NOTIFICATION FUNCTION (PRO LEVEL)
  const addNotification = (text, type = "info") => {
    const id = Date.now();

    const newNotif = { id, text, type };

    setNotifications((prev) => [...prev, newNotif]);

    // auto remove after 3 sec
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  // 💬 SEND MESSAGE
  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("send-message", {
      roomId: "room1",
      message,
    });

    setMessages((prev) => [...prev, { text: message, self: true }]);
    setMessage("");
  };

  useEffect(() => {
    socket.connect();

    const start = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (localVideo.current) {
        localVideo.current.srcObject = stream;
      }

      socket.emit("join-room", "room1");
    };

    start();

    // 💬 RECEIVE CHAT
    socket.on("receive-message", ({ message }) => {
      setMessages((prev) => [...prev, { text: message, self: false }]);
    });

    // 🔔 NOTIFICATIONS (PRO)
    socket.on("user-joined", () => {
      addNotification("👤 Someone joined the meeting", "join");
    });

    socket.on("user-left", () => {
      addNotification("👋 Someone left the meeting", "leave");
    });

    socket.on("notification", () => {
      addNotification("💬 New message received", "message");
    });

    // 🔥 WEBRTC

    socket.on("user-joined", async (userId) => {
      const peer = new RTCPeerConnection();
      peersRef.current[userId] = peer;

      const stream = streamRef.current;

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
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

      const stream = streamRef.current;

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
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

    socket.on("user-left", (userId) => {
      if (peersRef.current[userId]) {
        peersRef.current[userId].close();
        delete peersRef.current[userId];
      }

      setRemoteStreams((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-5 mt-10">
      <h2>Video Call</h2>

      {/* 🎥 LOCAL VIDEO */}
      <video ref={localVideo} autoPlay playsInline muted width="300" />

      {/* 🎥 REMOTE VIDEOS */}
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(remoteStreams).map(([id, stream]) => (
          <video
            key={id}
            autoPlay
            playsInline
            className="rounded-lg"
            ref={(video) => {
              if (video) video.srcObject = stream;
            }}
          />
        ))}
      </div>

      {/* 🔔 TOAST NOTIFICATIONS */}
      <div className="fixed top-5 right-5 space-y-3 z-50">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white min-w-[220px] transition-all duration-300 ${
              n.type === "join"
                ? "bg-green-500"
                : n.type === "leave"
                ? "bg-red-500"
                : "bg-blue-500"
            }`}
          >
            {n.text}
          </div>
        ))}
      </div>

      {/* 💬 CHAT UI */}
      <div className="mt-6 w-full max-w-md bg-gray-900 rounded-xl shadow-lg flex flex-col">
        <div className="p-3 border-b border-gray-700 font-semibold">
          💬 Meeting Chat
        </div>

        <div className="flex-1 h-64 overflow-y-auto p-3 space-y-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.self ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-3 py-2 rounded-xl max-w-[70%] text-sm ${
                  msg.self
                    ? "bg-blue-500 text-white"
                    : "bg-gray-700 text-white"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 p-3 border-t border-gray-700">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 p-2 rounded-lg bg-gray-800 outline-none text-white"
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />

          <button
            onClick={sendMessage}
            className="bg-blue-500 hover:bg-blue-600 px-4 rounded-lg"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;