require("dotenv").config();
const express = require("express");
const http = require("http");
const { WebSocketServer, WebSocket } = require("ws");
const { v4: uuidv4 } = require("uuid");
const roomManager = require("./services/roomManager");
const connectDB = require("./db/connection");

const PORT = process.env.PORT || 8000;
const HOST = "0.0.0.0";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.get("/", (req, res) => {
  res.send("Real-Time Poll app is healthy!");
});

//connect db
connectDB()
  .then(async () => {
    await roomManager.loadPollsFromDB();
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
  });

function broadcastRoomState(roomId) {
  const publicState = roomManager.getPublicRoomState(roomId);
  if (!publicState) return;

  const message = JSON.stringify({ type: "room_update", payload: publicState });

  wss.clients.forEach((client) => {
    if (client.roomId === roomId && client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (error) {
        console.error(
          `Failed to send message to client ${client.userId}:`,
          error,
        );
      }
    }
  });
}

function heartbeat() {
  this.isAlive = true;
}
const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) {
      console.log(`Terminating inactive client ${ws.userId}`);
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on("close", function close() {
  clearInterval(interval);
});

wss.on("connection", (ws, request) => {
  ws.request = request;
  const socketId = uuidv4();
  ws.userId = socketId;
  ws.isAlive = true;
  ws.on("pong", heartbeat);

  console.log(`Client ${socketId} connected`);

  ws.on("message", async (message) => {
    try {
      console.log("Received WebSocket message:", message.toString());
      const parsedMessage = JSON.parse(message);
      console.log(
        "Parsed message type:",
        parsedMessage.type,
        "payload:",
        parsedMessage.payload,
      );

      switch (parsedMessage.type) {
        case "create_room": {
          const { username, userId: clientUserId } = parsedMessage.payload;
          const participantId = clientUserId || socketId;

          const newRoom = await roomManager.createRoom(
            undefined,
            undefined,
            participantId,
            ws.userId,
          );

          roomManager.joinRoom(newRoom.id, participantId, username);
          ws.roomId = newRoom.id;
          ws.participantId = participantId;
          ws.isCreator = true;

          if (ws.readyState === WebSocket.OPEN) {
            console.log(`[DEBUG] Sending role to creator ${username}: creator`);
            ws.send(
              JSON.stringify({ type: "ROLE", payload: { role: "creator" } }),
            );

            ws.send(
              JSON.stringify({
                type: "room_created",
                payload: {
                  ...newRoom,
                  creatorToken: newRoom.creatorToken,
                },
              }),
            );
          }
          console.log(
            `User ${username} (Socket: ${ws.userId}, Claimed: ${participantId}) created and joined room ${newRoom.id}`,
          );

          const publicState = roomManager.getPublicRoomState(newRoom.id);
          const message = JSON.stringify({
            type: "room_update",
            payload: {
              ...publicState,
              users: Array.from(newRoom.users.values()),
            },
          });

          wss.clients.forEach((client) => {
            if (
              client.roomId === newRoom.id &&
              client.readyState === WebSocket.OPEN
            ) {
              client.send(message);
            }
          });
          break;
        }

        case "create_dynamic_room": {
          const {
            username,
            question,
            options,
            userId: clientUserId,
          } = parsedMessage.payload;
          const participantId = clientUserId || socketId;

          if (
            !question ||
            !options ||
            options.length < 2 ||
            options.some((opt) => !opt.trim())
          ) {
            console.log(`Invalid dynamic room request from ${participantId}`);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  payload: {
                    message:
                      "Invalid poll configuration. Question and at least 2 options required.",
                  },
                }),
              );
            }
            break;
          }
          const newRoom = await roomManager.createRoom(
            question,
            options,
            participantId,
            ws.userId,
          );

          roomManager.joinRoom(newRoom.id, participantId, username);
          ws.roomId = newRoom.id;
          ws.participantId = participantId;
          ws.isCreator = true;

          if (ws.readyState === WebSocket.OPEN) {
            console.log(`[DEBUG] Sending role to creator ${username}: creator`);
            ws.send(
              JSON.stringify({ type: "ROLE", payload: { role: "creator" } }),
            );

            ws.send(
              JSON.stringify({
                type: "room_created",
                payload: {
                  ...newRoom,
                  creatorToken: newRoom.creatorToken,
                },
              }),
            );
          }
          console.log(
            `User ${username} (Socket: ${ws.userId}, Claimed: ${participantId}) created dynamic room ${newRoom.id}`,
          );

          const publicState = roomManager.getPublicRoomState(newRoom.id);
          const message = JSON.stringify({
            type: "room_update",
            payload: {
              ...publicState,
              users: Array.from(newRoom.users.values()),
            },
          });

          wss.clients.forEach((client) => {
            if (
              client.roomId === newRoom.id &&
              client.readyState === WebSocket.OPEN
            ) {
              client.send(message);
            }
          });
          break;
        }

        case "join_room": {
          const {
            username,
            roomId,
            userId: clientUserId,
            creatorToken,
          } = parsedMessage.payload;
          const participantId = clientUserId || socketId;
          const joinedRoom = roomManager.joinRoom(
            roomId,
            participantId,
            username,
          );

          if (joinedRoom) {
            ws.roomId = roomId;
            ws.participantId = participantId;

            if (
              creatorToken &&
              roomManager.validateCreatorToken(roomId, creatorToken)
            ) {
              ws.isCreator = true;
              joinedRoom.creatorSocketId = ws.userId;
              console.log(
                `[SECURITY] Creator reconnected to room ${roomId} (Socket: ${ws.userId})`,
              );
            } else {
              ws.isCreator = false;
            }

            console.log(
              `User ${username} (${participantId}) joined room ${roomId}`,
            );

            if (ws.readyState === WebSocket.OPEN) {
              const role = ws.isCreator ? "creator" : "user";
              console.log(
                `[DEBUG] Sending role to client ${username}: ${role}`,
              );
              ws.send(JSON.stringify({ type: "ROLE", payload: { role } }));
            }
            const publicState = roomManager.getPublicRoomState(roomId);
            const payload = {
              ...publicState,
              users: Array.from(joinedRoom.users.values()),
              isCreator: ws.isCreator,
            };

            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "room_update", payload }));
            }
            broadcastRoomState(roomId);
          } else {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  payload: { message: "Room not found" },
                }),
              );
            }
          }
          break;
        }

        case "get_room_state": {
          const { roomId } = parsedMessage.payload;
          ws.roomId = roomId;
          const roomState = roomManager.getRoom(roomId);
          if (roomState) {
            if (ws.readyState === WebSocket.OPEN) {
              const role = ws.isCreator ? "creator" : "user";
              console.log(
                `[DEBUG] Sending role in get_room_state to client: ${role}`,
              );
              ws.send(JSON.stringify({ type: "ROLE", payload: { role } }));
            }

            const publicState = roomManager.getPublicRoomState(roomId);
            const payload = {
              ...publicState,
              users: Array.from(roomState.users.values()),
              isCreator: !!ws.isCreator,
            };
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "room_update", payload }));
            }
          }
          break;
        }

        case "vote": {
          const {
            roomId,
            option,
            userId: clientUserId,
          } = parsedMessage.payload;
          const participantId = clientUserId || ws.participantId;
          const room = roomManager.getRoom(roomId);

          if (room) {
            if (room.status === "active") {
              let ipAddress =
                ws.request.headers["x-forwarded-for"] ||
                ws.request.socket.remoteAddress;

              if (ipAddress && ipAddress.includes(",")) {
                ipAddress = ipAddress.split(",")[0].trim();
              }

              if (ipAddress && ipAddress.startsWith("::ffff:")) {
                ipAddress = ipAddress.replace("::ffff:", "");
              }

              roomManager.handleVote(roomId, participantId, option, ipAddress);
              broadcastRoomState(roomId);
            } else {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({
                    type: "error",
                    payload: {
                      message:
                        room.status === "waiting"
                          ? "Poll has not started yet. Waiting for creator to start."
                          : "Voting is closed. Poll has ended.",
                    },
                  }),
                );
              }
            }
          }
          break;
        }

        case "start_poll": {
          const { roomId, userId: clientUserId } = parsedMessage.payload;
          const room = roomManager.getRoom(roomId);

          if (room) {
            const requestingUserId = clientUserId || ws.participantId;

            console.log(`[DEBUG] start_poll attempt. Room: ${roomId}`);
            console.log(
              `[AUTH] Checking creator. Room Creator: ${room.creatorId}, Requesting User: ${requestingUserId}`,
            );
            if (
              !room.creatorId ||
              !requestingUserId ||
              room.creatorId.toString() !== requestingUserId.toString()
            ) {
              console.log(
                `[SECURITY] Unauthorized start_poll attempt by ${requestingUserId} for room ${roomId}`,
              );
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({
                    type: "error",
                    payload: {
                      message: "Only the room creator can start the poll.",
                    },
                  }),
                );
              }
              break;
            }
            if (room.status === "waiting") {
              room.status = "active";

              if (room.timerIntervalId) {
                clearInterval(room.timerIntervalId);
              }

              const timerId = setInterval(() => {
                const r = roomManager.getRoom(roomId);
                if (r && r.timer > 0) {
                  r.timer--;
                  broadcastRoomState(roomId);
                } else if (r) {
                  r.status = "closed";
                  broadcastRoomState(roomId);
                  clearInterval(timerId);
                  delete r.timerIntervalId;
                } else {
                  clearInterval(timerId);
                }
              }, 1000);

              room.timerIntervalId = timerId;
              broadcastRoomState(roomId);
            } else {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({
                    type: "error",
                    payload: {
                      message:
                        room.status === "active"
                          ? "Poll is already active."
                          : "Cannot start poll. Poll has already ended.",
                    },
                  }),
                );
              }
            }
          } else {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  payload: { message: "Room not found" },
                }),
              );
            }
          }
          break;
        }

        default:
          console.log(
            `Received unknown message type: ${parsedMessage.type} from ${userId}`,
          );
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  ws.on("close", () => {
    console.log(`Client ${ws.userId} disconnected`);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});
server.listen(PORT, HOST, () => {
  console.log(` Server is listening on port ${PORT}`);
});
