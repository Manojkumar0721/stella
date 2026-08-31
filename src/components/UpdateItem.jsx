import React, { useState } from 'react';
import { Clock, Trash2, Edit2, Check, X, FileText } from 'lucide-react';

export default function UpdateItem({ update, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(update.text);

  const formatTime = (isoString) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "";
    }
  };

  const handleSave = () => {
    if (editText.trim() && editText.trim() !== update.text) {
      onUpdate(update.id, editText.trim());
    } else {
      setEditText(update.text);
    }
    setIsEditing(false);
  };

  return (
    <div className="group bg-[#131314] border border-neutral-800/60 hover:border-neutral-700/60 rounded-2xl p-4 space-y-2 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
          <FileText className="w-3.5 h-3.5" />
          <span>Daily Note</span>
          {update.timestamp && (
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3 ml-1 text-gray-500" />
              {formatTime(update.timestamp)}
            </span>
          )}
          {update.editedAt && (
            <span className="text-[10px] text-gray-500 italic">(edited)</span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded-full transition-colors"
                title="Save update"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setEditText(update.text);
                  setIsEditing(false);
                }}
                className="p-1 text-gray-400 hover:bg-[#282a2c] rounded-full transition-colors"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-400 hover:text-blue-400 hover:bg-[#282a2c] rounded-full transition-colors"
                title="Edit note"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(update.id)}
                className="p-1 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors"
                title="Delete note"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          rows={2}
          className="w-full bg-[#1e1f20] border border-amber-500/60 rounded-xl p-3 text-sm text-gray-100 focus:outline-none"
        />
      ) : (
        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap pl-2 border-l-2 border-amber-500/40">
          {update.text}
        </p>
      )}
    </div>
  );
}
