"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSocket } from "@/context/WebSocketContext";
import UserList from "@/components/room/UserList";
import ResultsDisplay from "@/components/room/ResultsDisplay";
import JoinRoomForm from "@/components/room/JoinRoomForm";

interface RoomState {
  id: string;
  question: string;
  users: { username: string }[];
  votes: Record<string, number>;
  options?: string[];
  timer: number;
  status: "waiting" | "active" | "closed";
  isCreator?: boolean;
  creatorId: string;
}
interface RoomUser {
  username: string;
}

interface RoleState {
  role: "creator" | "user" | null;
}

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { lastMessage, isConnected, sendMessage, userId } = useSocket();
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [role, setRole] = useState<RoleState>({ role: null });

  useEffect(() => {
    if (isConnected && roomId && !username) {
      const storedUsername = localStorage.getItem(`poll_username_${roomId}`);
      if (storedUsername) {
        console.log("Auto-joining with stored username:", storedUsername);
        handleJoin(storedUsername);
      } else {
        const creatorUsername = localStorage.getItem("poll_creator_username");
        if (creatorUsername) {
          console.log("Auto-joining as creator:", creatorUsername);
          handleJoin(creatorUsername);
        }
      }
    }
  }, [isConnected, roomId, username]);
  useEffect(() => {
    if (roomState && username) {
      const userExists = roomState.users.some(
        (user) => user.username === username,
      );
      if (userExists) {
        setHasJoined(true);
      }
    }
  }, [roomState, username]);

  const handleJoin = (enteredUsername: string) => {
    if (!isConnected) return;

    setJoining(true);
    setUsername(enteredUsername);

    localStorage.setItem(`poll_username_${roomId}`, enteredUsername);
    if (!localStorage.getItem("poll_creator_username")) {
      localStorage.setItem("poll_creator_username", enteredUsername);
    }

    const creatorToken = localStorage.getItem(`poll_creator_token_${roomId}`);
    console.log(
      "Joining room with username:",
      enteredUsername,
      "creatorToken:",
      creatorToken,
    );
    sendMessage({
      type: "join_room",
      payload: {
        username: enteredUsername,
        userId: userId,
        roomId: roomId,
        creatorToken: creatorToken,
      },
    });
  };

  useEffect(() => {
    if (lastMessage) {
      const messageData = JSON.parse(lastMessage.data);

      if (messageData.type === "ROLE") {
        const newRole = messageData.payload.role;
        setRole({ role: newRole });
        console.log("role received:", newRole);

        setRoomState((prev) =>
          prev ? { ...prev, isCreator: newRole === "creator" } : null,
        );
      }

      if (messageData.type === "room_created") {
        if (messageData.payload.creatorToken) {
          localStorage.setItem(
            `poll_creator_token_${messageData.payload.id}`,
            messageData.payload.creatorToken,
          );
          setRoomState((prev) =>
            prev ? { ...prev, isCreator: true } : messageData.payload,
          );
          console.log("role received:", "creator");
        }
      }

      if (
        messageData.type === "room_update" &&
        messageData.payload.id === roomId
      ) {
        setRoomState(messageData.payload);

        console.log(
          "role received:",
          messageData.payload.isCreator ? "creator" : "user",
        );

        if (
          username &&
          messageData.payload.users.some(
            (user: RoomUser) => user.username === username,
          )
        ) {
          setHasJoined(true);
          setJoining(false);
        }
      } else if (messageData.type === "error") {
        console.error("Server error:", messageData.payload.message);
        setJoining(false);
      }
    }
  }, [lastMessage, roomId, username]);
  useEffect(() => {
    if (isConnected && roomId && username && hasJoined) {
      sendMessage({ type: "get_room_state", payload: { roomId } });
    }
  }, [isConnected, roomId, username, hasJoined, sendMessage]);

  if (!username || !hasJoined) {
    return (
      <JoinRoomForm roomId={roomId} onJoin={handleJoin} isLoading={joining} />
    );
  }
  if (!roomState) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Joining Room...</h2>
          <p className="text-gray-500">Please wait a moment.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="grid grid-cols-1 md:grid-cols-3 min-h-screen gap-8 p-8">
      {/* Main Poll Area */}
      <div className="md:col-span-2 flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-lg">
        <ResultsDisplay
          question={roomState.question}
          roomId={roomState.id}
          sendMessage={sendMessage}
          votes={roomState.votes}
          options={roomState.options || []}
          status={roomState.status}
          currentUser={username || undefined}
        />
      </div>

      {/* Sidebar */}
      <aside className="w-full flex flex-col gap-8">
        <div className="p-6 bg-white rounded-2xl shadow-lg text-center">
          <h3 className="text-lg font-semibold text-gray-500 mb-1">
            Time Remaining
          </h3>
          {roomState.status === "waiting" ? (
            <p className="text-4xl font-bold text-yellow-500">
              Waiting to start...
            </p>
          ) : (
            <p
              className={`text-7xl font-bold ${roomState.timer <= 10 ? "text-red-500" : "text-gray-800"}`}
            >
              {roomState.timer}
            </p>
          )}
        </div>

        {/* Add Start Poll button for creators */}
        {roomState.status === "waiting" &&
          roomState.creatorId &&
          userId &&
          roomState.creatorId === userId && (
            <div className="p-6 bg-white rounded-2xl shadow-lg text-center">
              <button
                onClick={() => {
                  sendMessage({
                    type: "start_poll",
                    payload: { roomId: roomState.id, userId },
                  });
                }}
                className="w-full py-4 text-lg font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Start Poll
              </button>
              <p className="mt-3 text-sm text-gray-500">
                Click to start the poll for all participants
              </p>
            </div>
          )}

        <div className="p-6 bg-white rounded-2xl shadow-lg flex-grow">
          <UserList users={roomState.users} />
        </div>
        <div className="p-4 bg-white rounded-2xl shadow-lg text-center">
          <p className="text-sm text-gray-500">Room Code</p>
          <p className="text-2xl font-mono tracking-widest text-purple-600">
            {roomState.id.toUpperCase()}
          </p>
        </div>
      </aside>
    </main>
  );
}
