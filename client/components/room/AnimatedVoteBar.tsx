"use client";

import { motion } from "framer-motion";

interface AnimatedVoteBarProps {
  label: string;
  voteCount: number;
  totalVotes: number;
  color: string;
}

export default function AnimatedVoteBar({
  label,
  voteCount,
  totalVotes,
  color,
}: AnimatedVoteBarProps) {
  const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="font-semibold text-lg text-gray-800">{label}</span>
        <span className="font-bold text-xl text-gray-800">{voteCount}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
        <motion.div
          className="h-8 rounded-full flex items-center justify-end pr-3"
          style={{ backgroundColor: color }}
          initial={{ width: "0%" }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <span className="text-white font-bold text-sm">
            {percentage.toFixed(0)}%
          </span>
        </motion.div>
      </div>
    </div>
  );
}
