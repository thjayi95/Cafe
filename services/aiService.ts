
import { GoogleGenAI } from "@google/genai";

/**
 * Verifies if the image contains a clear human face selfie using Gemini 3
 */
export const verifyFace = async (base64Image: string): Promise<boolean> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === '') return true; // Safety fallback
  
  try {
    // Always use the direct process.env.API_KEY for initialization as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          { text: "Examine this image. Is it a clear selfie of a person's face for a workplace clock-in? Answer ONLY 'YES' or 'NO'." },
        ],
      },
    });

    // Safely handle potential undefined response.text
    const result = (response.text || "").trim().toUpperCase();
    return result.includes('YES');
  } catch (error) {
    console.error("AI Face Verification Error:", error);
    return true; 
  }
};

/**
 * Generates an inspiring motivational quote for employees
 */
export const getMotivationalQuote = async (status: 'on-time' | 'late' | 'check-out'): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    return status === 'on-time' ? "Success is built on punctuality." : "Your hard work is appreciated.";
  }

  try {
    // Always use the direct process.env.API_KEY for initialization as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let prompt = "";
    if (status === 'on-time') {
      prompt = "Write a short (under 15 words) English professional greeting for a punctual employee starting their day. Be inspiring.";
    } else if (status === 'late') {
      prompt = "Write a short (under 15 words) encouraging English professional message for an employee who arrived late. Be kind and motivate them to focus.";
    } else {
      prompt = "Write a short (under 15 words) appreciative English message for an employee finishing work. Wish them a good rest.";
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Directly access .text property from response as it's a getter
    return response.text?.trim() || "Have a great day!";
  } catch (error) {
    console.error("AI Quote Error:", error);
    return "Keep up the great work.";
  }
};
