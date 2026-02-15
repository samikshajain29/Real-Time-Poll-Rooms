const mongoose = require("mongoose");

const pollSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  question: {
    type: String,
    required: true,
  },
  options: [
    {
      text: {
        type: String,
        required: true,
      },
      votes: {
        type: Number,
        default: 0,
      },
    },
  ],
  status: {
    type: String,
    enum: ["waiting", "active", "closed"],
    default: "waiting",
  },
  participants: [
    {
      userId: {
        type: String,
        required: true,
      },
      username: {
        type: String,
        required: true,
      },
      voted: {
        type: Boolean,
        default: false,
      },
    },
  ],
  creatorId: {
    type: String,
    required: true,
  },
  timer: {
    type: Number,
    default: 60,
  },
  voterIps: [
    {
      type: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Poll", pollSchema);
