'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { sendChatCommand } from '@/lib/operator-api';
import { useAgentContext } from '@/lib/agent-context';

interface ChatMessage {
  id: string;
  role: 'user' | 'system';
  text: string;
  badge?: 'ACTION';
  affectedWallet?: string;
}

const SUGGESTIONS = ['list agents', 'top trusted', 'show blocked'];

let msgCounter = 0;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { dispatch } = useAgentContext();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSubmit = useCallback(async (command: string) => {
    if (!command.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${++msgCounter}`,
      role: 'user',
      text: command.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const result = await sendChatCommand(command.trim());
      const sysMsg: ChatMessage = {
        id: `msg-${++msgCounter}`,
        role: 'system',
        text: result.response,
        badge: result.badge,
        affectedWallet: result.affectedWallet,
      };
      setMessages((prev) => [...prev, sysMsg]);

      if (result.affectedWallet) {
        dispatch({ type: 'HIGHLIGHT_WALLET', wallet: result.affectedWallet });
        setTimeout(() => dispatch({ type: 'HIGHLIGHT_WALLET', wallet: null }), 3000);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `msg-${++msgCounter}`, role: 'system', text: 'Error: command failed' },
      ]);
    }
    setLoading(false);
  }, [dispatch]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center text-xl transition-transform hover:scale-105 z-50"
      >
        💬
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 w-full h-[100dvh] sm:bottom-6 sm:right-6 sm:w-96 sm:h-[480px] sm:rounded-xl bg-surface-2 border border-border rounded-none shadow-2xl flex flex-col z-50 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-white">Command Center</h3>
        <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300 text-lg">✕</button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-xs text-gray-600 text-center py-8">
            Type a command below or click a suggestion
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap
                ${msg.role === 'user'
                  ? 'bg-blue-600/30 text-blue-100'
                  : 'bg-surface-3 text-gray-200'
                }
              `}
            >
              {msg.badge && (
                <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded mr-2 mb-1">
                  {msg.badge}
                </span>
              )}
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface-3 rounded-lg px-3 py-2 text-sm text-gray-500 animate-pulse">
              Processing...
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div className="px-4 py-2 flex gap-2 flex-wrap">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => handleSubmit(s)}
            className="px-2.5 py-1 text-[11px] bg-surface-3 text-gray-400 hover:text-gray-200 hover:bg-surface-3/80 rounded-full transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(input);
        }}
        className="px-4 py-3 border-t border-border flex gap-2"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a command... (try 'list agents' or 'top trusted')"
          className="flex-1 bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm rounded-lg transition-colors"
        >
          ↵
        </button>
      </form>
    </div>
  );
}
