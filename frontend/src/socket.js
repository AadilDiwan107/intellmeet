import { io } from "socket.io-client";

const socket = io("https://intellmeet-1-79gh.onrender.com", {
  transports: ["websocket"],
});

export default socket;
