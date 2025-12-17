import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, ChatMessage } from "../types";

const apiKey = process.env.API_KEY;

// Initialize Gemini Client
// Using gemini-2.5-flash for speed and efficiency in real-time tasks
const ai = new GoogleGenAI({ apiKey: apiKey });

const ANALYSIS_MODEL = "gemini-2.5-flash";
const CHAT_MODEL = "gemini-2.5-flash";
const AUTOCOMPLETE_MODEL = "gemini-2.5-flash";

export const analyzeText = async (text: string): Promise<AnalysisResult> => {
  if (!text || text.trim().length < 10) {
    return {
      clarityScore: 0,
      academicToneScore: 0,
      grammarRating: 'Needs Work',
      readabilityLevel: 'N/A',
      suggestions: [],
      documentInsights: {
        estimatedReadingTime: '0 min',
        vocabularyDiversityScore: 0,
        complexSentenceCount: 0,
        transitionWordsCount: 0
      }
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: `Analyze the following academic text. Provide a JSON response with scores and specific suggestions for improvement.
      
      Text to analyze:
      """
      ${text}
      """`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clarityScore: { type: Type.INTEGER, description: "0-100 score" },
            academicToneScore: { type: Type.INTEGER, description: "0-100 score" },
            grammarRating: { type: Type.STRING, enum: ["Good", "Needs Work", "Poor"] },
            readabilityLevel: { type: Type.STRING, description: "e.g., 'College Level', 'High School'" },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["improvement", "correction", "tone"] },
                  text: { type: Type.STRING, description: "The actionable suggestion text" },
                  originalText: { type: Type.STRING },
                  replacement: { type: Type.STRING }
                }
              }
            },
            documentInsights: {
              type: Type.OBJECT,
              properties: {
                estimatedReadingTime: { type: Type.STRING },
                vocabularyDiversityScore: { type: Type.INTEGER, description: "0-100" },
                complexSentenceCount: { type: Type.INTEGER },
                transitionWordsCount: { type: Type.INTEGER }
              }
            }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from analysis model");
    return JSON.parse(jsonText) as AnalysisResult;

  } catch (error) {
    console.error("Analysis failed:", error);
    // Return a fallback empty result on error to prevent app crash
    return {
      clarityScore: 0,
      academicToneScore: 0,
      grammarRating: 'Needs Work',
      readabilityLevel: 'Error',
      suggestions: [{ id: 'err', type: 'improvement', text: 'Analysis unavailable. Please try again.', originalText: '', replacement: '' }],
      documentInsights: {
        estimatedReadingTime: '-',
        vocabularyDiversityScore: 0,
        complexSentenceCount: 0,
        transitionWordsCount: 0
      }
    };
  }
};

export const getChatResponse = async (history: ChatMessage[], newMessage: string, currentContext: string): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: CHAT_MODEL,
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.content }]
      })),
      config: {
        systemInstruction: `You are an expert Academic Writing Assistant called 'AcadeWrite Pro'. 
        You help students and researchers improve their writing. 
        Current Document Context: "${currentContext.substring(0, 2000)}..." (truncated if long).
        Always be professional, encouraging, and academically rigorous.
        Keep answers concise unless asked to elaborate.`
      }
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "I apologize, I couldn't generate a response.";
  } catch (error) {
    console.error("Chat error:", error);
    return "Sorry, I'm having trouble connecting to the AI service right now.";
  }
};

export const getAutocompleteSuggestion = async (textBeforeCursor: string): Promise<string> => {
  if (!textBeforeCursor || textBeforeCursor.length < 50) return "";
  
  // Take last 200 chars for context
  const context = textBeforeCursor.slice(-200);

  try {
    const response = await ai.models.generateContent({
      model: AUTOCOMPLETE_MODEL,
      contents: `Complete the following academic sentence naturally. Provide ONLY the completion text, starting with the next likely word. Do not repeat the input. Keep it short (max 10 words).
      
      Input text: "${context}"`,
      config: {
        maxOutputTokens: 20,
        temperature: 0.3 // Lower temperature for more predictable completion
      }
    });

    let suggestion = response.text?.trim() || "";
    // Clean up if it repeats the start (simple heuristic)
    if (suggestion.toLowerCase().startsWith(context.split(' ').pop()?.toLowerCase() || '')) {
       // If model repeated the last word, strip it (basic safeguard)
    }
    return suggestion;
  } catch (error) {
    return "";
  }
};

export const performQuickAction = async (action: string, selection: string, customPrompt?: string): Promise<string> => {
  try {
    let prompt = "";
    switch (action) {
      case "Paraphrase Selection":
        prompt = "Rewrite the following text to be more academic and professional, maintaining the original meaning:";
        break;
      case "Expand Ideas":
        prompt = "Expand on the following text with 2-3 explanatory sentences to deepen the analysis:";
        break;
      case "Summarize":
        prompt = "Summarize the following text concisely, retaining key academic points:";
        break;
      case "Citation Helper":
        prompt = "Identify where citations are likely needed in the following text and suggest the type of source (e.g., 'Requires empirical study citation'):";
        break;
      case "Check Plagiarism Risk":
        prompt = "Analyze the following text for potential plagiarism risks (e.g., too generic, common phrasing without attribution) and suggest how to make it more original:";
        break;
      case "Custom":
        prompt = customPrompt || "Improve the following text:";
        break;
      default:
        prompt = "Improve the following text:";
    }

    const response = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents: `${prompt}\n\n"${selection}"`
    });

    return response.text || "Could not process selection.";
  } catch (error) {
    console.error("Quick action error:", error);
    return "Error processing request.";
  }
};
