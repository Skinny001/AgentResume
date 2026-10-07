'use client'

import { useState, useEffect } from 'react'
import { BriefcaseBusiness, Plus, Loader2, Users, Check } from 'lucide-react'
import Link from 'next/link'
import { useWeb3 } from '@/lib/web3'
import { getJobBoardContract } from '@/lib/contracts'
import { ethers } from 'ethers'
import { toast } from 'react-hot-toast'

export default function EmployerPage() {
  const { provider, signer, address } = useWeb3()
  
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [description, setDescription] = useState('')
  
  const [isPosting, setIsPosting] = useState(false)
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [myJobs, setMyJobs] = useState<any[]>([])

  useEffect(() => {
    async function loadMyJobs() {
      if (!address || !provider) {
        setLoadingJobs(false)
        return
      }
      try {
        const jobBoard = getJobBoardContract(provider)
        // Fetch all jobs and filter for current user
        // Note: For a production app with thousands of jobs, we would use an indexer
        const allJobs = await jobBoard.listJobs(0, 100)
        
        const filtered = allJobs
          .filter((j: any) => j.employer.toLowerCase() === address.toLowerCase())
          .map((j: any) => ({
            id: Number(j.id),
            title: j.title,
            company: j.company,
            open: j.open
          }))
          
        setMyJobs(filtered.reverse()) // newest first
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingJobs(false)
      }
    }
    loadMyJobs()
  }, [address, provider])

  const handlePostJob = async () => {
    if (!signer) return toast.error("Please connect wallet")
    if (!title || !company || !description) return toast.error("Please fill all fields")
    
    setIsPosting(true)
    try {
      const jobBoard = getJobBoardContract(signer)
      
      // We use mock IPFS CIDs for now
      const cid = "QmMockJobDescHash"
      const docHash = ethers.id(description)
      const closesAt = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // Closes in 30 days
      
      toast.loading("Confirming transaction...", { id: 'job-tx' })
      const tx = await jobBoard.postJob(title, company, cid, docHash, closesAt)
      await tx.wait()
      toast.success("Job posted on-chain successfully!", { id: 'job-tx' })
      
      setTitle('')
      setCompany('')
      setDescription('')
      setTimeout(() => window.location.reload(), 1500)
    } catch (err: any) {
      toast.error("Failed to post job: " + (err.reason || err.message), { id: 'job-tx' })
    } finally {
      setIsPosting(false)
    }
  }

  if (!address) {
    return <div className="py-20 text-center text-white/50">Please connect your wallet to access the Employer Dashboard.</div>
  }

  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-[34px]">Employer Dashboard</h1>
          <p className="mt-2 text-sm text-white/45">Post jobs to the on-chain registry and manage applications.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Post Job Form */}
        <section className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6">
          <h2 className="mb-6 font-semibold">Post a New Role</h2>
          <div className="grid gap-5">
            <div>
              <label className="mb-2 block text-xs text-white/60">Job Title</label>
              <input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="e.g. Senior Smart Contract Engineer" 
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-[#d9f85a] focus:outline-none transition-colors" 
              />
            </div>
            <div>
              <label className="mb-2 block text-xs text-white/60">Company Name</label>
              <input 
                value={company} 
                onChange={e => setCompany(e.target.value)} 
                placeholder="e.g. Protocol Labs" 
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-[#d9f85a] focus:outline-none transition-colors" 
              />
            </div>
            <div>
              <label className="mb-2 block text-xs text-white/60">Full Job Description</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Describe the role, requirements, and benefits..." 
                className="h-32 w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] p-3.5 text-sm text-white placeholder:text-white/20 focus:border-[#d9f85a] focus:outline-none transition-colors" 
              />
            </div>
            
            <div className="mt-2 flex justify-end border-t border-white/[0.07] pt-5">
              <button 
                onClick={handlePostJob}
                disabled={isPosting || !title || !company || !description}
                className="flex items-center gap-2 rounded-lg bg-[#d9f85a] px-5 py-2.5 text-xs font-semibold text-[#0b0e13] hover:bg-[#c2e04d] transition-colors disabled:opacity-50"
              >
                {isPosting ? <Loader2 className="size-4 animate-spin text-[#0b0e13]" /> : <Plus className="size-4" />}
                {isPosting ? 'Confirming Tx...' : 'Post Job On-Chain'}
              </button>
            </div>
          </div>
        </section>

        {/* My Jobs List */}
        <section className="flex flex-col gap-4">
          <div className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6">
            <h2 className="mb-4 font-semibold">Your Active Listings</h2>
            {loadingJobs ? (
              <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-[#d9f85a]" /></div>
            ) : myJobs.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-6">You haven't posted any jobs yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {myJobs.map(job => (
                  <div key={job.id} className="flex flex-col gap-2 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">{job.title}</h3>
                      <span className="flex items-center gap-1 rounded-md bg-[#d9f85a]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#d9f85a]">
                        Open
                      </span>
                    </div>
                    <p className="text-xs text-white/40">{job.company}</p>
                    <div className="mt-2 flex justify-end">
                      <Link href={`/employer/job/${job.id}`} className="flex items-center gap-1 text-[11px] text-[#d9f85a] hover:text-[#c2e04d] transition-colors">
                        <Users className="size-3" /> View Applicants
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
