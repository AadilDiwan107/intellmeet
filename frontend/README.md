# 🚀 IntellMeet – Real-Time Video Meeting App

IntellMeet is a full-stack real-time video conferencing application built with modern web technologies. It supports video calling, chat, authentication, and meeting management with scalable architecture.

---

## 📌 Features

### 🔐 Authentication

* User registration & login
* JWT-based authentication
* Protected routes
* Redis-based session management (optional)

### 📅 Meeting System

* Create meeting
* Get all meetings (user-specific)
* Update meeting
* Delete meeting
* Unique meeting code generation

### 🎥 Video Calling (WebRTC)

* Peer-to-peer video connection
* Multi-user video support
* Real-time signaling using Socket.io
* ICE candidate exchange

### 💬 Real-Time Chat

* Send/receive messages instantly
* Room-based messaging
* Clean chat UI

### 🔔 Notifications

* User joined / left notifications
* Message alerts
* Real-time updates via Socket.io

---

## 🛠 Tech Stack

### Backend

* Node.js
* Express.js
* MongoDB + Mongoose
* Socket.io
* Redis (ioredis)
* JWT Authentication

### Frontend

* React.js
* Tailwind CSS
* WebRTC API
* Socket.io Client

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/intellmeet.git
cd intellmeet
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```
PORT=5000
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret_key
```

Run backend:

```bash
npm run dev
```

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

### 4️⃣ Redis Setup (Local)

Start Redis server:

```bash
redis-server
```

---

## 🔌 API Endpoints

### Auth

* `POST /api/auth/register`
* `POST /api/auth/login`

### Meetings (Protected)

* `POST /api/meetings`
* `GET /api/meetings`
* `PUT /api/meetings/:id`
* `DELETE /api/meetings/:id`

---

## ⚡ Socket Events

### Client → Server

* `join-room`
* `offer`
* `answer`
* `ice-candidate`
* `send-message`

### Server → Client

* `room-joined`
* `user-joined`
* `user-left`
* `offer`
* `answer`
* `ice-candidate`
* `receive-message`
* `notification`

---

## 📂 Project Structure

```
backend/
 ├── config/
 ├── controllers/
 ├── middleware/
 ├── models/
 ├── routes/
 └── server.js

frontend/
 ├── components/
 ├── pages/
 ├── socket.js
 └── App.jsx
```

---

## 🧪 Testing

* API tested using Postman
* Real-time features tested in multiple browser tabs
* Video + chat verified working

---

## 🚧 Known Issues

* Duplicate socket logs in development (non-critical)
* UI can be improved
* Socket authentication not implemented yet

---

## 📈 Future Improvements

* Screen sharing
* Recording meetings
* Socket authentication (JWT)
* Better UI/UX
* Deployment (Docker + Cloud)

---

## 👨‍💻 Author

Developed by **Aadil** 🚀

---

## 📄 License

This project is open-source and available under the MIT License.

---

## ✅ Status

✔ Backend APIs complete
✔ Real-time system working
✔ Video + Chat working
✔ Ready for frontend improvements

---
