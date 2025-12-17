import React from 'react';
import { X, BookOpen, PenTool, BarChart2 } from 'lucide-react';
import { Logo } from './ui/Logo';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-academic-navy/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="bg-academic-navy p-6 md:p-8 text-center relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 flex flex-col items-center">
             <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-full flex items-center justify-center text-academic-gold mb-3 md:mb-4 border border-white/20">
               <Logo className="w-6 h-6 md:w-8 md:h-8" />
             </div>
             <h2 className="text-xl md:text-2xl font-serif font-bold text-white">AcadeWrite Pro</h2>
             <p className="text-slate-300 text-xs md:text-sm mt-2 uppercase tracking-widest">Scholarly Writing Assistant</p>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
          <div className="flex gap-4 md:gap-5 items-start">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
              <PenTool className="w-4 h-4 md:w-5 md:h-5 text-academic-blue" />
            </div>
            <div>
              <h3 className="font-bold text-academic-navy text-xs md:text-sm uppercase tracking-wide mb-1">Smart Editor</h3>
              <p className="text-xs md:text-sm text-slate-600 font-serif leading-relaxed">Distraction-free writing environment with a paper-like feel. Use <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs border border-slate-200">Tab</span> to accept AI completions.</p>
            </div>
          </div>

          <div className="flex gap-4 md:gap-5 items-start">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
              <BarChart2 className="w-4 h-4 md:w-5 md:h-5 text-academic-gold" />
            </div>
            <div>
              <h3 className="font-bold text-academic-navy text-xs md:text-sm uppercase tracking-wide mb-1">Academic Analysis</h3>
              <p className="text-xs md:text-sm text-slate-600 font-serif leading-relaxed">Real-time metrics on clarity, tone, and vocabulary diversity to elevate your manuscript.</p>
            </div>
          </div>

          <div className="flex gap-4 md:gap-5 items-start">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-academic-navy text-xs md:text-sm uppercase tracking-wide mb-1">Research Companion</h3>
              <p className="text-xs md:text-sm text-slate-600 font-serif leading-relaxed">Highlight text to paraphrase, expand ideas, or check citations instantly.</p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200 flex justify-center shrink-0">
          <button
            onClick={onClose}
            className="w-full max-w-xs px-6 py-3 bg-academic-navy text-white font-bold uppercase tracking-widest text-xs rounded hover:bg-slate-800 transition-all shadow-md hover:shadow-lg"
          >
            Enter Workspace
          </button>
        </div>
      </div>
    </div>
  );
};
