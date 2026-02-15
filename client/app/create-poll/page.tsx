"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/context/WebSocketContext";

export default function CreatePollPage() {
  const [username, setUsername] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [roomId, setRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { isConnected, sendMessage, lastMessage, userId } = useSocket();
  const router = useRouter();

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const validateForm = () => {
    if (!username.trim()) return false;
    if (!question.trim()) return false;
    if (options.length < 2) return false;
    if (options.some((opt) => !opt.trim())) return false;
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm() || !isConnected || isCreating) return;

    setIsCreating(true);

    const trimmedQuestion = question.trim();
    const trimmedOptions = options.map((opt) => opt.trim());

    sendMessage({
      type: "create_dynamic_room",
      payload: {
        username: username.trim(),
        question: trimmedQuestion,
        options: trimmedOptions,
        userId: userId,
      },
    });

    localStorage.setItem("poll_creator_username", username.trim());
  };

  const copyToClipboard = () => {
    if (roomId) {
      navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
    }
  };

  useEffect(() => {
    if (lastMessage) {
      try {
        const messageData = JSON.parse(lastMessage.data);
        console.log("Received WebSocket message:", messageData);

        if (messageData.type === "room_created") {
          const newRoomId = messageData.payload.id;
          setRoomId(newRoomId);
          setIsCreating(false);
        } else if (messageData.type === "error") {
          console.error("Error from server:", messageData.payload.message);
          setIsCreating(false);
          alert(`Error: ${messageData.payload.message}`);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    }
  }, [lastMessage]);

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
          <span className="text-5xl" role="img" aria-label="create-icon">
            📝
          </span>
          <h1 className="text-4xl font-extrabold text-gray-800 mt-2">
            Create New Poll
          </h1>
          <p className="text-gray-500 mt-2">
            Customize your poll question and options.
          </p>
        </div>

        {!roomId ? (
          <div className="space-y-6">
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
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Poll Question
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What's your poll question?"
                className="w-full px-4 py-3 text-lg text-gray-800 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-300 transition"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-lg font-semibold text-gray-700">
                  Poll Options
                </label>
                <span className="text-sm text-gray-500">
                  {options.length} of 6 options
                </span>
              </div>

              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 px-4 py-3 text-lg text-gray-800 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-300 transition"
                    />
                    {options.length > 2 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {options.length < 6 && (
                <button
                  onClick={addOption}
                  className="w-full mt-3 py-3 text-lg font-semibold text-purple-600 border-2 border-purple-500 rounded-lg hover:bg-purple-50 transition"
                >
                  + Add Option
                </button>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!validateForm() || !isConnected || isCreating}
              className="w-full py-4 text-lg font-bold text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
            >
              {isCreating ? "Creating Room..." : "Create Poll Room"}
            </button>

            <p
              className={`text-center text-sm font-semibold ${isConnected ? "text-green-600" : "text-red-500"}`}
            >
              {isConnected ? "● Connected" : "● Connecting..."}
            </p>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="p-6 bg-green-50 rounded-xl border-2 border-green-200">
              <span className="text-6xl mb-4 block">🎉</span>
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                Poll Room Created!
              </h2>
              <p className="text-green-700">
                Your poll room is ready to share.
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Share this link:
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/room/${roomId}`}
                  className="flex-1 px-4 py-3 text-gray-800 bg-white border-2 border-gray-300 rounded-lg"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => router.push(`/room/${roomId}`)}
                className="flex-1 py-4 text-lg font-bold text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Go to Poll Room
              </button>
              <button
                onClick={() => router.push("/")}
                className="flex-1 py-4 text-lg font-bold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
              >
                Create Another
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
