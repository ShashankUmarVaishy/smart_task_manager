const { GoogleGenAI, Type } = require('@google/genai');

const parseTaskText = async (req, res) => {
  const { text, localTime } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'No text provided' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ message: 'Gemini API Key is missing on the server.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // We pass the local time so the AI knows what "tomorrow" means
    const prompt = `
      You are an intelligent task parsing assistant. 
      The current date and time is: ${localTime || new Date().toISOString()}.
      
      User said: "${text}"
      
      Extract the task information and return a JSON object that strictly matches this schema:
      - title: The cleaned up task title (string)
      - deadline: The deduced deadline date in ISO 8601 format (string), or null if no date is implied.
      - priority: One of "mid", "high", or "urgent" based on the user's tone or explicit words. Default to "mid".
    `;

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

    const parsedText = response.text;
    const taskData = JSON.parse(parsedText);
    
    res.json(taskData);
  } catch (error) {
    console.error('AI parsing error:', error);
    res.status(500).json({ message: 'Failed to parse task using AI.' });
  }
};

module.exports = { parseTaskText };
