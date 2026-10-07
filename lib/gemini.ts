import { GoogleGenAI } from '@google/genai'

export const MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
]

export function getAI() {
  const key = process.env.GEMINI_API_KEY
  if (!key || key === 'your_gemini_api_key_here') {
    throw Object.assign(new Error('Missing GEMINI_API_KEY in .env.local'), { status: 500 })
  }
  return new GoogleGenAI({ apiKey: key })
}

export async function generateWithFallback(
  ai: GoogleGenAI,
  contents: any,
  config?: Record<string, any>
) {
  let lastError: any
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        return await ai.models.generateContent({ model, contents, config })
      } catch (err: any) {
        lastError = err
        console.error(`[gemini] ${model} attempt ${attempt + 1} failed:`, err?.status, err?.message?.slice(0, 200))
        if (err?.status === 503) {
          await new Promise(r => setTimeout(r, 2000 * 2 ** attempt + Math.random() * 500))
          continue
        }
        break // 404/429/etc: move to next model
      }
    }
  }
  throw lastError
}
