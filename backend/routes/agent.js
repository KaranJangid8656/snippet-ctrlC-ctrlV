const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

// @route   POST /api/v1/agent/generate
// @desc    Generate code snippet using Gemini AI
router.post('/generate', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ success: false, message: 'Please provide a prompt' });
        }

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            return res.json({
                success: true,
                type: 'fallback',
                content: '⚠️ **Configuration Required:** Please open your `backend/.env` file and replace `your_gemini_api_key_here` with your actual Google Gemini API key.'
            });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const systemPrompt = `
You are an expert coding assistant for the Snippet Saver app.

If the user asks for a code snippet, feature, or algorithm, respond ONLY with a JSON object matching this structure:
{
  "type": "code",
  "title": "A short, descriptive title for the snippet (e.g. 'Debounce Function')",
  "content": "The raw code snippet spanning multiple lines. Do NOT include Markdown formatting (like \`\`\`) in this field."
}

If the user says hi, asks a general question, or anything not requiring a code snippet, respond ONLY with a JSON object matching this structure:
{
  "type": "chat",
  "content": "Your conversational response as a helpful AI."
}

You MUST output ONLY valid JSON. Do NOT wrap the JSON in Markdown (like \`\`\`json).
User request: "${prompt}"
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: systemPrompt,
        });

        const rawText = response.text.trim();

        let parsedData;
        try {
            // Strip markdown block format if the LLM adds it
            const cleanText = rawText.replace(/^```(json)?/i, '').replace(/```$/i, '').trim();
            parsedData = JSON.parse(cleanText);
        } catch (parseError) {
            console.error("Agent failed to parse JSON:", rawText);
            return res.json({
                success: true,
                type: 'chat',
                content: rawText // Fallback to raw text if JSON parsing fails
            });
        }

        res.json({
            success: true,
            type: parsedData.type === 'code' ? 'code' : 'chat',
            title: parsedData.title,
            content: parsedData.content
        });

    } catch (error) {
        console.error('Agent Error:', error);

        // Handle Gemini rate limits or quota issues
        if (error.status === 429 || (error.response && error.response.status === 429)) {
            return res.json({
                success: true,
                type: 'chat',
                content: '⚠️ **API Error:** You have exceeded your Gemini API quota or rate limit. Please wait a moment or check your Google AI Studio account.'
            });
        }

        res.status(500).json({ success: false, message: 'Server Error in Agent' });
    }
});

module.exports = router;
