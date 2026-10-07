'use client'

import { useState, useEffect } from 'react'
import { FileText, ArrowUpRight, ShieldCheck, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useWeb3 } from '@/lib/web3'
import { getJobBoardContract } from '@/lib/contracts'
import { ethers } from 'ethers'

export default function ApplicationsPage() {
  const { provider, address } = useWeb3()
  const [myApplications, setMyApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const statusMap = ['Submitted', 'Viewed', 'Shortlisted', 'Rejected', 'Hired']

  useEffect(() => {
    async function loadApps() {
      if (!address || !provider) {
        setLoading(false)
        return
      }
      try {
        const jobBoard = getJobBoardContract(provider)
        const apps = await jobBoard.applicationsOf(address, 0, 100)
        
        const formatted = await Promise.all(apps.map(async (app: any) => {
          // Fetch job details to get title and company
          // Ideally JobBoard should return basic job info, but here we query individually
          let jobTitle = "Job #" + app.jobId
          let company = "Unknown Company"
          try {
            const jobDetails = await jobBoard.jobs(app.jobId)
            jobTitle = jobDetails.title
            company = jobDetails.company
          } catch(e) {}
          
          return {
            id: Number(app.id),
            jobTitle,
            company,
            status: statusMap[app.status] || 'Submitted',
            date: new Date(Number(app.submittedAt) * 1000).toLocaleDateString(),
            agent: app.submittedBy.toLowerCase() !== address.toLowerCase(),
            coverLetterCid: app.coverLetterCid
          }
        }))
        
        setMyApplications(formatted)
      } catch (err) {
        console.error("Failed to load applications", err)
      } finally {
        setLoading(false)
      }
    }
    loadApps()
  }, [address, provider])

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="size-8 animate-spin text-[#d9f85a]" /></div>
  }

  if (!address) {
    return <div className="py-20 text-center text-white/50">Please connect your wallet to view applications.</div>
  }

  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-[34px]">My Applications</h1>
          <p className="mt-2 text-sm text-white/45">Track the status of your on-chain job applications.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <section className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6">
          <div className="flex flex-col gap-4">
            {myApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="mb-4 size-10 text-white/20" />
                <h3 className="text-base font-medium">No applications yet</h3>
                <p className="mt-1 text-sm text-white/40">You haven't applied to any jobs yet.</p>
                <Link href="/jobs" className="mt-4 rounded-lg bg-[#d9f85a] px-4 py-2 text-xs font-semibold text-[#0b0e13] hover:bg-[#c2e04d] transition">
                  Browse Jobs
                </Link>
              </div>
            ) : (
              myApplications.map(app => (
                <div key={app.id} className="flex flex-col gap-4 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">{app.jobTitle}</h3>
                      {app.agent && (
                        <span className="flex items-center gap-1 rounded-md bg-[#d9f85a]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#d9f85a]">
                          Agent Submitted
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-white/40">{app.company}</p>
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-white/30">
                      <span>Applied: {app.date}</span>
                      <span className="flex items-center gap-1"><ShieldCheck className="size-3" /> On-chain</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <span className={`rounded-md px-2.5 py-1 text-[11px] font-medium
                      ${app.status === 'Submitted' ? 'bg-white/10 text-white' : ''}
                      ${app.status === 'Viewed' ? 'bg-blue-500/10 text-blue-400' : ''}
                      ${app.status === 'Shortlisted' ? 'bg-[#d9f85a]/10 text-[#d9f85a]' : ''}
                      ${app.status === 'Rejected' ? 'bg-red-500/10 text-red-400' : ''}
                      ${app.status === 'Hired' ? 'bg-green-500/10 text-green-400' : ''}
                    `}>
                      {app.status}
                    </span>
                    <a href={`https://gateway.pinata.cloud/ipfs/${app.coverLetterCid}`} target="_blank" rel="noreferrer" className="text-[11px] text-white/40 hover:text-[#d9f85a] transition-colors">
                      View cover letter <ArrowUpRight className="ml-0.5 inline size-3" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <div className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-5">
            <h3 className="font-semibold mb-4 text-sm">Application Stats</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span>Success Rate (Shortlisted)</span>
                  <span className="text-white">
                    {myApplications.length ? Math.round((myApplications.filter(a => a.status === 'Shortlisted' || a.status === 'Hired').length / myApplications.length) * 100) : 0}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#d9f85a] rounded-full" style={{ width: `${myApplications.length ? (myApplications.filter(a => a.status === 'Shortlisted' || a.status === 'Hired').length / myApplications.length) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg bg-white/[0.03] p-3 text-center">
                  <p className="text-xl font-semibold">{myApplications.filter(a => a.agent).length}</p>
                  <p className="text-[10px] text-white/40">Agent apps</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] p-3 text-center">
                  <p className="text-xl font-semibold">{myApplications.filter(a => !a.agent).length}</p>
                  <p className="text-[10px] text-white/40">Manual apps</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
