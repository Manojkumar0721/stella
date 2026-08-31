import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, ListTodo, FileText, Sparkles, Send } from 'lucide-react';
import { formatDisplayDate, getAdjacentDates } from '../utils/dateUtils';
import ProgressBar from './ProgressBar';
import TopicItem from './TopicItem';
import UpdateItem from './UpdateItem';
import confetti from 'canvas-confetti';

export default function DailyModal({
  dateStr,
  dayData,
  startDate,
  endDate,
  onClose,
  onSelectDate,
  onAddTopic,
  onUpdateTopic,
  onToggleTopic,
  onDeleteTopic,
  onAddUpdate,
  onUpdateUpdate,
  onDeleteUpdate
}) {
  const [newTopicText, setNewTopicText] = useState('');
  const [newUpdateText, setNewUpdateText] = useState('');
  const [activeTab, setActiveTab] = useState('topics'); // 'topics' | 'updates'

  const formattedDate = formatDisplayDate(dateStr);
  const { prev: prevDate, next: nextDate } = getAdjacentDates(dateStr, startDate, endDate);

  const topics = dayData.topics || [];
  const updates = dayData.updates || [];

  const totalTopics = topics.length;
  const completedTopics = topics.filter(t => t.completed).length;

  // Trigger celebratory confetti when 100% complete
  useEffect(() => {
    if (totalTopics > 0 && completedTopics === totalTopics) {
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore if confetti fails
      }
    }
  }, [completedTopics, totalTopics]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCreateTopic = (e) => {
    e.preventDefault();
    if (newTopicText.trim()) {
      onAddTopic(dateStr, newTopicText);
      setNewTopicText('');
    }
  };

  const handleCreateUpdate = (e) => {
    e.preventDefault();
    if (newUpdateText.trim()) {
      onAddUpdate(dateStr, newUpdateText);
      setNewUpdateText('');
    }
  };

  const QUICK_NOTE_PROMPTS = [
    "🚀 Completed all main tasks planned for today!",
    "💡 Spent extra time debugging state management logic.",
    "⚠️ Encountered blockers, scheduled follow-up for tomorrow.",
    "📝 Great momentum today, hit key milestone."
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in overflow-y-auto">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose}></div>

      {/* Modal Container (Gemini Dark Theme) */}
      <div className="relative w-full max-w-2xl bg-[#1e1f20] border border-neutral-800/80 rounded-3xl shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#1e1f20] border-b border-neutral-800/60 p-4 sm:p-5 flex items-center justify-between sticky top-0 z-20 backdrop-blur">
          <div className="flex items-center gap-2">
            <button
              onClick={() => prevDate && onSelectDate(prevDate)}
              disabled={!prevDate}
              className={`p-2 rounded-full border transition-all duration-200 ${
                prevDate
                  ? 'bg-[#282a2c] border-neutral-700/40 text-gray-200 hover:bg-[#333537] hover:text-white'
                  : 'bg-[#131314] border-neutral-800/40 text-gray-600 cursor-not-allowed opacity-30'
              }`}
              title={prevDate ? "Previous Day" : "Reached Start of Challenge"}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => nextDate && onSelectDate(nextDate)}
              disabled={!nextDate}
              className={`p-2 rounded-full border transition-all duration-200 ${
                nextDate
                  ? 'bg-[#282a2c] border-neutral-700/40 text-gray-200 hover:bg-[#333537] hover:text-white'
                  : 'bg-[#131314] border-neutral-800/40 text-gray-600 cursor-not-allowed opacity-30'
              }`}
              title={nextDate ? "Next Day" : "Reached End of Challenge"}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="ml-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-100 tracking-tight">
                {formattedDate}
              </h2>
              <p className="text-xs text-gray-400">
                Daily Task Planner & Reflection Log
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#282a2c] rounded-full transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Visual Progress Bar */}
          <div className="bg-[#131314] p-4 rounded-2xl border border-neutral-800/60 shadow-sm">
            <ProgressBar total={totalTopics} completed={completedTopics} size="lg" />
          </div>

          {/* Gemini Pill Nav Tabs */}
          <div className="flex bg-[#131314] p-1 rounded-full border border-neutral-800/60 text-xs font-medium">
            <button
              onClick={() => setActiveTab('topics')}
              className={`flex-1 py-2 rounded-full flex items-center justify-center gap-2 transition-all duration-200 ${
                activeTab === 'topics'
                  ? 'bg-[#282a2c] text-white font-semibold shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <ListTodo className="w-4 h-4 text-blue-400" />
              <span>Tasks ({totalTopics})</span>
            </button>

            <button
              onClick={() => setActiveTab('updates')}
              className={`flex-1 py-2 rounded-full flex items-center justify-center gap-2 transition-all duration-200 ${
                activeTab === 'updates'
                  ? 'bg-[#282a2c] text-white font-semibold shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Daily Notes ({updates.length})</span>
            </button>
          </div>

          {/* Tab 1: Tasks (Gemini Chat Input Style) */}
          {activeTab === 'topics' && (
            <div className="space-y-4">
              {/* Gemini Chat Style Input Form */}
              <form onSubmit={handleCreateTopic} className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Ask or add a new task for this day..."
                  value={newTopicText}
                  onChange={(e) => setNewTopicText(e.target.value)}
                  className="w-full bg-[#131314] border border-neutral-800/80 rounded-full pl-5 pr-28 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={!newTopicText.trim()}
                  className="absolute right-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-full text-xs transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Task</span>
                </button>
              </form>

              {/* Tasks Items List */}
              <div className="space-y-2 pt-1">
                {topics.length > 0 ? (
                  topics.map(topic => (
                    <TopicItem
                      key={topic.id}
                      topic={topic}
                      onToggle={(id) => onToggleTopic(dateStr, id)}
                      onUpdate={(id, text) => onUpdateTopic(dateStr, id, text)}
                      onDelete={(id) => onDeleteTopic(dateStr, id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-10 bg-[#131314]/40 rounded-2xl border border-dashed border-neutral-800 p-6 space-y-2">
                    <ListTodo className="w-8 h-8 text-gray-600 mx-auto" />
                    <p className="text-sm font-medium text-gray-300">No tasks added for this day yet</p>
                    <p className="text-xs text-gray-500">
                      Use the input box above to add your goals or topics for {formattedDate}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Daily Updates & Reflections */}
          {activeTab === 'updates' && (
            <div className="space-y-4">
              <form onSubmit={handleCreateUpdate} className="space-y-3">
                <div className="relative">
                  <textarea
                    rows={3}
                    placeholder="Write a reflection or progress update for this date..."
                    value={newUpdateText}
                    onChange={(e) => setNewUpdateText(e.target.value)}
                    className="w-full bg-[#131314] border border-neutral-800/80 rounded-2xl p-4 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  />
                  <button
                    type="submit"
                    disabled={!newUpdateText.trim()}
                    className="absolute bottom-3 right-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-4 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Note</span>
                  </button>
                </div>

                {/* Quick Prompts */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-gray-500 font-medium mr-1">Quick ideas:</span>
                  {QUICK_NOTE_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewUpdateText(prompt)}
                      className="bg-[#131314] hover:bg-[#282a2c] text-gray-300 border border-neutral-800 rounded-full px-3 py-1 text-[11px] transition-colors truncate max-w-[200px]"
                      title={prompt}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </form>

              {/* Updates List */}
              <div className="space-y-3 pt-1">
                {updates.length > 0 ? (
                  updates.map(update => (
                    <UpdateItem
                      key={update.id}
                      update={update}
                      onUpdate={(id, text) => onUpdateUpdate(dateStr, id, text)}
                      onDelete={(id) => onDeleteUpdate(dateStr, id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-10 bg-[#131314]/40 rounded-2xl border border-dashed border-neutral-800 p-6 space-y-2">
                    <FileText className="w-8 h-8 text-gray-600 mx-auto" />
                    <p className="text-sm font-medium text-gray-300">No daily notes posted yet</p>
                    <p className="text-xs text-gray-500">
                      Record notes or reflections on your progress for this date.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#1e1f20] border-t border-neutral-800/60 p-4 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Saved automatically</span>
          </div>
          <button
            onClick={onClose}
            className="bg-[#282a2c] hover:bg-[#333537] text-gray-200 px-5 py-2 rounded-full transition-colors font-medium text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
