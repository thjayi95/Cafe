
import { GoogleGenAI } from "@google/genai";

/**
 * Verifies if the image contains a clear human face selfie
 */
export const verifyFace = async (base64Image: string): Promise<boolean> => {
  // Initialize inside function to ensure environment variables are ready
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
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
          { text: "Analyze this image. Is it a clear selfie of a human face for an attendance system check-in? Answer only 'YES' or 'NO'." },
        ],
      },
    });

    const result = response.text?.trim().toUpperCase();
    return result.includes('YES');
  } catch (error) {
    console.error("AI Face Verification Error:", error);
    return true; 
  }
};

/**
 * Generates a motivational quote for the employee based on their punctuality
 */
export const getMotivationalQuote = async (status: 'on-time' | 'late' | 'check-out'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    let prompt = "";
    if (status === 'on-time') {
      prompt = "Generate a short, positive, and encouraging English quote for an employee who arrived on time. Focus on professionalism and starting the day right.";
    } else if (status === 'late') {
      prompt = "Generate a short, motivational English quote for an employee who arrived late. Focus on punctuality as a virtue and making the most of the rest of the day.";
    } else {
      prompt = "Generate a warm, appreciative English quote for an employee finishing their work day. Focus on rest and work-life balance.";
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "Have a great day!";
  } catch (error) {
    console.error("Quote Generation Error:", error);
    return status === 'on-time' ? "Success belongs to those who arrive early." : "Punctuality is the soul of business.";
  }
};
