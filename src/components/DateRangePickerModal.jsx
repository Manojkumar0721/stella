import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Check, Sparkles, Clock } from 'lucide-react';
import { formatDateString, getMonthGridDays, WEEKDAYS } from '../utils/dateUtils';

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function DateRangePickerModal({
  initialStartDate,
  initialEndDate,
  onSave,
  onClose
}) {
  const [startDate, setStartDate] = useState(initialStartDate || '2026-09-01');
  const [endDate, setEndDate] = useState(initialEndDate || '2026-11-30');
  const [hoveredDate, setHoveredDate] = useState(null);
  const [selectionStep, setSelectionStep] = useState('start'); // 'start' | 'end'

  // Current view month & year (default to start date or today)
  const initialDateObj = startDate ? new Date(startDate) : new Date();
  const [viewYear, setViewYear] = useState(initialDateObj.getFullYear() || 2026);
  const [viewMonth, setViewMonth] = useState(initialDateObj.getMonth() || 8); // 0-indexed

  // Navigation handlers
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

  // Day Cell Selection Logic
  const handleDayClick = (dateStr) => {
    if (!dateStr) return;

    if (selectionStep === 'start') {
      setStartDate(dateStr);
      setEndDate(dateStr); // reset end date initially
      setSelectionStep('end');
    } else {
      // Step === 'end'
      if (dateStr < startDate) {
        setStartDate(dateStr);
        setEndDate(startDate);
      } else {
        setEndDate(dateStr);
      }
      setSelectionStep('start');
    }
  };

  // Preset Handlers
  const applySepNov2026 = () => {
    setStartDate('2026-09-01');
    setEndDate('2026-11-30');
    setViewYear(2026);
    setViewMonth(8);
  };

  const apply30Days = () => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 30);
    const startStr = formatDateString(start.getFullYear(), start.getMonth(), start.getDate());
    const endStr = formatDateString(end.getFullYear(), end.getMonth(), end.getDate());
    setStartDate(startStr);
    setEndDate(endStr);
    setViewYear(start.getFullYear());
    setViewMonth(start.getMonth());
  };

  const apply60Days = () => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 60);
    const startStr = formatDateString(start.getFullYear(), start.getMonth(), start.getDate());
    const endStr = formatDateString(end.getFullYear(), end.getMonth(), end.getDate());
    setStartDate(startStr);
    setEndDate(endStr);
    setViewYear(start.getFullYear());
    setViewMonth(start.getMonth());
  };

  const applyCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    setStartDate(formatDateString(year, month, 1));
    setEndDate(formatDateString(year, month, lastDay));
    setViewYear(year);
    setViewMonth(month);
  };

  // Calculate Duration
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const diff = Math.abs(d2 - d1);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const dayGrid = getMonthGridDays(viewYear, viewMonth);
  const totalDays = calculateDays();

  // Helper to format date string for display
  const formatNice = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleApply = () => {
    let finalStart = startDate;
    let finalEnd = endDate;

    if (finalStart > finalEnd) {
      const temp = finalStart;
      finalStart = finalEnd;
      finalEnd = temp;
    }

    onSave(finalStart, finalEnd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in font-sans overflow-hidden">
      <div className="relative w-full max-w-lg bg-[#1e1f20] border border-neutral-800/90 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 max-h-[95vh] overflow-y-auto overflow-x-hidden [scrollbar-width:none] [ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        
        {/* Glow Effects */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Select Challenge Date Range</h2>
              <p className="text-xs text-gray-400">Click dates on the calendar to pick start and end dates</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white bg-[#131314] hover:bg-[#282a2c] rounded-full border border-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selection Status Banner */}
        <div className="bg-[#131314] border border-neutral-800/80 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-medium">Start:</span>
            <span className="font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full font-mono">
              {formatNice(startDate) || 'Select Start'}
            </span>
          </div>

          <span className="text-gray-600 hidden sm:inline">→</span>

          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-medium">End:</span>
            <span className="font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full font-mono">
              {formatNice(endDate) || 'Select End'}
            </span>
          </div>

          <div className="bg-[#282a2c] px-3 py-1 rounded-full text-gray-300 font-bold font-mono text-[11px] border border-neutral-700/50">
            {totalDays} Days
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mr-1">Presets:</span>
          <button
            type="button"
            onClick={applySepNov2026}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#131314] hover:bg-[#282a2c] text-gray-300 border border-neutral-800 transition-all"
          >
            Sep – Nov 2026
          </button>
          <button
            type="button"
            onClick={apply30Days}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#131314] hover:bg-[#282a2c] text-gray-300 border border-neutral-800 transition-all"
          >
            30 Days
          </button>
          <button
            type="button"
            onClick={apply60Days}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#131314] hover:bg-[#282a2c] text-gray-300 border border-neutral-800 transition-all"
          >
            60 Days
          </button>
          <button
            type="button"
            onClick={applyCurrentMonth}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#131314] hover:bg-[#282a2c] text-gray-300 border border-neutral-800 transition-all"
          >
            This Month
          </button>
        </div>

        {/* Calendar Grid Container */}
        <div className="bg-[#131314] border border-neutral-800 rounded-3xl p-4 space-y-3">
          
          {/* Calendar Month Navigation Header */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 text-gray-400 hover:text-white bg-[#1e1f20] hover:bg-[#282a2c] rounded-full transition-colors border border-neutral-800"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-sm font-extrabold text-white tracking-wider flex items-center gap-2">
              <span>{MONTH_NAMES[viewMonth]}</span>
              <span className="text-blue-400 font-mono">{viewYear}</span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 text-gray-400 hover:text-white bg-[#1e1f20] hover:bg-[#282a2c] rounded-full transition-colors border border-neutral-800"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-gray-400 uppercase tracking-wider py-1 border-b border-neutral-800/80">
            {WEEKDAYS.map((w, idx) => (
              <div key={w} className={idx === 0 || idx === 6 ? 'text-rose-400/80' : 'text-gray-400'}>
                {w}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-xs">
            {dayGrid.map((item, index) => {
              if (!item) {
                return <div key={`empty-${index}`} className="h-9 sm:h-10"></div>;
              }

              const { dayNumber, dateStr } = item;
              const isStart = dateStr === startDate;
              const isEnd = dateStr === endDate;
              const isSelectedEndpoint = isStart || isEnd;

              // Check if dateStr is inside range
              let isInRange = false;
              let isHoveredInRange = false;

              if (startDate && endDate) {
                const lower = startDate < endDate ? startDate : endDate;
                const upper = startDate < endDate ? endDate : startDate;
                isInRange = dateStr >= lower && dateStr <= upper;
              }

              if (selectionStep === 'end' && startDate && hoveredDate) {
                const lower = startDate < hoveredDate ? startDate : hoveredDate;
                const upper = startDate < hoveredDate ? hoveredDate : startDate;
                isHoveredInRange = dateStr >= lower && dateStr <= upper;
              }

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handleDayClick(dateStr)}
                  onMouseEnter={() => setHoveredDate(dateStr)}
                  onMouseLeave={() => setHoveredDate(null)}
                  className={`h-9 sm:h-10 rounded-2xl font-bold transition-all flex items-center justify-center relative active:scale-95 ${
                    isSelectedEndpoint
                      ? 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 z-10 scale-105 ring-2 ring-blue-400/80'
                      : isInRange
                      ? 'bg-blue-600/20 text-blue-200 border-y border-blue-500/30 font-extrabold'
                      : isHoveredInRange
                      ? 'bg-indigo-600/20 text-indigo-200 border-y border-indigo-500/30 font-semibold'
                      : 'bg-[#1e1f20] hover:bg-[#282a2c] text-gray-200 hover:text-white border border-neutral-800/40'
                  }`}
                >
                  <span>{dayNumber}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-full text-xs font-semibold bg-[#131314] hover:bg-[#282a2c] text-gray-300 border border-neutral-800 transition-all"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-3 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <Check className="w-4 h-4 text-white" />
            <span>Apply Date Range</span>
          </button>
        </div>
      </div>
    </div>
  );
}
