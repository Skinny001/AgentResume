import { NextResponse } from 'next/server'
import { getAI, generateWithFallback } from '@/lib/gemini'

export async function POST(req: Request) {
  try {
    const { headline, skills, jobTitle, jobCompany, jobDescription } = await req.json()

    const ai = getAI()

    const prompt = `
      You are an expert AI agent writing a cover letter for a candidate.
      
      Candidate Profile:
      Headline: ${headline || 'Software Engineer'}
      Skills: ${skills || 'Not specified'}
      
      Job Details:
      Title: ${jobTitle}
      Company: ${jobCompany}
      Description: ${jobDescription || "No detailed description provided. Make assumptions based on the title."}
      
      Write a concise, highly professional, and compelling cover letter (max 3 paragraphs) applying for this job.
      Focus heavily on how the candidate's specific skills align with a web3/crypto company.
      Do not include placeholder brackets like [Your Name], just write the letter body.
    `

    const response = await generateWithFallback(ai, prompt)

    return NextResponse.json({ coverLetter: response.text })
  } catch (error: any) {
    console.error("AI Draft Error:", error)
    return NextResponse.json({ error: error.message || "Failed to generate cover letter" }, { status: 500 })
  }
}
