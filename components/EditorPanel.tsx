import React, { useRef, useState, useEffect } from 'react';
import { performQuickAction, getAutocompleteSuggestion } from '../services/geminiService';
import { 
  Wand2, Expand, FileText, Quote, AlertTriangle, 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, 
  List, ListOrdered, Heading1, Heading2, Quote as QuoteIcon,
  MessageSquarePlus, Check, X, Copy, Sparkles
} from 'lucide-react';
import { Logo } from './ui/Logo';

interface EditorPanelProps {
  text: string;
  setText: (text: string) => void;
  onTextChange: (text: string) => void;
  setModalContent: (content: string) => void;
}

const QUICK_ACTIONS = [
  { id: 'Custom', icon: MessageSquarePlus, label: 'Ask AI' },
  { id: 'Paraphrase Selection', icon: Wand2, label: 'Paraphrase' },
  { id: 'Expand Ideas', icon: Expand, label: 'Expand' },
  { id: 'Summarize', icon: FileText, label: 'Summarize' },
  { id: 'Citation Helper', icon: Quote, label: 'Citations' },
];

interface AiPopupState {
  isOpen: boolean;
  mode: 'prompt' | 'processing' | 'result';
  actionId: string;
  prompt: string;
  result: string;
  range: Range | null;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ text, setText, onTextChange, setModalContent }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [suggestion, setSuggestion] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const [aiPopup, setAiPopup] = useState<AiPopupState>({
    isOpen: false,
    mode: 'prompt',
    actionId: '',
    prompt: '',
    result: '',
    range: null
  });

  useEffect(() => {
    if (editorRef.current && text && editorRef.current.innerHTML !== text) {
      if (editorRef.current.innerHTML === '' || editorRef.current.innerHTML === '<br>') {
        editorRef.current.innerHTML = text;
        updateCounts();
      }
    }
    if (editorRef.current && !text) {
       editorRef.current.innerHTML = '';
       updateCounts();
    }
  }, [text]);

  const updateCounts = () => {
    if (editorRef.current) {
      const plainText = editorRef.current.innerText || "";
      setWordCount(plainText.trim() ? plainText.trim().split(/\s+/).length : 0);
      setCharCount(plainText.length);
    }
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (editorRef.current && !isTyping && !aiPopup.isOpen) {
        const plainText = editorRef.current.innerText || "";
        if (plainText.length > 20) {
            const result = await getAutocompleteSuggestion(plainText);
            if (result) setSuggestion(result);
        }
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [text, isTyping, aiPopup.isOpen]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    setIsTyping(true);
    setSuggestion('');
    const newHtml = e.currentTarget.innerHTML;
    setText(newHtml); 
    onTextChange(newHtml);
    updateCounts();
    setTimeout(() => setIsTyping(false), 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      document.execCommand('insertText', false, " " + suggestion);
      setSuggestion('');
      if (editorRef.current) {
         setText(editorRef.current.innerHTML);
         onTextChange(editorRef.current.innerHTML);
      }
    }
  };

  const executeCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      setText(editorRef.current.innerHTML);
      onTextChange(editorRef.current.innerHTML);
    }
  };

  const handleQuickAction = (actionId: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().trim().length === 0) {
      alert("Please select some text first.");
      return;
    }
    
    const range = selection.getRangeAt(0).cloneRange();

    if (actionId === 'Custom') {
      setAiPopup({
        isOpen: true,
        mode: 'prompt',
        actionId,
        prompt: '',
        result: '',
        range
      });
    } else {
      setAiPopup({
        isOpen: true,
        mode: 'processing',
        actionId,
        prompt: '',
        result: '',
        range
      });
      runAiAction(actionId, selection.toString(), '', range);
    }
  };

  const runAiAction = async (actionId: string, selectionText: string, customPrompt: string, range: Range) => {
    try {
      const result = await performQuickAction(actionId, selectionText, customPrompt);
      setAiPopup(prev => ({ ...prev, mode: 'result', result, range }));
    } catch (e) {
      setAiPopup(prev => ({ ...prev, mode: 'result', result: "Error processing request.", range }));
    }
  };

  const handleCustomSubmit = () => {
    if (!aiPopup.range) return;
    const selectionText = aiPopup.range.toString();
    setAiPopup(prev => ({ ...prev, mode: 'processing' }));
    runAiAction('Custom', selectionText, aiPopup.prompt, aiPopup.range);
  };

  const handleReplace = () => {
    if (!aiPopup.range || !aiPopup.result) return;
    
    const selection = window.getSelection();
    if (selection) {
      // 1. Restore the original selection
      selection.removeAllRanges();
      selection.addRange(aiPopup.range);
      
      // 2. Clean and format the result string
      let content = aiPopup.result.trim();
      
      // Remove surrounding quotes if present (common AI artifact)
      if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
          content = content.slice(1, -1);
      }
      
      // Remove conversational prefixes if any slipped through
      content = content.replace(/^(Here is|Here's) the (rewritten|improved|edited) text:?\s*/i, "");

      // Convert basic markdown to HTML for smooth integration
      // Bold
      content = content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
      // Italic
      content = content.replace(/\*(.*?)\*/g, '<i>$1</i>');
      // Lists (simple)
      content = content.replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>');
      // Wrap lists if any list items were created
      if (content.includes('<li>')) {
          content = content.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
      }
      // Newlines to breaks (but avoid double breaks for list items or block elements)
      content = content.replace(/\n/g, '<br>');

      // 3. Insert using insertHTML to preserve formatting and flow
      document.execCommand('insertHTML', false, content);
      
      if (editorRef.current) {
        setText(editorRef.current.innerHTML);
        onTextChange(editorRef.current.innerHTML);
      }
    }
    closePopup();
  };

  const closePopup = () => {
    setAiPopup({ isOpen: false, mode: 'prompt', actionId: '', prompt: '', result: '', range: null });
  };

  const ToolbarButton: React.FC<{ 
    icon: React.ElementType, 
    command: string, 
    value?: string, 
    title: string 
  }> = ({ icon: Icon, command, value, title }) => (
    <button
      onMouseDown={(e) => {
        e.preventDefault(); 
        executeCommand(command, value);
      }}
      className="p-2 text-slate-500 hover:bg-slate-100 hover:text-academic-blue rounded transition-colors"
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="flex flex-col h-full relative">
      {/* Format Toolbar - Scrollable on mobile */}
      <div className="px-2 md:px-6 py-2 md:py-3 border-b border-slate-200 bg-white flex items-center shrink-0 shadow-sm z-20 overflow-x-auto scrollbar-hide">
        <div className="flex items-center space-x-1 whitespace-nowrap">
          <div className="flex items-center space-x-1 border-r border-slate-200 pr-2 mr-2">
            <ToolbarButton icon={Bold} command="bold" title="Bold (Ctrl+B)" />
            <ToolbarButton icon={Italic} command="italic" title="Italic (Ctrl+I)" />
            <ToolbarButton icon={Underline} command="underline" title="Underline (Ctrl+U)" />
          </div>
          <div className="flex items-center space-x-1 border-r border-slate-200 pr-2 mr-2">
             <ToolbarButton icon={Heading1} command="formatBlock" value="H1" title="Heading 1" />
             <ToolbarButton icon={Heading2} command="formatBlock" value="H2" title="Heading 2" />
             <ToolbarButton icon={QuoteIcon} command="formatBlock" value="blockquote" title="Quote" />
          </div>
          <div className="flex items-center space-x-1 border-r border-slate-200 pr-2 mr-2">
             <ToolbarButton icon={List} command="insertUnorderedList" title="Bullet List" />
             <ToolbarButton icon={ListOrdered} command="insertOrderedList" title="Numbered List" />
          </div>
        </div>

        {/* Quick Actions in Toolbar */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 whitespace-nowrap">
           {QUICK_ACTIONS.map((action) => (
             <button
               key={action.id}
               onMouseDown={(e) => e.preventDefault()}
               onClick={() => handleQuickAction(action.id)}
               className={`flex items-center px-2 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors border ${
                 action.id === 'Custom' 
                   ? 'bg-academic-navy text-white border-academic-navy hover:bg-slate-800' 
                   : 'bg-white text-slate-600 border-slate-200 hover:border-academic-gold hover:text-academic-gold'
               }`}
               title={action.label}
             >
               <action.icon className="w-3 h-3 md:mr-1.5" />
               <span className="hidden md:inline">{action.label}</span>
             </button>
           ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col bg-[#e2e8f0] p-2 sm:p-4 md:p-8 justify-center">
        <div className="flex-1 max-w-[850px] mx-auto w-full bg-academic-paper shadow-md rounded-sm border border-slate-200 relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-academic-navy via-academic-blue to-academic-gold opacity-10"></div>
          
          <div 
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            className="editor-content flex-1 w-full px-6 py-6 md:px-12 md:py-12 overflow-y-auto focus:outline-none text-slate-800 text-[15px] md:text-[17px] leading-relaxed md:leading-8"
            spellCheck={false}
            data-placeholder="Start writing your academic paper here..."
            style={{ minHeight: '100px' }}
          />
        </div>
        
        {/* Suggestion Overlay */}
        {suggestion && !aiPopup.isOpen && (
          <div className="absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 z-30 animate-fade-in pointer-events-none w-[90%] md:w-full max-w-[600px]">
             <div className="bg-white/90 border border-academic-gold/30 shadow-xl rounded-full px-4 py-2 md:px-6 md:py-3 flex items-center justify-between text-xs md:text-sm backdrop-blur-sm">
                <span className="text-academic-gold mr-2 md:mr-3 font-serif italic hidden sm:inline">Suggestion:</span>
                <span className="font-serif text-slate-700 flex-1 truncate">{suggestion}</span>
                <span className="ml-2 md:ml-4 text-[9px] md:text-[10px] font-bold tracking-widest text-slate-400 uppercase whitespace-nowrap">Tab to accept</span>
             </div>
          </div>
        )}

        {/* AI Action Popup */}
        {aiPopup.isOpen && (
          <div className="absolute top-10 md:top-20 left-1/2 transform -translate-x-1/2 z-40 w-[95%] md:w-[500px] bg-white rounded shadow-2xl border border-slate-200 animate-slide-up flex flex-col">
            <div className="p-3 border-b border-slate-100 bg-academic-navy rounded-t flex justify-between items-center text-white">
              <span className="text-xs font-bold uppercase tracking-widest flex items-center">
                <Logo className="w-4 h-4 mr-2 text-academic-gold" />
                {aiPopup.actionId === 'Custom' ? 'Ask AI Assistant' : aiPopup.actionId}
              </span>
              <button onClick={closePopup} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 md:p-5 bg-academic-paper">
              {aiPopup.mode === 'prompt' && (
                <div className="space-y-4">
                  <p className="text-sm font-serif text-slate-700 italic">How would you like to transform the selected text?</p>
                  <textarea 
                    autoFocus
                    value={aiPopup.prompt}
                    onChange={(e) => setAiPopup(p => ({...p, prompt: e.target.value}))}
                    placeholder="e.g., Rewrite for better flow, Translate to French, Check for passive voice..."
                    className="w-full border border-slate-300 bg-white rounded p-3 text-sm focus:ring-1 focus:ring-academic-gold focus:border-academic-gold focus:outline-none h-24 resize-none font-serif"
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCustomSubmit(); }}}
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={handleCustomSubmit}
                      disabled={!aiPopup.prompt.trim()}
                      className="bg-academic-navy text-white px-5 py-2 rounded text-sm font-medium hover:bg-slate-800 disabled:opacity-50 shadow-sm w-full md:w-auto"
                    >
                      Generate Response
                    </button>
                  </div>
                </div>
              )}

              {aiPopup.mode === 'processing' && (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-4">
                   <div className="relative">
                      <div className="w-12 h-12 border-4 border-slate-200 border-t-academic-gold rounded-full animate-spin"></div>
                      <Logo className="w-5 h-5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-slate-300" />
                   </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-academic-navy">Analyzing Text...</span>
                </div>
              )}

              {aiPopup.mode === 'result' && (
                <div className="space-y-4">
                   <div className="bg-white p-4 rounded border border-slate-200 text-sm max-h-60 overflow-y-auto font-serif leading-relaxed text-slate-800 shadow-inner">
                     {aiPopup.result}
                   </div>
                   <div className="flex gap-3">
                     <button 
                       onClick={handleReplace}
                       className="flex-1 bg-academic-gold text-white py-2 rounded text-sm font-bold uppercase tracking-wider hover:bg-amber-600 shadow-sm flex items-center justify-center"
                     >
                       <Check className="w-4 h-4 mr-2" /> Apply Change
                     </button>
                     <button 
                       onClick={() => navigator.clipboard.writeText(aiPopup.result)}
                       className="px-4 py-2 bg-white border border-slate-300 text-slate-600 rounded hover:bg-slate-50 hover:text-academic-navy transition-colors"
                       title="Copy"
                     >
                       <Copy className="w-4 h-4" />
                     </button>
                   </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="h-8 border-t border-slate-300 bg-slate-200 flex justify-between items-center px-4 md:px-6 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-500 shrink-0">
        <div>
           {aiPopup.mode === 'processing' ? <span className="text-academic-blue animate-pulse">AI Processing...</span> : 'Draft Auto-saved'}
        </div>
        <div className="flex space-x-3 md:space-x-6">
          <span>{wordCount} words</span>
          <span>{charCount} chars</span>
        </div>
      </div>
    </div>
  );
};