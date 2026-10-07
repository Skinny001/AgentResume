import { NextResponse } from 'next/server'
import { getAI } from '@/lib/gemini'

export async function GET() {
  const ai = getAI()
  const pager = await ai.models.list()
  const names: string[] = []
  for await (const m of pager) {
    if (m.supportedActions?.includes('generateContent')) names.push(m.name!)
  }
  return NextResponse.json(names)
}
