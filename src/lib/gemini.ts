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

const MODEL = 'gemini-3.8-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

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
    return 'API key is missing. Please set VITE_GEMINI_API_KEY in your .env file.';
  }

  const contents = [
    ...history.map(msg => ({ role: msg.role, parts: [{ text: msg.text }] })),
    { role: 'user' as const, parts: [{ text: userPrompt }] },
  ];

  const body = {
    contents,
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
  };

  let response: Response;
  try {
    response = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new Error('Could not reach the Gemini API. Check your internet connection and try again.');
  }

  if (response.status !== 200) {
    const errorBody = await response.text().catch(() => '');
    console.error('[gemini] API error', response.status, errorBody.slice(0, 500));
    let detail = '';
    try {
      const parsed = JSON.parse(errorBody);
      detail = parsed?.error?.message ?? '';
    } catch { /* not JSON */ }
    throw new Error(
      `Gemini API error (${response.status})${detail ? `: ${detail}` : ''}. Please try again.`,
    );
  }

  const data = await response.json();
  const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!aiText || typeof aiText !== 'string') {
    throw new Error('Gemini returned an empty response. Please try rephrasing your question.');
  }

  return aiText;
}
