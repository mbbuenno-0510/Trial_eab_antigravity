import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const suggestRoutineIcon = async (title: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest a single emoji that best represents this daily routine: "${title}". Return ONLY the emoji character, nothing else. If unsure, return 📝.`,
    });
    const text = response.text?.trim();
    // Simple check to see if it looks like an emoji (or short string)
    return text && text.length < 5 ? text : '📝';
  } catch (error) {
    console.error("Gemini Icon Error", error);
    return '📝';
  }
};
