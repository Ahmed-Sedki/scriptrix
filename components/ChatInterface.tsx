import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, Sparkles, MessageSquare } from 'lucide-react';
import { LoadingSpinner } from './ui/Loading';
import { Logo } from './ui/Logo';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
}

const QUICK_PROMPTS = [
  "Improve this paragraph",
  "Make it more academic",
  "Check grammar",
  "Expand this idea"
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {messages.length === 0 && (
          <div className="text-center text-slate-300 mt-20">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
               <Logo className="w-10 h-10 text-slate-300" />
            </div>
            <p className="font-serif italic text-slate-500">Ask Scriptrix for scholarly assistance.</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] p-4 rounded-lg text-sm leading-relaxed shadow-sm font-serif ${
                msg.role === 'user'
                  ? 'bg-academic-navy text-white rounded-br-none'
                  : 'bg-academic-paper-dark text-slate-800 border border-slate-200 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-academic-paper-dark p-4 rounded-lg rounded-bl-none border border-slate-200 shadow-sm flex items-center space-x-3">
                <div className="w-2 h-2 bg-academic-gold rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-academic-gold rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-academic-gold rounded-full animate-bounce delay-200"></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="p-3 bg-white border-t border-slate-100 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="flex space-x-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onSendMessage(prompt)}
              className="px-4 py-2 bg-slate-50 hover:bg-white hover:border-academic-gold hover:text-academic-gold text-slate-600 text-xs font-medium rounded-full border border-slate-200 transition-colors flex items-center shadow-sm"
              disabled={isLoading}
            >
              <Sparkles className="w-3 h-3 mr-2 text-academic-gold" />
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-slate-200 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-academic-navy focus:border-academic-navy focus:outline-none focus:bg-white transition-all font-serif"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-3 bg-academic-navy text-white rounded hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};