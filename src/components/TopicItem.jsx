import React, { useState, useEffect, useRef } from 'react';
import { Check, Trash2, Edit2, X, CheckSquare, Square } from 'lucide-react';

export default function TopicItem({ topic, onToggle, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(topic.title);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editText.trim() && editText.trim() !== topic.title) {
      onUpdate(topic.id, editText.trim());
    } else {
      setEditText(topic.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditText(topic.title);
      setIsEditing(false);
    }
  };

  return (
    <div className={`group flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all duration-200 ${
      topic.completed
        ? 'bg-[#131314]/50 border-neutral-800/40 text-gray-500'
        : 'bg-[#131314] border-neutral-800/70 hover:border-neutral-700 text-gray-100 shadow-sm'
    }`}>
      {/* Checkbox and Text */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={() => onToggle(topic.id)}
          className={`flex-shrink-0 transition-transform active:scale-95 p-0.5 rounded-lg focus:outline-none ${
            topic.completed ? 'text-emerald-400' : 'text-gray-400 hover:text-blue-400'
          }`}
          title={topic.completed ? "Mark as incomplete" : "Mark as completed"}
        >
          {topic.completed ? (
            <CheckSquare className="w-5 h-5 text-emerald-400" />
          ) : (
            <Square className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="flex-1 bg-[#131314] border border-blue-500 rounded-full px-3.5 py-1 text-sm text-gray-100 focus:outline-none"
          />
        ) : (
          <span
            onClick={() => onToggle(topic.id)}
            className={`text-sm select-none cursor-pointer truncate transition-colors ${
              topic.completed ? 'line-through text-gray-500 font-normal' : 'text-gray-200 font-medium'
            }`}
          >
            {topic.title}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-full transition-colors"
              title="Save"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setEditText(topic.title);
                setIsEditing(false);
              }}
              className="p-1.5 text-gray-400 hover:bg-[#282a2c] rounded-full transition-colors"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-[#282a2c] rounded-full transition-colors"
              title="Edit topic"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(topic.id)}
              className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors"
              title="Delete topic"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
