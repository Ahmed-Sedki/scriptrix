import React from 'react';
import { AnalysisResult } from '../types';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { FileText, Clock, BookOpen, AlertCircle } from 'lucide-react';

interface AnalysisDashboardProps {
  data: AnalysisResult | null;
  loading: boolean;
}

const ScoreCard: React.FC<{ title: string; score: number; color: string }> = ({ title, score, color }) => (
  <div className="bg-white p-5 rounded border border-slate-200 flex flex-col items-center shadow-sm">
    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">{title}</h4>
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-full h-full" viewBox="0 0 36 36">
        <path
          className="text-slate-100"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className={color}
          strokeDasharray={`${score}, 100`}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-2xl font-serif font-bold text-academic-navy">{score}</span>
    </div>
  </div>
);

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center h-full">
         <div className="w-8 h-8 border-2 border-slate-200 border-t-academic-navy rounded-full animate-spin mb-4"></div>
         <span className="text-slate-400 text-xs uppercase tracking-widest">Analyzing Manuscript...</span>
      </div>
    );
  }

  if (!data) return <div className="p-12 text-center text-slate-400 italic font-serif">Input text to view academic metrics.</div>;

  const getGrammarColor = (rating: string) => {
    switch (rating) {
      case 'Good': return 'text-emerald-700 bg-emerald-50 border-emerald-100';
      case 'Needs Work': return 'text-amber-700 bg-amber-50 border-amber-100';
      case 'Poor': return 'text-red-700 bg-red-50 border-red-100';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto p-4 md:p-6 pb-20 bg-slate-50/50">
      
      {/* Key Scores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ScoreCard title="Clarity" score={data.clarityScore} color="text-academic-blue" />
        <ScoreCard title="Tone" score={data.academicToneScore} color="text-academic-gold" />
      </div>

      {/* Grammar & Readability */}
      <div className="bg-white p-5 rounded border border-slate-200 shadow-sm space-y-5">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Grammar</span>
          <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border ${getGrammarColor(data.grammarRating)}`}>{data.grammarRating}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Readability</span>
          <span className="font-serif font-bold text-academic-navy">{data.readabilityLevel}</span>
        </div>
      </div>

      {/* Document Insights */}
      <div className="bg-white rounded border border-slate-200 p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
          <FileText className="w-4 h-4 mr-2" /> Document Statistics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">Reading Time</span>
            <span className="font-serif text-slate-700 font-medium flex items-center">
              <Clock className="w-3 h-3 mr-2 text-academic-gold" /> {data.documentInsights.estimatedReadingTime}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">Complex Sentences</span>
            <span className="font-serif text-slate-700 font-medium flex items-center">
              <BookOpen className="w-3 h-3 mr-2 text-academic-blue" /> {data.documentInsights.complexSentenceCount}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">Transitions</span>
            <span className="font-serif text-slate-700 font-medium flex items-center">
              <AlertCircle className="w-3 h-3 mr-2 text-emerald-600" /> {data.documentInsights.transitionWordsCount}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">Vocabulary</span>
            <div className="flex items-center">
               <div className="flex-1 h-2 bg-slate-100 rounded-full mr-2 overflow-hidden">
                 <div className="h-full bg-academic-navy rounded-full" style={{ width: `${data.documentInsights.vocabularyDiversityScore}%` }}></div>
               </div>
               <span className="font-serif text-xs font-bold text-academic-navy">{data.documentInsights.vocabularyDiversityScore}</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};
