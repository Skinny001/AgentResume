'use client'

import { useState, useEffect, use } from 'react'
import { ArrowLeft, Loader2, Sparkles, Send, FileText } from 'lucide-react'
import Link from 'next/link'
import { useWeb3 } from '@/lib/web3'
import { getJobBoardContract, getRegistryContract } from '@/lib/contracts'
import { ethers } from 'ethers'
import { toast } from 'react-hot-toast'

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const jobId = parseInt(id)
  
  const { provider, signer, address } = useWeb3()
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [isDrafting, setIsDrafting] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  
  useEffect(() => {
    async function loadJob() {
      const rpcProvider = provider || new ethers.JsonRpcProvider('https://rpc.bohr.life')
      const jobBoard = getJobBoardContract(rpcProvider)
      try {
        const j = await jobBoard.jobs(jobId)
        setJob(j)
      } catch (err) {
        console.error("Failed to load job", err)
      } finally {
        setLoading(false)
      }
    }
    loadJob()
  }, [provider, jobId])

  const handleDraftAI = async () => {
    if (!address || !provider) return toast.error("Connect wallet to use AI Agent")
    setIsDrafting(true)
    try {
      const registry = getRegistryContract(provider)
      const profile = await registry.getProfile(address)
      
      const res = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: profile.headline,
          skills: profile.skills.join(', '),
          jobTitle: job.title,
          jobCompany: job.company
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setCoverLetter(data.coverLetter)
    } catch (err: any) {
      toast.error("AI Error: " + err.message)
    } finally {
      setIsDrafting(false)
    }
  }

  const handleApply = async () => {
    if (!signer) return toast.error("Connect wallet to apply")
    if (!coverLetter) return toast.error("Draft a cover letter first")
    
    setIsApplying(true)
    try {
      const jobBoard = getJobBoardContract(signer)
      // Mock IPFS upload for the cover letter
      const cid = "QmMockCoverLetterHash"
      const docHash = ethers.id(coverLetter)
      
      toast.loading("Submitting application...", { id: 'apply-tx' })
      const tx = await jobBoard.applyDirect(jobId, cid, docHash)
      await tx.wait()
      toast.success("Application submitted successfully on-chain!", { id: 'apply-tx' })
    } catch (err: any) {
      toast.error("Application failed: " + (err.reason || err.message), { id: 'apply-tx' })
    } finally {
      setIsApplying(false)
    }
  }

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="size-8 animate-spin text-[#d9f85a]" /></div>
  }

  if (!job || !job.title) {
    return <div className="py-20 text-center text-white/50">Job not found.</div>
  }

  return (
    <>
      <div className="mb-6">
        <Link href="/jobs" className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white transition">
          <ArrowLeft className="size-4" /> Back to jobs
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Job Info */}
        <section className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-500 text-xl font-bold">
              {job.company.charAt(0)}
            </div>
            <span className="rounded-md bg-white/[0.05] px-2.5 py-1.5 text-xs text-white/60">Posted recently</span>
          </div>
          
          <h1 className="mb-2 text-2xl font-semibold sm:text-3xl">{job.title}</h1>
          <p className="mb-6 text-sm text-white/50">{job.company} · Remote · Web3</p>
          
          <div className="prose prose-invert max-w-none text-sm text-white/70">
            <p>We are looking for an experienced {job.title} to join our core team...</p>
            <h3>Requirements</h3>
            <ul>
              <li>Deep understanding of the Ethereum Virtual Machine (EVM).</li>
              <li>Strong problem-solving skills and self-direction.</li>
              <li>Familiarity with standard security practices.</li>
            </ul>
          </div>
        </section>

        {/* Action Panel */}
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6">
            <h2 className="mb-4 font-semibold">Apply for this role</h2>
            
            <button 
              onClick={handleDraftAI}
              disabled={isDrafting}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.05] px-4 py-3 text-sm font-medium transition hover:bg-white/10 disabled:opacity-50"
            >
              {isDrafting ? <Loader2 className="size-4 animate-spin text-[#d9f85a]" /> : <Sparkles className="size-4 text-[#d9f85a]" />}
              {isDrafting ? 'Agent is thinking...' : 'Draft Cover Letter with Agent'}
            </button>

            <div className="mb-4">
              <label className="mb-2 flex items-center gap-2 text-xs text-white/60">
                <FileText className="size-3" /> Cover Letter
              </label>
              <textarea 
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                placeholder="Your cover letter will appear here..."
                className="h-[250px] w-full resize-none rounded-xl border border-white/10 bg-white/[0.02] p-3.5 text-xs text-white placeholder:text-white/20 focus:border-[#d9f85a] focus:outline-none"
              />
            </div>

            <button 
              onClick={handleApply}
              disabled={isApplying || !coverLetter}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d9f85a] px-4 py-3 text-sm font-semibold text-[#0b0e13] transition hover:bg-[#c2e04d] disabled:opacity-50"
            >
              {isApplying ? <Loader2 className="size-4 animate-spin text-[#0b0e13]" /> : <Send className="size-4" />}
              {isApplying ? 'Submitting to Chain...' : 'Apply Directly'}
            </button>
          </section>
        </div>
      </div>
    </>
  )
}
