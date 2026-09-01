import React, { useState } from 'react';
import { Calendar as CalendarIcon, Sparkles, Rocket, ArrowRight, Target, AlertCircle, ArrowLeft, CalendarDays } from 'lucide-react';
import { formatDateString } from '../utils/dateUtils';
import DateRangePickerModal from './DateRangePickerModal';

export default function ChallengeSetup({ onCreateChallenge, onCancel, hasExistingChallenges }) {
  const [challengeName, setChallengeName] = useState('September – November 2026 Challenge');
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-11-30');
  const [errorMsg, setErrorMsg] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Preset handlers
  const setPresetSepNov2026 = () => {
    setChallengeName('September – November 2026 Challenge');
    setStartDate('2026-09-01');
    setEndDate('2026-11-30');
    setErrorMsg('');
  };

  const setPreset30Days = () => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 30);
    setChallengeName('30-Day Sprint');
    setStartDate(formatDateString(start.getFullYear(), start.getMonth(), start.getDate()));
    setEndDate(formatDateString(end.getFullYear(), end.getMonth(), end.getDate()));
    setErrorMsg('');
  };

  const setPreset60Days = () => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 60);
    setChallengeName('60-Day Goal Tracker');
    setStartDate(formatDateString(start.getFullYear(), start.getMonth(), start.getDate()));
    setEndDate(formatDateString(end.getFullYear(), end.getMonth(), end.getDate()));
    setErrorMsg('');
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const diff = Math.abs(d2 - d1);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const formatNiceDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setErrorMsg('Please select both a start date and an end date.');
      return;
    }

    if (startDate > endDate) {
      setErrorMsg('Start date cannot be after end date.');
      return;
    }

    const diffDays = calculateDays();

    if (diffDays > 366) {
      setErrorMsg('Challenge duration cannot exceed 1 year (366 days).');
      return;
    }

    setErrorMsg('');
    onCreateChallenge({
      name: challengeName.trim() || 'Custom Challenge',
      startDate,
      endDate
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-xl w-full bg-[#1e1f20] border border-neutral-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-7 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Back Button if existing challenges exist */}
        {hasExistingChallenges && onCancel && (
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium bg-[#131314] border border-neutral-800 px-3.5 py-1.5 rounded-full"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Active Challenge</span>
          </button>
        )}

        {/* Top Header */}
        <div className="space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 bg-[#282a2c] border border-neutral-700/40 px-3.5 py-1 rounded-full text-blue-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Stella Setup</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight flex items-center justify-center sm:justify-start gap-2.5">
            <Target className="w-7 h-7 text-blue-400" />
            <span>Create New Challenge</span>
          </h1>

          <p className="text-sm text-gray-400 leading-relaxed">
            Define a date range and title for your challenge to track daily tasks in Stella.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Quick Presets
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={setPresetSepNov2026}
              className={`p-3.5 rounded-2xl border text-xs font-medium transition-all text-left flex flex-col justify-between ${
                startDate === '2026-09-01' && endDate === '2026-11-30'
                  ? 'bg-[#282a2c] border-blue-500/60 text-white ring-1 ring-blue-500/40'
                  : 'bg-[#131314] border-neutral-800 text-gray-300 hover:bg-[#282a2c]/60'
              }`}
            >
              <span className="font-bold text-gray-100">Sep – Nov 2026</span>
              <span className="text-[11px] text-gray-400 mt-1">90-Day Quarter</span>
            </button>

            <button
              type="button"
              onClick={setPreset30Days}
              className={`p-3.5 rounded-2xl border text-xs font-medium transition-all text-left flex flex-col justify-between ${
                challengeName === '30-Day Sprint'
                  ? 'bg-[#282a2c] border-blue-500/60 text-white ring-1 ring-blue-500/40'
                  : 'bg-[#131314] border-neutral-800 text-gray-300 hover:bg-[#282a2c]/60'
              }`}
            >
              <span className="font-bold text-gray-100">30-Day Sprint</span>
              <span className="text-[11px] text-gray-400 mt-1">1 Month Goal</span>
            </button>

            <button
              type="button"
              onClick={setPreset60Days}
              className={`p-3.5 rounded-2xl border text-xs font-medium transition-all text-left flex flex-col justify-between ${
                challengeName === '60-Day Goal Tracker'
                  ? 'bg-[#282a2c] border-blue-500/60 text-white ring-1 ring-blue-500/40'
                  : 'bg-[#131314] border-neutral-800 text-gray-300 hover:bg-[#282a2c]/60'
              }`}
            >
              <span className="font-bold text-gray-100">60-Day Tracker</span>
              <span className="text-[11px] text-gray-400 mt-1">2 Month Habit</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <span>Challenge Title</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Q4 Engineering Sprint"
              value={challengeName}
              onChange={(e) => setChallengeName(e.target.value)}
              className="w-full bg-[#131314] border border-neutral-800 rounded-full px-5 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
          </div>

          {/* Interactive Date Range Calendar Trigger Button */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-blue-400" />
                <span>Challenge Date Range</span>
              </span>
              <span className="text-[11px] text-blue-400 font-medium">Click to change</span>
            </label>

            <button
              type="button"
              onClick={() => setShowDatePicker(true)}
              className="w-full bg-[#131314] hover:bg-[#282a2c] border border-neutral-800 hover:border-blue-500/40 rounded-3xl p-4 transition-all text-left flex items-center justify-between group shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <CalendarDays className="w-5 h-5" />
                </div>

                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-gray-100 flex items-center gap-2">
                    <span>{formatNiceDate(startDate)}</span>
                    <span className="text-gray-500 font-normal">to</span>
                    <span>{formatNiceDate(endDate)}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    Duration: <span className="text-blue-400 font-semibold">{calculateDays()} Days</span>
                  </p>
                </div>
              </div>

              <span className="bg-[#1e1f20] group-hover:bg-blue-600 group-hover:text-white text-gray-300 text-xs px-3.5 py-1.5 rounded-full border border-neutral-700/60 transition-all font-semibold shrink-0">
                Open Calendar
              </span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {hasExistingChallenges && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-[#282a2c] hover:bg-[#333537] text-gray-300 font-semibold py-3.5 px-4 rounded-full transition-all text-xs"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 px-6 rounded-full transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group active:scale-[0.99] text-xs"
            >
              <Rocket className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
              <span>Launch Challenge</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </form>
      </div>

      {/* Date Range Picker Calendar Popup Modal */}
      {showDatePicker && (
        <DateRangePickerModal
          initialStartDate={startDate}
          initialEndDate={endDate}
          onSave={(newStart, newEnd) => {
            setStartDate(newStart);
            setEndDate(newEnd);
            setErrorMsg('');
          }}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </div>
  );
}
