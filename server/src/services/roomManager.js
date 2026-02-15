const rooms = new Map();
let Poll;
try {
  Poll = require("../models/Poll");
} catch (error) {
  console.warn(
    "Poll model not available, running in memory-only mode:",
    error.message,
  );
  Poll = null;
}
const { v4: uuidv4 } = require("uuid");

/**
 * @param {string} [question] - The poll question
 * @param {string[]} [options] - Array of poll options
 * @param {string} creatorId - The ID of the user creating the room
 * @returns {object} The newly created room object.
 */
async function createRoom(question, options, creatorId, creatorSocketId) {
  const roomId = generateRoomId();

  const safeQuestion =
    question && question.trim() ? question.trim() : "Cats vs Dogs";
  let safeOptions =
    options && Array.isArray(options) ? options : ["Cats", "Dogs"];

  // Filter out empty options and ensure at least 2 options
  safeOptions = safeOptions.filter((opt) => opt && opt.trim()).slice(0, 6); // Max 6 options
  if (safeOptions.length < 2) {
    safeOptions = ["Cats", "Dogs"]; // Fallback to default
  }

  // Create votes object dynamically based on options
  const votes = {};
  safeOptions.forEach((_, index) => {
    votes[`option${String.fromCharCode(65 + index)}`] = 0;
  });

  const room = {
    id: roomId,
    creatorId: creatorId,
    users: new Map(),
    votes: votes,
    question: safeQuestion,
    options: safeOptions,
    timer: 60,
    status: "waiting",
    timerIntervalId: null,
    creatorSocketId: creatorSocketId,
    creatorToken: uuidv4(),
    voterIps: new Set(),
  };
  rooms.set(roomId, room);

  if (Poll) {
    try {
      const pollDoc = new Poll({
        roomId: roomId,
        question: safeQuestion,
        options: safeOptions.map((opt) => ({ text: opt, votes: 0 })),
        voterIps: [],
        status: "waiting",
        participants: [],
        creatorId: creatorId,
        timer: 60,
      });
      await pollDoc.save();
      console.log(`Poll saved to database: ${roomId}`);
    } catch (error) {
      console.error("Error saving poll to database:", error);
    }
  }

  return room;
}

/**
 * @param {string} roomId The ID of the room.
 * @returns {object|undefined} The room object or undefined if not found.
 */
function getRoom(roomId) {
  return rooms.get(roomId);
}

/**
 * Loads all active polls from MongoDB into memory.
 * @returns {Promise<void>}
 */
async function loadPollsFromDB() {
  if (!Poll) {
    console.log("Database not available, skipping poll loading");
    return;
  }

  try {
    const polls = await Poll.find({});
    for (const poll of polls) {
      // Skip polls that are closed and older than 1 day
      if (
        poll.status === "closed" &&
        Date.now() - poll.createdAt.getTime() > 86400000
      ) {
        continue;
      }
      const votes = {};
      poll.options.forEach((option, index) => {
        votes[`option${String.fromCharCode(65 + index)}`] = option.votes;
      });

      const room = {
        id: poll.roomId,
        creatorId: poll.creatorId,
        users: new Map(),
        votes: votes,
        question: poll.question,
        options: poll.options.map((opt) => opt.text),
        timer: poll.timer,
        status: poll.status,
        timerIntervalId: null,
        voterIps: new Set(),
      };

      if (poll.participants && Array.isArray(poll.participants)) {
        poll.participants.forEach((p) => {
          room.users.set(p.userId, {
            username: p.username,
            voted: p.voted || false,
          });
        });
      }

      rooms.set(poll.roomId, room);
      if (poll.voterIps && Array.isArray(poll.voterIps)) {
        poll.voterIps.forEach((ip) => room.voterIps.add(ip));
      }
    }
    console.log(`Loaded ${polls.length} polls from database`);
  } catch (error) {
    console.error("Error loading polls from database:", error);
  }
}
/**
 * Updates a poll in MongoDB.
 * @param {string} roomId - The ID of the room to update.
 * @returns {Promise<void>}
 */
async function updatePollInDB(roomId) {
  if (!Poll) return;
  try {
    const room = getRoom(roomId);
    if (!room) return;

    await Poll.findOneAndUpdate(
      { roomId: roomId },
      {
        question: room.question,
        options: room.options.map((opt, index) => ({
          text: opt,
          votes: room.votes[`option${String.fromCharCode(65 + index)}`],
        })),
        status: room.status,
        timer: room.timer,
        voterIps: Array.from(room.voterIps),
      },
      { upsert: true },
    );
  } catch (error) {
    console.error("Error updating poll in database:", error);
  }
}
/**
 * Updates participants in MongoDB.
 * @param {string} roomId - The ID of the room to update.
 * @param {Array} participants - The participants to update.
 * @returns {Promise<void>}
 */
async function updateParticipantsInDB(roomId, participants) {
  if (!Poll) return;
  try {
    await Poll.updateOne(
      { roomId: roomId },
      { $set: { participants: participants } },
    );
  } catch (error) {
    console.error("Error updating participants in database:", error);
  }
}
/**
 * Adds a user to a specific room.
 * @param {string} roomId The ID of the room to join.
 * @param {string} userId A unique ID for the user's WebSocket connection.
 * @param {string} username The user's name.
 * @returns {object|null} The room object if joined successfully, otherwise null.
 */
function joinRoom(roomId, userId, username) {
  const room = getRoom(roomId);
  if (!room) return null;
  let existingEntry = null;

  for (const [id, user] of room.users.entries()) {
    if (user.username === username) {
      existingEntry = { id, user };
      break;
    }
  }

  if (existingEntry) {
    room.users.delete(existingEntry.id);
    room.users.set(userId, existingEntry.user);
  } else {
    room.users.set(userId, {
      username,
      voted: false,
    });
  }

  updateParticipantsInDB(
    roomId,
    Array.from(room.users.entries()).map(([id, u]) => ({
      userId: id,
      username: u.username,
      voted: u.voted || false,
    })),
  );

  return room;
}

/**
 * Handles a vote from a user for a specific option.
 * @param {string} roomId
 * @param {string} userId
 * @param {string} option
 * @param {string} ipAddress
 */
function handleVote(roomId, userId, option, ipAddress) {
  const room = getRoom(roomId);
  if (!room) return;

  if (ipAddress && room.voterIps.has(ipAddress)) {
    console.log(
      `SERVER: Rejected duplicate vote from IP ${ipAddress} in room ${roomId}`,
    );
    return;
  }

  const user = room.users.get(userId);
  if (user && !user.voted) {
    if (room.votes.hasOwnProperty(option)) {
      console.log(
        `SERVER: Vote received for ${option}. Old votes:`,
        room.votes,
      );
      room.votes[option]++;
      user.voted = true;
      if (ipAddress) {
        room.voterIps.add(ipAddress);
      }
      console.log(`SERVER: Vote recorded. New votes:`, room.votes);
      updatePollInDB(roomId);

      updateParticipantsInDB(
        roomId,
        Array.from(room.users.entries()).map(([id, u]) => ({
          userId: id,
          username: u.username,
          voted: u.voted,
        })),
      );
    }
  }
}

/**
 * Generates a random 5-character ID for a room.
 * @returns {string}
 */
function generateRoomId() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

/**
 * @param {string} roomId
 * @param {string} token
 * @returns {boolean}
 */
function validateCreatorToken(roomId, token) {
  const room = rooms.get(roomId);
  return room && room.creatorToken === token;
}

/**
 * @param {string} roomId
 * @returns {object}
 */
function getPublicRoomState(roomId) {
  const room = rooms.get(roomId);
  if (!room) return null;

  const { creatorToken, timerIntervalId, users, ...publicState } = room;
  return {
    ...publicState,
    users: Array.from(users.values()),
  };
}

module.exports = {
  createRoom,
  getRoom,
  joinRoom,
  handleVote,
  loadPollsFromDB,
  updatePollInDB,
  updateParticipantsInDB,
  validateCreatorToken,
  getPublicRoomState,
};
