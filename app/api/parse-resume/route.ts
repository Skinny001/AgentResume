import { NextResponse } from 'next/server'
import { extractText, getDocumentProxy } from 'unpdf'
import { getAI, generateWithFallback } from '@/lib/gemini'

const PROMPT = `You are an expert resume parser. Extract the resume into JSON with this shape:
{
  "name": string,
  "email": string,
  "headline": string,
  "skills": string[],
  "experience": [{ "title": string, "company": string, "start": string, "end": string, "description": string }],
  "education": [{ "school": string, "degree": string, "year": string }]
}
Use empty strings or empty arrays for anything missing. Output JSON only.`

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const ai = getAI()

    // Extract text locally first (small request, fewer 503s)
    let text = ''
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      try {
        const pdf = await getDocumentProxy(new Uint8Array(buffer))
        const result = await extractText(pdf, { mergePages: true })
        text = result.text
      } catch {}
    }

    // Text found -> send text. Scanned PDF -> send the file itself.
    const contents =
      text.trim().length > 200
        ? [`${PROMPT}\n\nResume text:\n${text}`]
        : [PROMPT, { inlineData: { data: buffer.toString('base64'), mimeType: file.type || 'application/pdf' } }]

    const response = await generateWithFallback(ai, contents, {
      responseMimeType: 'application/json',
    })

    const parsed = JSON.parse(response.text ?? '{}')
    return NextResponse.json({ resume: parsed })
  } catch (error: any) {
    console.error('Parse Error:', error)
    const busy = error?.status === 503
    return NextResponse.json(
      { error: busy ? 'AI service is busy, please try again in a minute.' : error.message || 'Failed to parse resume' },
      { status: busy ? 503 : 500 }
    )
  }
}
