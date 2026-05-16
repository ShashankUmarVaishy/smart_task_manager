require('dotenv').config();
const { GoogleGenAI, Type } = require('@google/genai');

(async () => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `You are an intelligent task parsing assistant. 
      The current date and time is: ${new Date().toISOString()}.
      
      User said: "buy groceries tomorrow"
      
      Extract the task information and return a JSON object that strictly matches this schema:
      - title: The cleaned up task title (string)
      - deadline: The deduced deadline date in ISO 8601 format (string), or null if no date is implied.
      - priority: One of "mid", "high", or "urgent" based on the user's tone or explicit words. Default to "mid".`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              deadline: { type: Type.STRING, nullable: true },
              priority: { type: Type.STRING, enum: ["mid", "high", "urgent"] }
            },
            required: ["title", "priority"]
          }
        }
    });

    console.log(response.text);
  } catch (err) {
    console.error("ERROR:");
    console.error(err);
  }
})();
