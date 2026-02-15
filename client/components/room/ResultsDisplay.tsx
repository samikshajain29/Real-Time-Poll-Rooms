"use client";

import { useState, useEffect } from "react";
import AnimatedVoteBar from "./AnimatedVoteBar";

interface ResultsDisplayProps {
  question: string;
  roomId: string;
  votes: Record<string, number>;
  options: string[];
  sendMessage: (message: object) => void;
  status: "waiting" | "active" | "closed";
  currentUser?: string;
}

export default function ResultsDisplay({
  question,
  roomId,
  votes,
  options,
  sendMessage,
  status,
  currentUser,
}: ResultsDisplayProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const totalVotes = Object.values(votes).reduce(
    (sum, count) => sum + count,
    0,
  );

  useEffect(() => {
    const votedInRoom = localStorage.getItem(`voted_${roomId}`);
    if (votedInRoom) {
      setHasVoted(true);
    }
  }, [roomId]);

  const handleVote = (option: string) => {
    if (hasVoted || status !== "active" || !currentUser) return;

    sendMessage({
      type: "vote",
      payload: { roomId, option, userId: localStorage.getItem("poll_user_id") },
    });

    localStorage.setItem(`voted_${roomId}`, "true");
    setHasVoted(true);
  };

  const defaultColors = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
  ];
  const optionKeys = Object.keys(votes);

  return (
    <div className="w-full max-w-lg">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
        {question}
      </h2>
      <div className="space-y-6">
        {optionKeys.map((optionKey, index) => {
          const optionLabel =
            options?.[index] || optionKey.replace("option", "");
          const color = defaultColors[index % defaultColors.length];

          return (
            <div
              key={optionKey}
              onClick={() => handleVote(optionKey)}
              className={`p-2 border-2 rounded-lg transition-all ${!hasVoted && status === "active" && currentUser ? "cursor-pointer border-transparent hover:border-blue-500" : "cursor-not-allowed"}`}
            >
              <AnimatedVoteBar
                label={optionLabel}
                voteCount={votes[optionKey]}
                totalVotes={totalVotes}
                color={color}
              />
            </div>
          );
        })}
      </div>
      {hasVoted && (
        <p className="text-center mt-6 text-lg text-green-600 font-semibold">
          Thanks for voting!
        </p>
      )}
      {status === "closed" && (
        <p className="text-center mt-6 text-lg text-red-600 font-semibold">
          Voting has ended.
        </p>
      )}
      {status === "waiting" && (
        <p className="text-center mt-6 text-lg text-yellow-600 font-semibold">
          Waiting for creator to start poll...
        </p>
      )}
    </div>
  );
}
