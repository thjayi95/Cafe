
import { GoogleGenAI, Type } from "@google/genai";
import { Habit, CheckInLog } from '../types';

export const getHabitMotivation = async (habits: Habit[], logs: CheckInLog[]) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    return {
      quote: "每一个伟大的成就都始于决定尝试的一刻。",
      advice: "保持专注，哪怕是一点点进步也值得庆祝。"
    };
  }

  try {
    // Always use the direct process.env.API_KEY for initialization as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const habitSummary = habits.map(h => {
      const habitLogs = logs.filter(l => l.habitId === h.id);
      return `${h.name}: 总打卡 ${habitLogs.length} 次`;
    }).join(', ');

    const prompt = `
      你是一个私人习惯教练。根据用户最近的打卡情况给出简短有力的鼓励。
      用户正在追踪的习惯：${habitSummary}。
      请生成一个包含励志名言和具体建议的 JSON。
      要求：
      1. 语言亲切且具有启发性。
      2. 针对中文用户。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quote: { type: Type.STRING, description: '一句励志名言' },
            advice: { type: Type.STRING, description: '具体的行动建议' }
          },
          required: ['quote', 'advice']
        }
      }
    });

    // Directly access .text property from response as it's a getter
    const jsonStr = response.text || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      quote: "每一个伟大的成就都始于决定尝试的一刻。",
      advice: "保持专注，哪怕是一点点进步也值得庆祝。"
    };
  }
};
