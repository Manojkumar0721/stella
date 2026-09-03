import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react';
import { getMonthGridDays, WEEKDAYS } from '../utils/dateUtils';

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function SingleDatePickerPopover({
  selectedDate,
  onSelectDate,
  onClose,
  title = "Select Date",
  minDate = null
}) {
  const initialObj = selectedDate ? new Date(selectedDate) : new Date();
  const [viewYear, setViewYear] = useState(initialObj.getFullYear() || 2026);
  const [viewMonth, setViewMonth] = useState(initialObj.getMonth() || 0);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const dayGrid = getMonthGridDays(viewYear, viewMonth);

  return (
    <div className="mt-2.5 w-full bg-[#131314] border border-neutral-800 rounded-2xl p-3 sm:p-4 shadow-inner space-y-3 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-200">
          <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
          <span>{title}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-[#282a2c]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Month Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1.5 text-gray-400 hover:text-white bg-[#1e1f20] hover:bg-[#282a2c] rounded-full border border-neutral-800 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="text-xs font-extrabold text-white tracking-wide">
          <span>{MONTH_NAMES[viewMonth]} </span>
          <span className="text-blue-400 font-mono">{viewYear}</span>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 text-gray-400 hover:text-white bg-[#1e1f20] hover:bg-[#282a2c] rounded-full border border-neutral-800 transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-gray-400 uppercase border-b border-neutral-800/60 pb-1">
        {WEEKDAYS.map((w, idx) => (
          <div key={w} className={idx === 0 || idx === 6 ? 'text-rose-400/80' : 'text-gray-400'}>
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1 text-xs">
        {dayGrid.map((item, idx) => {
          if (!item) return <div key={`emp-${idx}`} className="h-7 sm:h-8"></div>;

          const { dayNumber, dateStr } = item;
          const isSelected = dateStr === selectedDate;
          const isDisabled = minDate && dateStr < minDate;

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                onSelectDate(dateStr);
                onClose();
              }}
              className={`h-7 sm:h-8 font-bold rounded-xl transition-all flex items-center justify-center text-xs ${
                isSelected
                  ? 'bg-blue-600 text-white font-extrabold shadow-md shadow-blue-500/30 ring-1 ring-blue-400 scale-105'
                  : isDisabled
                  ? 'text-gray-600 opacity-40 cursor-not-allowed'
                  : 'bg-[#1e1f20] hover:bg-[#282a2c] text-gray-200 hover:text-white border border-neutral-800/40'
              }`}
            >
              {dayNumber}
            </button>
          );
        })}
      </div>

      {/* Native date picker option */}
      <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <span className="text-[10px] text-gray-400 font-medium">Or pick date directly:</span>
        <input
          type="date"
          value={selectedDate || ''}
          min={minDate || undefined}
          onChange={(e) => {
            if (e.target.value) {
              onSelectDate(e.target.value);
              onClose();
            }
          }}
          className="bg-[#1e1f20] border border-neutral-700/60 text-gray-200 text-xs rounded-xl px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer font-mono"
        />
      </div>
    </div>
  );
}
