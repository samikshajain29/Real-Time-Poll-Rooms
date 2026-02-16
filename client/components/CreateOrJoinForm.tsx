"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/context/WebSocketContext";

export default function CreateOrJoinForm() {
  const [username] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const { isConnected, sendMessage, userId } = useSocket();
  const router = useRouter();

  const handleJoinRoom = () => {
    if (!roomCode.trim()) return;

    if (isConnected) {
      const existingSession = localStorage.getItem(`poll_username_${roomCode}`);

      if (existingSession) {
        router.push(`/room/${roomCode}`);
        return;
      }

      if (username.trim()) {
        localStorage.setItem(`poll_username_${roomCode}`, username.trim());
      }

      sendMessage({
        type: "join_room",
        payload: { username, roomId: roomCode, userId },
      });

      router.push(`/room/${roomCode}`);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg">
      <div className="text-center mb-8">
        <span className="text-5xl" role="img" aria-label="battle-icon">
          📊
        </span>
        <h1 className="text-4xl font-extrabold text-gray-800 mt-2">
          Real-Time Poll Rooms
        </h1>
        <p className="text-gray-500 mt-2">
          Create or join a poll room instantly.
        </p>
      </div>

      <div className="space-y-6">
        <button
          onClick={() => router.push("/create-poll")}
          className="w-full py-4 text-lg font-bold text-white bg-linear-to-r from-purple-500 to-indigo-600 rounded-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer"
        >
          Create New Poll Room
        </button>

        <div className="relative flex items-center">
          <div className="grow border-t border-gray-300"></div>
          <span className="shrink mx-4 text-gray-400">OR</span>
          <div className="grow border-t border-gray-300"></div>
        </div>

        <div className="flex space-x-3">
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="Room Code"
            className="w-full px-4 py-3 text-lg text-gray-800 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-300 transition"
          />
          <button
            onClick={handleJoinRoom}
            disabled={!isConnected || !roomCode.trim()}
            className="w-full py-4 text-lg font-bold text-white bg-linear-to-r from-teal-500 to-cyan-600 rounded-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:transform-none disabled:shadow-none cursor-pointer"
          >
            Join Room
          </button>
        </div>
      </div>
      <p
        className={`text-center mt-6 text-sm font-semibold ${isConnected ? "text-green-600" : "text-red-500"}`}
      >
        {isConnected ? "● Connected" : "● Connecting..."}
      </p>
    </div>
  );
}
