import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, Sparkles, MessageSquare, Wand2, Check, X } from 'lucide-react';
import { LoadingSpinner } from './ui/Loading';
import { Logo } from './ui/Logo';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
  onApplyChange?: (content: string) => void;
  hasSelection?: boolean;
}

const QUICK_PROMPTS = [
  "Improve this paragraph",
  "Make it more academic",
  "Check grammar",
  "Expand this idea"
];

// Helper to format markdown strings to HTML for display in chat
const formatMarkdownToHtml = (markdown: string) => {
  let html = markdown.trim();

  // Handle horizontal rules
  html = html.replace(/^\*\*\*$/gm, '<hr class="my-4 border-slate-200" />');
  html = html.replace(/^---$/gm, '<hr class="my-4 border-slate-200" />');

  // Handle Headers
  html = html.replace(/^### (.*$)/gm, '<h3 class="text-base font-bold font-serif mt-4 mb-2 text-academic-navy">$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2 class="text-lg font-bold font-serif mt-5 mb-3 text-academic-navy">$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold font-serif mt-6 mb-4 text-academic-navy">$1</h1>');

  // Handle Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  
  // Handle Italic
  html = html.replace(/\*(.*?)\*/g, '<i>$1</i>');

  // Handle Lists (simple bullet points)
  html = html.replace(/^\s*-\s+(.*)$/gm, '<li class="ml-4 list-disc">$1</li>');

  // Handle newlines (converting to <br> if not already handled by block elements)
  html = html.replace(/\n/g, '<br>');

  return html;
};

const MessageItem: React.FC<{ 
  msg: ChatMessage, 
  onApply: (content: string) => void,
  hasSelection: boolean
}> = ({ msg, onApply, hasSelection }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group animate-fade-in`}>
      <div
        className={`relative max-w-[92%] p-4 rounded-lg text-sm leading-relaxed shadow-sm font-serif ${
          msg.role === 'user'
            ? 'bg-academic-navy text-white rounded-br-none'
            : 'bg-academic-paper-dark text-slate-800 border border-slate-200 rounded-bl-none'
        }`}
      >
        <div 
          className="chat-message-content"
          dangerouslySetInnerHTML={{ __html: formatMarkdownToHtml(msg.content) }}
        />
        
        {/* Approve/Decline Controls for AI messages */}
        {msg.role === 'model' && !showConfirm && (
          <button 
            onClick={() => setShowConfirm(true)}
            className="absolute -right-2 -bottom-2 bg-academic-gold text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 active:scale-95"
            title="Apply to document"
          >
            <Wand2 className="w-3.5 h-3.5" />
          </button>
        )}

        {showConfirm && (
          <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col space-y-2 animate-fade-in">
             <p className="text-[10px] font-bold uppercase tracking-widest text-academic-gold">Apply this response to selection?</p>
             {!hasSelection && (
               <p className="text-[10px] text-red-500 italic">No text selected in editor.</p>
             )}
             <div className="flex gap-2">
                <button 
                  onClick={() => {
                    onApply(msg.content);
                    setShowConfirm(false);
                  }}
                  disabled={!hasSelection}
                  className="flex-1 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest py-1.5 rounded hover:bg-emerald-700 transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  <Check className="w-3 h-3 mr-1" /> Approve
                </button>
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest py-1.5 rounded hover:bg-slate-300 transition-colors flex items-center justify-center"
                >
                  <X className="w-3 h-3 mr-1" /> Decline
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading, onApplyChange, hasSelection }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
          <MessageItem 
            key={msg.id} 
            msg={msg} 
            onApply={(content) => onApplyChange?.(content)}
            hasSelection={hasSelection || false}
          />
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