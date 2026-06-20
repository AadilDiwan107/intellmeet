let socket;

import { io } from "socket.io-client";

if (!socket) {
  socket = io("http://localhost:5000", {
    transports: ["websocket"],
  });
}

export default socket;