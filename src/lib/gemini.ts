import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiMessage {
  role: 'user' | 'model';
  text: string;
}

const SYSTEM_INSTRUCTION =
  'You are an expert EASA Part-66 and UniKL MIAT Aviation Engineering Tutor. ' +
  'Provide structured, accurate, step-by-step explanations for aircraft engineering students. ' +
  'Use LaTeX for mathematical formulas (wrap inline math in $...$ and display math in $$...$$). ' +
  'Use clean Markdown formatting with headings, bullet points, and numbered steps. ' +
  'Your expertise covers Electrical Fundamentals, Aerodynamics, Thermofluids, Gas Turbine Engines, ' +
  'Piston Engines, Aircraft Structures, and Aviation Legislation.';

const MODEL = 'gemini-2.5-flash';

/**
 * Call Google Gemini to get a single AI tutor response.
 * Returns the generated text, or throws an Error with a readable message.
 */
export async function askGemini(
  userPrompt: string,
  history: GeminiMessage[] = [],
  signal?: AbortSignal,
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[gemini] VITE_GEMINI_API_KEY is missing');
    return 'API key is missing. Please set VITE_GEMINI_API_KEY in your .env file.';
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    });
    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      })),
    });
    const result = await chat.sendMessage(userPrompt, { signal });
    const aiText = result.response.text();

    if (!aiText) {
      throw new Error('Gemini returned an empty response.');
    }

    return aiText;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    console.error('[gemini] API request failed:', error);
    throw new Error('Gemini request failed. Please try again.');
  }
}
