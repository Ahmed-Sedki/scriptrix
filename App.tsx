import React, { useState, useEffect, useRef } from 'react';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { ChatInterface } from './components/ChatInterface';
import { EditorPanel } from './components/EditorPanel';
import { WelcomeModal } from './components/WelcomeModal';
import { Logo } from './components/ui/Logo';
import { analyzeText, getChatResponse } from './services/geminiService';
import { AnalysisResult, ChatMessage, Suggestion } from './types';
import { Download, PlusCircle, Layout, MessageSquare, Lightbulb, X, Upload, PenTool, CheckCircle2 } from 'lucide-react';
import { LoadingSpinner } from './components/ui/Loading';

// Debounce helper
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// Helper to strip HTML for analysis
const stripHtml = (html: string) => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

const App: React.FC = () => {
  const [text, setText] = useState<string>(() => localStorage.getItem('acade_draft_html') || '');
  const [docVersion, setDocVersion] = useState(0);
  
  // Mobile View State: 'editor' or 'assistant'
  const [mobileView, setMobileView] = useState<'editor' | 'assistant'>('editor');
  
  const [activeTab, setActiveTab] = useState<'analysis' | 'chat' | 'suggestions'>('chat');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [modalContent, setModalContent] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const debouncedText = useDebounce(text, 2000); 

  useEffect(() => {
    localStorage.setItem('acade_draft_html', text);
  }, [text]);

  useEffect(() => {
    const runAnalysis = async () => {
      const plainText = stripHtml(debouncedText);
      if (plainText.length > 50) {
        setAnalyzing(true);
        const result = await analyzeText(plainText);
        setAnalysis(result);
        setAnalyzing(false);
      }
    };
    runAnalysis();
  }, [debouncedText]);

  const handleChatSend = async (msg: string) => {
    const newMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: msg, timestamp: Date.now() };
    setChatHistory(prev => [...prev, newMessage]);
    setChatLoading(true);
    
    const plainText = stripHtml(text);
    const response = await getChatResponse(chatHistory, msg, plainText);
    
    const aiMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', content: response, timestamp: Date.now() };
    setChatHistory(prev => [...prev, aiMessage]);
    setChatLoading(false);
  };

  const handleNewDocument = () => {
    if (window.confirm("Are you sure? This will clear your current text.")) {
      setText('');
      setAnalysis(null);
      setChatHistory([]);
      setDocVersion(v => v + 1);
    }
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      const formatted = content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");

      setText(formatted);
      setDocVersion(v => v + 1); 
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const plainText = stripHtml(text);
    const file = new Blob([plainText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "academic_draft.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleApplySuggestion = (s: Suggestion) => {
    if (!s.originalText || !s.replacement) return;

    // We try to find the text in the HTML content. 
    // Since originalText comes from stripped HTML, it might not match exact HTML source if there are tags.
    // We'll try a simple replace first.
    if (text.includes(s.originalText)) {
      const newText = text.replace(s.originalText, s.replacement);
      setText(newText);
      setDocVersion(v => v + 1); // Force editor update
      
      // Optimistically remove suggestion from UI
      if (analysis) {
        setAnalysis({
          ...analysis,
          suggestions: analysis.suggestions.filter(suggestion => suggestion !== s)
        });
      }
    } else {
      // If exact match fails (e.g. text has formatting tags inside), we notify the user
      alert("Could not find the exact text match to replace. The text might have been modified or contains formatting tags.");
    }
  };

  const SuggestionsList = () => {
    if (!analysis?.suggestions?.length) return <div className="p-8 text-center text-slate-400 italic">Begin writing to generate academic insights...</div>;
    return (
      <div className="p-4 space-y-3">
        {analysis.suggestions.map((s, idx) => (
          <div 
            key={idx} 
            onClick={() => handleApplySuggestion(s)}
            className="bg-white p-4 rounded border-l-4 border-academic-gold shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
            title="Click to apply this suggestion"
          >
            <div className="flex justify-between items-start mb-2">
               <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                 s.type === 'correction' ? 'bg-red-50 text-red-700' : 
                 s.type === 'tone' ? 'bg-academic-navy text-white' : 'bg-slate-100 text-slate-700'
               }`}>
                 {s.type}
               </span>
               <span className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600 bg-emerald-50 rounded-full p-1">
                 <CheckCircle2 className="w-4 h-4" />
               </span>
            </div>
            <p className="text-sm text-slate-800 font-serif">{s.text}</p>
            {s.originalText && (
               <div className="mt-3 text-xs border-t border-slate-100 pt-2">
                  <div className="text-slate-500 mb-1">Original: <span className="line-through opacity-70 italic">{s.originalText}</span></div>
                  <div className="text-academic-blue font-semibold">Suggested: {s.replacement}</div>
               </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100 text-slate-900 font-sans overflow-hidden">
      <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />

      {/* Result Modal */}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-academic-navy/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col border border-slate-200">
             <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-academic-paper">
                <h3 className="font-serif font-bold text-lg text-academic-navy flex items-center">
                   <Logo className="w-5 h-5 mr-2 text-academic-gold" />
                   Generated Content
                </h3>
                <button onClick={() => setModalContent(null)} className="text-slate-400 hover:text-slate-700 transition-colors"><X className="w-6 h-6" /></button>
             </div>
             <div className="p-8 overflow-y-auto whitespace-pre-wrap leading-loose font-serif text-slate-800 bg-academic-paper">
                {modalContent}
             </div>
             <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => {
                     navigator.clipboard.writeText(modalContent);
                     alert("Copied to clipboard!");
                     setModalContent(null);
                  }} 
                  className="bg-academic-navy text-white px-6 py-2 rounded text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Copy to Clipboard
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-academic-navy text-white h-14 md:h-16 flex items-center justify-between px-4 md:px-6 shrink-0 shadow-md z-20">
        <div className="flex items-center space-x-3">
           <div className="w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-full flex items-center justify-center text-academic-gold">
             <Logo className="w-5 h-5 md:w-6 md:h-6" />
           </div>
           <div>
             <h1 className="text-base md:text-lg font-serif font-bold tracking-tight text-white leading-none">Scriptrix</h1>
             <span className="text-[9px] md:text-[10px] text-slate-300 uppercase tracking-widest hidden sm:inline-block">Scholarly Assistant</span>
           </div>
        </div>
        <div className="flex items-center space-x-2 md:space-x-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".txt,.md"
          />
          <button onClick={handleNewDocument} className="flex items-center px-3 py-1.5 md:px-4 md:py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded transition-colors uppercase tracking-wider" title="New Document">
            <PlusCircle className="w-4 h-4 md:mr-2" /> 
            <span className="hidden sm:inline">New</span>
          </button>
          <button onClick={triggerFileUpload} className="flex items-center px-3 py-1.5 md:px-4 md:py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded transition-colors uppercase tracking-wider" title="Upload Document">
            <Upload className="w-4 h-4 md:mr-2" /> 
            <span className="hidden sm:inline">Upload</span>
          </button>
          <button onClick={handleDownload} className="flex items-center px-3 py-1.5 md:px-5 md:py-2 text-xs font-bold text-academic-navy bg-academic-gold hover:bg-amber-600 hover:text-white rounded shadow-sm transition-colors uppercase tracking-wider" title="Export">
            <Download className="w-4 h-4 md:mr-2" /> 
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Panel: Editor */}
        {/* On Mobile: Hidden if view is 'assistant'. On Desktop: Always flex */}
        <div className={`flex-1 flex-col min-w-0 bg-slate-100 relative ${mobileView === 'assistant' ? 'hidden md:flex' : 'flex'}`}>
          <div className="absolute inset-0 shadow-inner pointer-events-none z-10"></div>
          <EditorPanel 
             key={docVersion}
             text={text} 
             setText={setText} 
             onTextChange={setText}
             setModalContent={setModalContent}
          />
        </div>

        {/* Right Panel: Assistant */}
        {/* On Mobile: Hidden if view is 'editor'. Width full on mobile. */}
        <div className={`
          bg-white flex-col border-l border-slate-200 shrink-0 shadow-xl z-10
          w-full md:w-[400px]
          ${mobileView === 'editor' ? 'hidden md:flex' : 'flex'}
        `}>
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center transition-colors ${
                activeTab === 'chat' 
                  ? 'border-b-2 border-academic-gold text-academic-navy bg-slate-50' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MessageSquare className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Assistant</span>
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center transition-colors ${
                activeTab === 'analysis' 
                  ? 'border-b-2 border-academic-gold text-academic-navy bg-slate-50' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Layout className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Metrics</span>
            </button>
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center transition-colors ${
                activeTab === 'suggestions' 
                  ? 'border-b-2 border-academic-gold text-academic-navy bg-slate-50' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Lightbulb className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Feedback</span>
              {analysis?.suggestions?.length ? <span className="ml-1 bg-academic-gold text-white text-[9px] px-1.5 py-0.5 rounded-full">{analysis.suggestions.length}</span> : null}
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden relative bg-slate-50/50">
            {activeTab === 'chat' && (
              <ChatInterface 
                messages={chatHistory} 
                onSendMessage={handleChatSend} 
                isLoading={chatLoading} 
              />
            )}
            
            {activeTab === 'analysis' && (
              <AnalysisDashboard data={analysis} loading={analyzing} />
            )}

            {activeTab === 'suggestions' && (
              <div className="h-full overflow-y-auto">
                 <SuggestionsList />
                 {analyzing && <LoadingSpinner />}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden h-14 bg-white border-t border-slate-200 flex shrink-0 z-30">
        <button 
          onClick={() => setMobileView('editor')}
          className={`flex-1 flex flex-col items-center justify-center space-y-1 ${mobileView === 'editor' ? 'text-academic-navy bg-slate-50' : 'text-slate-400'}`}
        >
          <PenTool className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Editor</span>
        </button>
        <button 
          onClick={() => setMobileView('assistant')}
          className={`flex-1 flex flex-col items-center justify-center space-y-1 ${mobileView === 'assistant' ? 'text-academic-navy bg-slate-50' : 'text-slate-400'}`}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            {analysis?.suggestions?.length && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-academic-gold rounded-full border border-white"></span>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wide">Assistant</span>
        </button>
      </div>

    </div>
  );
};

export default App;