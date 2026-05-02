import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const Lobby = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("room1");

  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);

  useEffect(() => {
    startMedia();
    return () => stopMedia();
  }, []);

  const startMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoOn,
        audio: audioOn,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Media error:", err);
    }
  };

  const stopMedia = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  };

  const toggleAudio = () => {
    const enabled = !audioOn;
    setAudioOn(enabled);
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = enabled));
  };

  const toggleVideo = () => {
    const enabled = !videoOn;
    setVideoOn(enabled);
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = enabled));
  };

  const handleJoin = () => {
    if (!name.trim()) {
      alert("Enter your name");
      return;
    }

    navigate("/video", {
      state: { name, roomId, videoOn, audioOn },
    });
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-dark text-white">

      <div className="row w-100" style={{ maxWidth: "1000px" }}>

        {/* 🎥 VIDEO */}
        <div className="col-md-6 mb-4">
          <div className="card bg-black border-secondary shadow-lg h-100 d-flex align-items-center justify-content-center">

            {videoOn ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-100 rounded"
                style={{ maxHeight: "400px", objectFit: "cover" }}
              />
            ) : (
              <div className="text-muted p-5">Camera is OFF</div>
            )}

          </div>
        </div>

        {/* 🎛️ CONTROLS */}
        <div className="col-md-6 d-flex align-items-center">
          <div className="card bg-secondary bg-opacity-10 border-secondary shadow-lg p-4 w-100">

            <h3 className="mb-4 text-center">Join Meeting</h3>

            {/* NAME */}
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-control mb-3 bg-dark text-white border-secondary"
            />

            {/* ROOM */}
            <input
              type="text"
              placeholder="Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="form-control mb-3 bg-dark text-white border-secondary"
            />

            {/* BUTTONS */}
            <div className="d-flex gap-2 mb-3">

              <button
                onClick={toggleAudio}
                className={`btn w-50 ${
                  audioOn ? "btn-success" : "btn-danger"
                }`}
              >
                {audioOn ? "🎤 Mic ON" : "🔇 Mic OFF"}
              </button>

              <button
                onClick={toggleVideo}
                className={`btn w-50 ${
                  videoOn ? "btn-success" : "btn-danger"
                }`}
              >
                {videoOn ? "📷 Camera ON" : "🚫 Camera OFF"}
              </button>

            </div>

            {/* JOIN */}
            <button
              onClick={handleJoin}
              className="btn btn-primary w-100 py-2 fw-bold"
            >
              Join Meeting 🚀
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;