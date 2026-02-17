# 📊 Real-Time Poll Rooms

## Overview

**Real-Time Poll Rooms** is a full stack web application designed to enable users to develop polls, distribute them through a specific link, and gather votes with instant results for all participants. The platform guarantees real-time synchronization, equitable voting, and consistent data retention even when users log out or refresh the page.

Users have the ability to:
- Formulate a poll by specifying a question and defining several response choices.
- Share the poll using a unique URL.
- Access any poll by entering the provided link and submit their vote.
- Observe ongoing updates as other votes are received.
- Avoid duplicate voting from the same user by employing session-based restrictions.

This project was built using :-

- **MongoDB**
- **Next.js**
- **Node.js**

Real-time communication is handled using **WebSockets (ws)**.

---

## 📑 Table of Contents

- Features
- Technology Stack
- Usage
- Fairness / Anti-Abuse Mechanisms
- Persistence
- Edge Cases Handled
- Known Limitations / Future Improvements
- Deployment

---

## 🚀 Features

### 1️⃣ Poll Creation

- Users have the ability to set up polls by providing a question along with a minimum of two response choices.
- Once a poll is set up, a distinct and shareable link is automatically created for distribution.

### 2️⃣ Join by Link

- Anyone who has the link can access the poll and cast their vote.
- Each participant is allowed to vote only once with a single choice.

### 3️⃣ Real-Time Results

- Results are updated in real-time for all users who are connected, with the use of WebSockets.
- There is no requirement to refresh the webpage to see the latest changes.

### 4️⃣ Fairness / Anti-Abuse

- Session-based identity ensures that each participant is allowed to cast only one vote during each session.
- The application ensures vote integrity by integrating IP-based tracking with browser session validation.
-  Any attempt to vote more than once, including those made through incognito, multiple tabs or private browsing sessions, is automatically prevented.

### 5️⃣ Persistence

- Polls and votes are kept in MongoDB.
- Refreshing the page does not delete the poll or vote information.

---

## 🛠️ Technology Stack

| Layer | Technology |
|--------|------------|
| Frontend | Next.js |
| Backend | Node.js |
| Database | MongoDB, Mongoose |
| Real-Time | WebSockets (ws) |
| Deployment | Vercel , Render |

---

### Explanation
 
- The **Client** is responsible for rendering the user interface and maintaining the WebSocket connection.
- The **Server** handles several key functions, including:
  - Creating rooms
  - Validating votes
  - Broadcasting live updates to participants
  - Ensuring fairness throughout the process
- The **Database** is used to store:
  - Poll information
  - Recorded votes
  - Data related to each participant's session.

---

## ▶️ Usage

1. Open the Home Page.
2. Click on the 'Create Poll' button.
3. Input the question along with the available choices.
4. Obtain the poll link that is generated.
5. Distribute the link.
6. Individuals who wish to participate join the poll using the provided link.
7. Participants are required to enter their name.
8. Each participant then selects their preferred option by casting a vote.
9. The vote counts are displayed in real-time for all participants.

---

## 🔒 Fairness / Anti-Abuse Mechanisms

### 1️⃣ One Vote per User (Session-Based Voting)

- Each participant is uniquely identified through a `clientId` that is saved in `localStorage`.
- A user is allowed to cast only one vote for each poll.
- Refreshing the page does not affect the user's eligibility to vote.
- The vote is linked to the specific session in which it was cast.

### 2️⃣ IP Check

- The server records the IP addresses of participants.
- This helps prevent multiple votes from the same network by the same person.
- Using incognito, multiple tabs or private browsing mode does not allow users to bypass these restrictions.
- If another voting session from the same IP address occurs: 
  - Only one vote is allowed per session for each poll.

---

### ⚠️ Limitations

- Restrictions may be bypassed using:
  - Multiple devices
  - VPN or IP-masking tools
- The system is designed for academic/demo purposes and is not intended for enterprise-grade security.

---

## 💾 Persistence

- All polls and votes are saved in MongoDB.
- Refreshing the page restores the following:
  - The current state of the poll
  - The total number of votes
  - The participant's session
- Storage of usernames specific to each room ensures that no duplicate usernames appear after the page is reloaded.
---

## 🧩 Edge Cases Handled

- Prevent unauthorized individuals from initiating polls.
- Ensure that the poll state is preserved even if the creator disconnects or reconnects.
- Allow multiple rooms to function separately without causing data conflicts.
- Prevent duplicate votes from the same session.

---

## 🚧 Known Limitations / Future Improvements

- The system's ability to detect the same user across multiple devices is restricted.
- It has not been tested for handling large numbers of simultaneous users.
- Enhancements to prevent abuse could include implementing CAPTCHA, using OAuth authentication, and introducing rate limiting.
- User interface improvements could involve better mobile responsiveness, real-time animations, and more effective visual representations of voting data.

---

## Local Setup and Installation ⚙️

1.  *Prerequisites*: Node.js and npm installed.
2.  *Clone the repository*:
  ```bash
   git clone https://github.com/samikshajain29/Real-Time-Poll-Rooms
   ```

3.  *Install Backend Dependencies*:
    ```bash
    cd server
    npm install
    ```
    
4.  *Install Frontend Dependencies*:
    ```bash
    cd client
    npm install
    ```
    
5.  *Run the Backend Server*:
    #### From the /server directory
    
    ```bash
    node src/index.js
    ```
    
    #### The server will be running on http://localhost:8000
    
7.  *Run the Frontend Application*:
    #### From the /client directory
    
    ```bash
    npm run dev
    ```
    
    #### The application will be running on http://localhost:3000

### 🌍 Deployment

- **Public URL:** https://real-time-poll-rooms-iota.vercel.app/
- **GitHub Repository:** https://github.com/samikshajain29/Real-Time-Poll-Rooms

---

## 📝 Notes

- Real-time updates are facilitated through WebSocket events, which include:
  - `join_room`
  - `vote`
  - `room_update`
  - `ROLE`
- Session management is handled using `localStorage` for each room.
- The system ensures fairness by allowing only one vote per client session, with basic IP protection in place.
-  This system is intended for demonstration and academic use.

---

## ✅ Conclusion

- Real-Time Poll Rooms presents a fully functional real-time system. It integrates several key features including:
  - Synchronized real-time data updates
  - Fairness based on session management
  - Persistent data storage in a database
  - A scalable architecture organized around rooms

- This project illustrates the practical application of contemporary web technologies, enabling the development of interactive and collaborative web applications.
