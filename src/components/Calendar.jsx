import React from 'react';
import { WEEKDAYS, getMonthGridDays } from '../utils/dateUtils';
import DayCell from './DayCell';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export default function Calendar({
  months,
  currentMonthIndex,
  setCurrentMonthIndex,
  startDate,
  endDate,
  getDayData,
  onSelectDay
}) {
  if (!months || months.length === 0) {
    return (
      <div className="bg-[#1e1f20] border border-neutral-800/50 rounded-3xl p-8 text-center text-gray-400">
        No valid months found for selected challenge range.
      </div>
    );
  }

  const safeMonthIndex = Math.min(Math.max(0, currentMonthIndex), months.length - 1);
  const currentMonthInfo = months[safeMonthIndex];
  const gridDays = getMonthGridDays(currentMonthInfo.year, currentMonthInfo.month);

  const handlePrevMonth = () => {
    if (safeMonthIndex > 0) {
      setCurrentMonthIndex(safeMonthIndex - 1);
    }
  };

  const handleNextMonth = () => {
    if (safeMonthIndex < months.length - 1) {
      setCurrentMonthIndex(safeMonthIndex + 1);
    }
  };

  return (
    <div className="bg-[#1e1f20] border border-neutral-800/40 rounded-3xl p-4 sm:p-6 shadow-md space-y-6">
      {/* Calendar Header with Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-neutral-800/50 pb-4">
        {/* Month Selector Tabs */}
        <div className="flex items-center bg-[#131314] p-1.5 rounded-full border border-neutral-800/60 w-full sm:w-auto overflow-x-auto max-w-full">
          {months.map((m, idx) => (
            <button
              key={`${m.year}-${m.month}`}
              onClick={() => setCurrentMonthIndex(idx)}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                safeMonthIndex === idx
                  ? 'bg-[#282a2c] text-white shadow-sm font-semibold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#282a2c]/50'
              }`}
            >
              {m.shortName} <span className="font-normal text-gray-400">{m.year}</span>
            </button>
          ))}
        </div>

        {/* Month Title & Prev/Next Arrows */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={handlePrevMonth}
            disabled={safeMonthIndex === 0}
            className={`p-2 rounded-full border transition-all duration-200 ${
              safeMonthIndex > 0
                ? 'bg-[#282a2c] border-neutral-700/40 text-gray-200 hover:bg-[#333537] hover:text-white'
                : 'bg-[#131314] border-neutral-800/40 text-gray-600 cursor-not-allowed opacity-30'
            }`}
            title="Previous Month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-lg sm:text-xl font-bold text-gray-100 tracking-tight">
            <CalendarIcon className="w-5 h-5 text-blue-400" />
            <span>{currentMonthInfo.name}</span>
          </div>

          <button
            onClick={handleNextMonth}
            disabled={safeMonthIndex === months.length - 1}
            className={`p-2 rounded-full border transition-all duration-200 ${
              safeMonthIndex < months.length - 1
                ? 'bg-[#282a2c] border-neutral-700/40 text-gray-200 hover:bg-[#333537] hover:text-white'
                : 'bg-[#131314] border-neutral-800/40 text-gray-600 cursor-not-allowed opacity-30'
            }`}
            title="Next Month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Weekday Grid Header */}
      <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center">
        {WEEKDAYS.map((day, idx) => (
          <div
            key={day}
            className={`py-2 text-xs font-semibold uppercase tracking-wider rounded-xl ${
              idx === 0 || idx === 6 ? 'text-blue-400/80 bg-blue-500/5' : 'text-gray-400 bg-[#131314]/40'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {gridDays.map((gridItem, index) => {
          if (!gridItem) {
            return <DayCell key={`blank-${index}`} dayData={null} />;
          }

          const dayData = getDayData(gridItem.dateStr);

          return (
            <DayCell
              key={gridItem.dateStr}
              dayData={{
                ...gridItem,
                topics: dayData.topics,
                updates: dayData.updates
              }}
              startDate={startDate}
              endDate={endDate}
              onSelectDay={onSelectDay}
            />
          );
        })}
      </div>
    </div>
  );
}
