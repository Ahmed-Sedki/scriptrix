export interface AnalysisResult {
  clarityScore: number;
  academicToneScore: number;
  grammarRating: 'Good' | 'Needs Work' | 'Poor';
  readabilityLevel: string;
  suggestions: Suggestion[];
  documentInsights: {
    estimatedReadingTime: string;
    vocabularyDiversityScore: number;
    complexSentenceCount: number;
    transitionWordsCount: number;
  };
}

export interface Suggestion {
  id: string;
  type: 'improvement' | 'correction' | 'tone';
  text: string;
  originalText?: string; // If specific to a selection
  replacement?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface QuickActionType {
  id: string;
  label: string;
  promptPrefix: string;
  icon: string;
}
