"use client";

import { useState, useEffect } from "react";

interface JoinRoomFormProps {
  roomId: string;
  onJoin: (username: string) => void;
  isLoading: boolean;
}

export default function JoinRoomForm({
  roomId,
  onJoin,
  isLoading,
}: JoinRoomFormProps) {
  const [username, setUsername] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onJoin(username.trim());
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
          <span className="text-5xl" role="img" aria-label="join-icon">
            🚪
          </span>
          <h1 className="text-4xl font-extrabold text-gray-800 mt-2">
            Join Room
          </h1>
          <p className="text-gray-500 mt-2">
            Enter your name to join room {roomId}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 text-lg text-gray-800 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-300 transition"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!username.trim() || isLoading}
            className="w-full py-4 text-lg font-bold text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
          >
            {isLoading ? "Joining Room..." : "Join Room"}
          </button>
        </form>
      </div>
    </main>
  );
}
