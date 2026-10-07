import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const data = await req.json()
    
    if (!process.env.PINATA_JWT || process.env.PINATA_JWT === 'your_pinata_jwt_here') {
      return NextResponse.json({ error: "Missing PINATA_JWT in .env.local" }, { status: 500 })
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PINATA_JWT}`
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: { name: 'agent-resume-doc.json' }
      })
    })

    if (!response.ok) {
      const detail = await response.text()
      console.error('Pinata error:', response.status, detail)
      throw new Error(`Pinata ${response.status}: ${detail}`)
    }

    const result = await response.json()
    return NextResponse.json({
      cid: result.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
    })
  } catch (error: any) {
    console.error("IPFS Upload Error:", error)
    return NextResponse.json({ error: error.message || "Failed to upload to IPFS" }, { status: 500 })
  }
}
