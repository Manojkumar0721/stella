import React, { useState } from 'react';
import { Calendar as CalendarIcon, Sparkles, Rocket, ArrowRight, Target, AlertCircle, ArrowLeft, CalendarDays } from 'lucide-react';

export default function ChallengeSetup({ onCreateChallenge, onCancel, hasExistingChallenges }) {
  const [challengeName, setChallengeName] = useState('New Custom Challenge');
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-11-30');
  const [errorMsg, setErrorMsg] = useState('');

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const diff = Math.abs(d2 - d1);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
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
      <div className="max-w-xl w-full bg-[#1e1f20] border border-neutral-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-7 relative">
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
            Define a title and date range for your challenge to track daily tasks in Stella.
          </p>
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

          {/* Simple & Minimal 2-Column Date Input Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-gray-300 font-semibold px-0.5">
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-blue-400" />
                <span>Challenge Dates</span>
              </span>
              <span className="text-blue-400 font-mono text-[11px]">
                Duration: <strong className="font-extrabold">{calculateDays()} Days</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Date Column */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Start Date</span>
                </label>
                
                <div className="relative flex items-center bg-[#131314] border border-neutral-800 hover:border-emerald-500/50 rounded-2xl p-3 transition-all focus-within:ring-1 focus-within:ring-emerald-500/50 shadow-sm">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        setStartDate(e.target.value);
                        if (endDate && endDate < e.target.value) {
                          setEndDate(e.target.value);
                        }
                        setErrorMsg('');
                      }
                    }}
                    className="w-full bg-transparent text-xs font-bold text-gray-100 font-mono focus:outline-none cursor-pointer color-scheme-dark"
                  />
                </div>
              </div>

              {/* End Date Column */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
                  <span>End Date</span>
                </label>

                <div className="relative flex items-center bg-[#131314] border border-neutral-800 hover:border-indigo-500/50 rounded-2xl p-3 transition-all focus-within:ring-1 focus-within:ring-indigo-500/50 shadow-sm">
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        setEndDate(e.target.value);
                        setErrorMsg('');
                      }
                    }}
                    className="w-full bg-transparent text-xs font-bold text-gray-100 font-mono focus:outline-none cursor-pointer color-scheme-dark"
                  />
                </div>
              </div>
            </div>
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
    </div>
  );
}
