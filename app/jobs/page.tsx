'use client'

import { useState, useEffect } from 'react'
import { BriefcaseBusiness, Search, ArrowUpRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useWeb3 } from '@/lib/web3'
import { getJobBoardContract } from '@/lib/contracts'
import { ethers } from 'ethers'

export default function JobsPage() {
  const [search, setSearch] = useState('')
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { provider } = useWeb3()
  
  useEffect(() => {
    async function loadJobs() {
      // Use fallback provider if not connected so we can still view jobs
      const rpcProvider = provider || new ethers.JsonRpcProvider('https://rpc.bohr.life')
      const jobBoard = getJobBoardContract(rpcProvider)
      
      try {
        const jobsData = await jobBoard.listJobs(0, 50)
        const formattedJobs = jobsData.map((job: any) => ({
          id: Number(job.id),
          title: job.title,
          company: job.company,
          location: 'On-chain', // Missing in struct, mocked for UI
          salary: 'TBD', // Missing in struct, mocked for UI
          tags: ['Web3', 'Blockchain'], // Missing in struct, mocked for UI
          posted: new Date().toLocaleDateString(), // Simplification
          logo: job.company.charAt(0).toUpperCase(),
          color: 'bg-blue-500', // Random color could be generated
          open: job.open
        })).filter((j: any) => j.open)
        setJobs(formattedJobs)
      } catch (err) {
        console.error("Failed to load jobs:", err)
      } finally {
        setLoading(false)
      }
    }
    
    loadJobs()
  }, [provider])

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(search.toLowerCase()) || 
    job.company.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-[34px]">Job Board</h1>
          <p className="mt-2 text-sm text-white/45">Find web3 roles that match your verified profile.</p>
        </div>
      </div>
       
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, company, or keyword..." 
            className="w-full rounded-xl border border-white/10 bg-[#10141b] py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-[#d9f85a] focus:outline-none transition-colors"
          />
        </div>
        <button className="rounded-xl border border-white/10 bg-[#10141b] px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/[0.05] transition-colors">
          Filters
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-8 animate-spin text-[#d9f85a]" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-12 text-white/50">
          No open jobs found on the network.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map(job => (
            <Link href={`/jobs/${job.id}`} key={job.id} className="group flex flex-col rounded-2xl border border-white/[0.08] bg-[#10141b] p-5 transition-colors hover:bg-white/[0.03]">
              <div className="mb-4 flex items-center justify-between">
                <div className={`flex size-11 items-center justify-center rounded-xl text-sm font-bold ${job.color}`}>
                  {job.logo}
                </div>
                <ArrowUpRight className="size-4 text-white/20 transition-colors group-hover:text-[#d9f85a]" />
              </div>
              
              <h3 className="mb-1 text-base font-semibold">{job.title}</h3>
              <p className="text-xs text-white/45">{job.company}</p>
              
              <div className="mt-4 flex flex-wrap gap-1.5">
                {job.tags.map((tag: string) => (
                  <span key={tag} className="rounded-md bg-white/[0.05] px-2 py-1 text-[10px] text-white/60">{tag}</span>
                ))}
              </div>
              
              <div className="mt-6 flex items-center justify-between border-t border-white/[0.05] pt-4 text-xs">
                <span className="font-medium text-white/80">{job.salary}</span>
                <span className="text-white/30">{job.posted}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
