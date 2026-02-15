# 🗳️ Real-Time Poll Rooms

## Overview

**Real-Time Poll Rooms** is a full-stack web application that allows users to create polls, share them via a unique link, and collect votes with live results for all participants. The app ensures real-time updates, fairness, and persistence across sessions.

Users can:

- Create a poll with a question and multiple options.
- Share a poll via a unique link.
- Join any poll using the link and cast a vote.
- See live updates as others vote.
- Prevent multiple votes from the same participant using session-based controls.

This project was built using the **MERN Stack**:

- **MongoDB**
- **Express.js**
- **React / Next.js**
- **Node.js**

Real-time communication is handled using **WebSockets (ws)**.

---

## 📑 Table of Contents

- Features
- Technology Stack
- Architecture
- Usage
- Fairness / Anti-Abuse Mechanisms
- Persistence
- Edge Cases Handled
- Known Limitations / Future Improvements
- Deployment

---

## 🚀 Features

### 1️⃣ Poll Creation

- Users can create polls with a question and at least two options.
- After creation, a unique shareable link is generated.

### 2️⃣ Join by Link

- Anyone with the link can view the poll and vote.
- Single-choice voting per participant.

### 3️⃣ Real-Time Results

- Results update instantly across all connected users using WebSockets.
- No need to refresh the page.

### 4️⃣ Fairness / Anti-Abuse

- Session-based identity ensures one vote per participant per session.
- IP address + browser session tracking prevent casual repeat voting.

### 5️⃣ Persistence

- Polls and votes are stored in MongoDB.
- Refreshing the page does not remove poll or vote data.

### 6️⃣ Deployment

- Fully deployed to a public URL.
- Link-based joining works across multiple devices.

---

## 🛠️ Technology Stack

| Layer | Technology |
|--------|------------|
| Frontend | React, Next.js |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Real-Time | WebSockets (ws) |
| Deployment | Vercel / Render / Heroku (fill actual) |

---

## 🏗️ Architecture
[Browser / Client]
|
| WebSocket / HTTP
v
[Node.js + Express Server]
|
| MongoDB / Mongoose
v
[Persistence Layer: Polls, Votes]

### Explanation

- **Client** handles UI rendering and WebSocket connection.
- **Server** manages:
  - Room creation
  - Vote validation
  - Broadcasting live updates
  - Fairness checks
- **Database** stores:
  - Poll details
  - Votes
  - Participant session data

---

## ▶️ Usage

1. Open the Home Page.
2. Click **Create Poll**.
3. Enter question and options.
4. Copy the generated poll link.
5. Share the link or open it in another tab.
6. Users join the poll via the link.
7. Enter name (if required).
8. Cast vote.
9. Votes update live for all participants.

---

## 🔒 Fairness / Anti-Abuse Mechanisms

### 1️⃣ One Vote per User (Session-Based Voting)

- Each participant is uniquely identified via a `clientId` stored in `localStorage`.
- A user can vote only once per poll.
- Refreshing the page does not reset voting eligibility.
- Vote remains tied to that session.

### 2️⃣ IP + Session Check

- The server tracks participant IP addresses.
- Prevents casual repeat voting from the same network.
- If another session from the same IP attempts voting:
  - One vote per session per poll is enforced.
  - Unique name validation may be required.

### ⚠️ Limitations

- Users can bypass restrictions using:
  - Multiple devices
  - Incognito mode
  - VPN
- Designed for assignment/demo scale, not enterprise-grade security.

---

## 💾 Persistence

- All polls and votes are stored in MongoDB.
- Refreshing the page restores:
  - Poll state
  - Vote count
  - Participant session
- Room-specific username storage ensures no duplication after reload.

---

## 🧩 Edge Cases Handled

- Block unauthorized users from starting polls.
- Handle creator disconnect/reconnect without losing poll state.
- Multiple rooms operate independently without data conflicts.
- Vote cannot be cast twice from same session.

---

## 🚧 Known Limitations / Future Improvements

- Multi-device same-user detection is limited.
- Large-scale concurrency not load-tested.
- Anti-abuse could be improved with:
  - CAPTCHA
  - OAuth authentication
  - Rate limiting
- UI improvements:
  - Better mobile responsiveness
  - Real-time animations
  - Improved vote visualization charts

---

## Local Setup and Installation ⚙️

1.  *Prerequisites*: Node.js (v18 or higher) and npm installed.
2.  *Clone the repository*: git clone <your-repo-url>
3.  *Install Backend Dependencies*:
    bash
    cd server
    npm install
    
4.  *Install Frontend Dependencies*:
    bash
    cd client
    npm install
    
5.  *Run the Backend Server*:
    bash
    ## From the /server directory
    node src/index.js 
    ## The server will be running on http://localhost:8080
    
6.  *Run the Frontend Application*:
    bash
    ## From the /client directory
    npm run dev
    ## The application will be running on http://localhost:3000

## 🌍 Deployment

- **Public URL:** https://your-app-url.com
- **GitHub Repository:** https://github.com/your-username/repo-name

---

## 📝 Notes

- Real-time updates use WebSocket events:
  - `join_room`
  - `vote`
  - `room_update`
  - `ROLE`
- Session management uses `localStorage` per room.
- Fairness ensures one vote per client session with basic IP protection.
- Designed for demonstration and academic purposes.

---

## ✅ Conclusion

Real-Time Poll Rooms demonstrates a complete full-stack real-time system using the MERN stack and WebSockets. It combines:

- Real-time data synchronization
- Session-based fairness
- Database persistence
- Scalable room-based architecture

The project showcases practical implementation of modern web technologies for interactive, collaborative applications.
