import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';

export default function ProgressBar({ total, completed, showLabel = true, size = "md" }) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = total > 0 && completed === total;

  const heightClasses = {
    sm: "h-1.5",
    md: "h-3",
    lg: "h-4"
  };

  return (
    <div className="w-full space-y-2">
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-medium text-gray-300">
          <div className="flex items-center gap-1.5">
            {isComplete ? (
              <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> All tasks completed!
              </span>
            ) : (
              <span className="text-gray-400 font-normal">Progress Overview</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">{completed} of {total} completed</span>
            <span className="bg-[#282a2c] text-blue-400 border border-neutral-700/40 px-2.5 py-0.5 rounded-full text-xs font-medium">
              {percentage}%
            </span>
          </div>
        </div>
      )}

      {/* Gemini Gradient Bar container */}
      <div className="w-full bg-[#131314] rounded-full overflow-hidden border border-neutral-800 p-0.5 shadow-inner">
        <div
          className={`${heightClasses[size]} rounded-full transition-all duration-500 ease-out ${
            isComplete
              ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
              : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
