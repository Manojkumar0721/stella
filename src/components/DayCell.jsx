import React from 'react';
import { FileText, CheckCircle2, Circle, Lock } from 'lucide-react';
import { isTodayDate, isDateInRange } from '../utils/dateUtils';

export default function DayCell({ dayData, startDate, endDate, onSelectDay }) {
  if (!dayData) {
    // Blank padding cell
    return (
      <div className="min-h-[105px] sm:min-h-[115px] bg-[#131314]/30 rounded-2xl p-2.5 opacity-20 select-none"></div>
    );
  }

  const { dayNumber, dateStr } = dayData;
  const isToday = isTodayDate(dateStr);
  const isInRange = isDateInRange(dateStr, startDate, endDate);

  const topics = dayData.topics || [];
  const updates = dayData.updates || [];

  const totalTopics = topics.length;
  const completedTopics = topics.filter(t => t.completed).length;
  const percentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const isAllComplete = totalTopics > 0 && completedTopics === totalTopics;
  const hasUpdates = updates.length > 0;

  // Disabled / Out of Range Cell
  if (!isInRange) {
    return (
      <div
        className="min-h-[105px] sm:min-h-[115px] rounded-2xl p-2.5 bg-[#131314]/40 border border-neutral-800/20 opacity-25 cursor-not-allowed select-none flex flex-col justify-between"
        title={`Date is outside active challenge range (${startDate} to ${endDate})`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500 w-7 h-7 flex items-center justify-center">
            {dayNumber}
          </span>
          <Lock className="w-3.5 h-3.5 text-gray-600" />
        </div>
        <div className="text-[10px] text-gray-600 italic text-center py-2">
          Out of Range
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelectDay(dateStr)}
      className={`group relative min-h-[105px] sm:min-h-[115px] rounded-2xl p-2.5 transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
        isToday
          ? 'bg-[#282a2c] border-blue-500/60 ring-1 ring-blue-500/40 shadow-sm'
          : isAllComplete
          ? 'bg-[#1e1f20] border-emerald-500/30 hover:bg-[#282a2c]'
          : totalTopics > 0
          ? 'bg-[#1e1f20] border-neutral-800/60 hover:bg-[#282a2c] hover:border-neutral-700/60'
          : 'bg-[#1e1f20]/60 border-neutral-800/40 hover:bg-[#282a2c]/80 hover:border-neutral-700/40'
      }`}
    >
      {/* Header of Cell: Day Number & Status Badges */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-semibold w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
            isToday
              ? 'bg-blue-500 text-white font-bold shadow-sm'
              : 'text-gray-200 group-hover:text-white'
          }`}>
            {dayNumber}
          </span>
          {isToday && (
            <span className="text-[10px] font-medium text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
              Today
            </span>
          )}
        </div>

        {/* Daily updates count pill */}
        {hasUpdates && (
          <div
            title={`${updates.length} daily update note(s)`}
            className="flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full"
          >
            <FileText className="w-3 h-3 text-amber-400" />
            <span>{updates.length}</span>
          </div>
        )}
      </div>

      {/* Main Cell Body: Mini progress indicator & topic previews */}
      <div className="mt-2 flex-1 flex flex-col justify-end space-y-1.5">
        {totalTopics > 0 ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-medium">
              <span className={`flex items-center gap-1 ${isAllComplete ? 'text-emerald-400' : 'text-gray-300'}`}>
                {isAllComplete ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 inline-block" />
                ) : (
                  <Circle className="w-3 h-3 text-blue-400 inline-block" />
                )}
                {completedTopics}/{totalTopics}
              </span>
              <span className="text-[10px] text-gray-400">
                {percentage}%
              </span>
            </div>

            {/* Sleek Minimal Progress Line */}
            <div className="w-full h-1 bg-[#131314] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isAllComplete
                    ? 'bg-emerald-400'
                    : percentage >= 50
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    : 'bg-amber-400'
                }`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>

            {/* Topic preview items */}
            <div className="hidden sm:block space-y-0.5 pt-1">
              {topics.slice(0, 2).map(t => (
                <div
                  key={t.id}
                  className="truncate text-[10px] text-gray-400 group-hover:text-gray-300 flex items-center gap-1"
                >
                  <span className={`w-1 h-1 rounded-full flex-shrink-0 ${t.completed ? 'bg-emerald-400' : 'bg-blue-400'}`}></span>
                  <span className={`truncate ${t.completed ? 'line-through opacity-50' : ''}`}>
                    {t.title}
                  </span>
                </div>
              ))}
              {topics.length > 2 && (
                <div className="text-[9px] text-gray-500 italic pl-2">
                  +{topics.length - 2} more
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-gray-400 group-hover:text-blue-400 flex items-center gap-1">
              + Add
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
