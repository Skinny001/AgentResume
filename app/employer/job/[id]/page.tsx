'use client'

import { useState, useEffect, use } from 'react'
import { ArrowLeft, Loader2, User, FileText } from 'lucide-react'
import Link from 'next/link'
import { useWeb3 } from '@/lib/web3'
import { getJobBoardContract } from '@/lib/contracts'
import { toast } from 'react-hot-toast'

export default function EmployerJobApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const jobId = parseInt(id)
  
  const { provider, signer } = useWeb3()
  const [job, setJob] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!provider) return
      try {
        const jobBoard = getJobBoardContract(provider)
        const j = await jobBoard.jobs(jobId)
        setJob(j)
        
        const apps = await jobBoard.applicationsForJob(jobId, 0, 100)
        setApplications(apps.slice().reverse()) // newest first
      } catch (err) {
        console.error("Failed to load applicants", err)
        toast.error("Failed to load applicants")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [provider, jobId])

  const handleUpdateStatus = async (appId: number, newStatus: number) => {
    if (!signer) return toast.error("Please connect wallet")
    try {
      const jobBoard = getJobBoardContract(signer)
      toast.loading("Updating status...", { id: 'status-tx' })
      const tx = await jobBoard.setStatus(appId, newStatus)
      await tx.wait()
      toast.success("Status updated!", { id: 'status-tx' })
      
      setApplications(prev => prev.map(a => Number(a.id) === appId ? { ...a, status: newStatus } : a))
    } catch (err: any) {
      toast.error("Update failed: " + (err.reason || err.message), { id: 'status-tx' })
    }
  }

  const getStatusBadge = (status: number) => {
    switch(status) {
      case 0: return <span className="rounded bg-blue-500/20 px-2 py-1 text-[10px] font-semibold text-blue-400">Submitted</span>
      case 1: return <span className="rounded bg-purple-500/20 px-2 py-1 text-[10px] font-semibold text-purple-400">Viewed</span>
      case 2: return <span className="rounded bg-yellow-500/20 px-2 py-1 text-[10px] font-semibold text-yellow-400">Shortlisted</span>
      case 3: return <span className="rounded bg-red-500/20 px-2 py-1 text-[10px] font-semibold text-red-400">Rejected</span>
      case 4: return <span className="rounded bg-green-500/20 px-2 py-1 text-[10px] font-semibold text-green-400">Hired</span>
      default: return null
    }
  }

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="size-8 animate-spin text-[#d9f85a]" /></div>
  }

  return (
    <>
      <div className="mb-6">
        <Link href="/employer" className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white transition">
          <ArrowLeft className="size-4" /> Back to Employer Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">Applicants for {job?.title}</h1>
        <p className="mt-2 text-sm text-white/50">{applications.length} total applications</p>
      </div>

      <div className="grid gap-4">
        {applications.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#10141b] py-20 text-center text-sm text-white/50">
            No applications yet.
          </div>
        ) : (
          applications.map(app => (
            <div key={Number(app.id)} className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6">
              <div className="flex items-center justify-between border-b border-white/[0.05] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-white/5">
                    <User className="size-5 text-white/40" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">{app.applicant.slice(0,6)}...{app.applicant.slice(-4)}</h3>
                    <p className="text-[11px] text-white/40">Applied {new Date(Number(app.submittedAt) * 1000).toLocaleDateString()}</p>
                  </div>
                </div>
                {getStatusBadge(Number(app.status))}
              </div>
              
              <div>
                <h4 className="mb-2 text-xs font-semibold text-white/60">Cover Letter (IPFS)</h4>
                <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs text-white/70">
                  <FileText className="size-4 text-[#d9f85a]" />
                  <a href={`https://gateway.pinata.cloud/ipfs/${app.coverLetterCid}`} target="_blank" rel="noreferrer" className="text-white hover:text-[#d9f85a] hover:underline transition-colors">
                    View full Cover Letter document on IPFS ↗
                  </a>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button onClick={() => handleUpdateStatus(Number(app.id), 2)} className="rounded-lg bg-yellow-500/10 px-4 py-2 text-xs font-semibold text-yellow-500 hover:bg-yellow-500/20 transition-colors">Shortlist</button>
                <button onClick={() => handleUpdateStatus(Number(app.id), 4)} className="rounded-lg bg-green-500/10 px-4 py-2 text-xs font-semibold text-green-500 hover:bg-green-500/20 transition-colors">Hire</button>
                <button onClick={() => handleUpdateStatus(Number(app.id), 3)} className="rounded-lg bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/20 transition-colors">Reject</button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}
