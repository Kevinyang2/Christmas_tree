import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
const apiKey = process.env.API_KEY || ''; // Ensure this is set in your environment
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const generateLuxuryGreeting = async (): Promise<string> => {
  if (!ai) {
    console.warn("Gemini API Key missing");
    return "May your holidays be filled with golden moments and emerald dreams.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Write a short, very luxurious, high-class, 'Trump-style' grandeur Christmas greeting sentence. Keep it under 15 words. Focus on gold, winning, and greatness.",
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini generation failed", error);
    return "Experience the grandeur of the ultimate holiday season.";
  }
};
