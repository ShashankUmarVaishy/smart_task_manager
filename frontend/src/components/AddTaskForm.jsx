// src/components/AddTaskForm.jsx
// =============================================
// Form to create a new task. Accepts a title and
// optional deadline, then calls the parent callback.

import { useState } from 'react';
import api from '../utils/api';

export default function AddTaskForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('mid');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Task title cannot be empty');
    setError('');
    setLoading(true);

    try {
      await onAdd({ title: title.trim(), deadline, priority });
      setTitle('');
      setDeadline('');
      setPriority('mid');
    } catch {
      setError('Could not add task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── AI Voice Parsing ───────────────────────────
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support the Web Speech API. Please try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError('');
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setTitle(transcript); // Show what was heard
      await parseAndAddTask(transcript);
    };

    recognition.onerror = (event) => {
      setError('Voice error: ' + event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const parseAndAddTask = async (transcript) => {
    try {
      setLoading(true);
      const localTime = new Date().toISOString();
      const { data } = await api.post('/tasks/ai-parse', { text: transcript, localTime });

      await onAdd(data);
      setTitle('');
      setDeadline('');
      setPriority('mid');
    } catch (err) {
      console.log('AI parsing error: ' + err);
      setError(err.response?.data?.message || 'Failed to parse AI task.');
    } finally {
      setLoading(false);
    }
  };

  // Helpers for smart dates
  const getOffsetDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const todayStr = getOffsetDate(0);

  return (
    <div className="bg-white border-2 border-ink p-6 shadow-[4px_4px_0px_0px_#1a1612] mb-8">

      <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">
        — New Task
      </h2>

      {error && (
        <p className="text-red-600 text-sm font-medium mb-3">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        {/* Top Row: Task Title Input */}
        <div>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={isListening ? "Listening to your voice..." : "What needs to be done?"}
            className={`field w-full text-lg py-3 ${isListening ? 'border-amber-500 bg-amber-50 placeholder:text-amber-500' : ''}`}
            disabled={isListening}
          />
        </div>

        {/* Bottom Row: Controls & Submit */}
        <div className="flex flex-col lg:flex-row gap-3 lg:items-start">
          
          {/* Deadline date picker with smart buttons */}
          <div className="flex flex-col gap-1 flex-1 lg:max-w-[180px]">
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              min={todayStr}
              className="field w-full text-stone-600"
              title="Optional deadline"
            />
            <div className="flex gap-1 justify-between mt-1">
              <button type="button" onClick={() => setDeadline(getOffsetDate(0))} className="flex-1 text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-500 py-1 hover:bg-stone-200 transition-colors">Today</button>
              <button type="button" onClick={() => setDeadline(getOffsetDate(1))} className="flex-1 text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-500 py-1 hover:bg-stone-200 transition-colors">Tmrw</button>
              <button type="button" onClick={() => setDeadline(getOffsetDate(7))} className="flex-1 text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-500 py-1 hover:bg-stone-200 transition-colors">+1W</button>
            </div>
          </div>

          {/* Priority selector */}
          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            className="field flex-1 lg:max-w-[120px] text-stone-600 bg-white cursor-pointer"
            title="Task priority"
          >
            <option value="mid">Mid</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto ml-auto">
            {/* Speak to Add Task Button */}
            <button
              type="button"
              onClick={startListening}
              className={`flex items-center justify-center gap-2 px-5 py-2 font-bold tracking-wider uppercase text-xs transition-all border-2 border-ink ${
                isListening 
                  ? 'bg-amber-100 text-amber-700 animate-pulse shadow-none translate-y-[2px] translate-x-[2px]' 
                  : 'bg-stone-100 text-stone-600 hover:bg-white hover:text-ink shadow-[3px_3px_0px_0px_#1a1612] hover:shadow-[5px_5px_0px_0px_#1a1612] hover:-translate-y-0.5'
              }`}
              title="Speak Task (AI)"
            >
              <span className="text-lg">🎙️</span>
              {isListening ? 'Listening...' : 'Speak to add Task'}
            </button>

            {/* Standard Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn whitespace-nowrap"
            >
              {loading ? 'Adding…' : '+ Add Task'}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
