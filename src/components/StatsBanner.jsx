import React from 'react';
import { Target, CheckCircle2, Calendar, FileText, Sparkles } from 'lucide-react';

export default function StatsBanner({ stats, challengeConfig }) {
  const { totalTopics, completedTopics, completionRate, totalUpdates, activeDaysCount, totalDaysInRange } = stats;

  return (
    <div className="bg-[#1e1f20] border border-neutral-800/60 rounded-3xl p-5 sm:p-6 shadow-md space-y-5">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/50 pb-4">
        <div>
          <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>{challengeConfig?.name || "Challenge Overview"}</span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time aggregate performance metrics ({challengeConfig?.startDate} to {challengeConfig?.endDate})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Completion:</span>
          <span className="bg-[#282a2c] text-blue-400 border border-neutral-700/50 px-3 py-1 rounded-full text-xs font-semibold">
            {completionRate}% Completed
          </span>
        </div>
      </div>

      {/* Main Overall Progress Bar */}
      <div className="w-full bg-[#131314] rounded-full h-3 p-0.5 border border-neutral-800 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
          style={{ width: `${completionRate}%` }}
        ></div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        {/* Total Topics */}
        <div className="bg-[#131314] border border-neutral-800/40 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-[#282a2c] text-blue-400 border border-neutral-700/40 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-100">{totalTopics}</div>
            <div className="text-xs text-gray-400 font-medium">Total Tasks</div>
          </div>
        </div>

        {/* Completed Topics */}
        <div className="bg-[#131314] border border-neutral-800/40 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-[#282a2c] text-emerald-400 border border-neutral-700/40 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-100">{completedTopics}</div>
            <div className="text-xs text-gray-400 font-medium">Completed ({completionRate}%)</div>
          </div>
        </div>

        {/* Active Days */}
        <div className="bg-[#131314] border border-neutral-800/40 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-[#282a2c] text-purple-400 border border-neutral-700/40 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-100">
              {activeDaysCount} <span className="text-xs font-normal text-gray-500">/ {totalDaysInRange}d</span>
            </div>
            <div className="text-xs text-gray-400 font-medium">Active Days</div>
          </div>
        </div>

        {/* Daily Updates */}
        <div className="bg-[#131314] border border-neutral-800/40 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-[#282a2c] text-amber-400 border border-neutral-700/40 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-100">{totalUpdates}</div>
            <div className="text-xs text-gray-400 font-medium">Daily Notes</div>
          </div>
        </div>
      </div>
    </div>
  );
}
