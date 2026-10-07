'use client'

import { useState, useEffect } from 'react'
import { Activity, ArrowUpRight, Check, CircleDollarSign, FileText, ShieldCheck, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useWeb3 } from '@/lib/web3'
import { getRegistryContract, getJobBoardContract } from '@/lib/contracts'
import { ethers } from 'ethers'

export default function Page() {
  const { provider, address } = useWeb3()
  
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [escrow, setEscrow] = useState('0.0')
  const [jobs, setJobs] = useState<any[]>([])
  const [agentActive, setAgentActive] = useState(false)

  useEffect(() => {
    async function loadDashboard() {
      if (!address || !provider) {
        setLoading(false)
        return
      }
      try {
        const registry = getRegistryContract(provider)
        const jobBoard = getJobBoardContract(provider)

        const [prof, apps, bal, activeDelegation, allJobs] = await Promise.all([
          registry.getProfile(address),
          jobBoard.applicationsOf(address, 0, 100),
          jobBoard.balances(address),
          jobBoard.delegations(address),
          jobBoard.listJobs(0, 3)
        ])

        if (prof.exists) setProfile(prof)
        setApplications(apps)
        setEscrow(ethers.formatUnits(bal, 6))
        setAgentActive(activeDelegation.active)
        
        setJobs(allJobs.map((job: any) => ({
          id: Number(job.id),
          title: job.title,
          company: job.company,
          location: 'Remote',
          salary: 'TBD',
          tags: ['Web3'],
          posted: 'Recently',
          logo: job.company.charAt(0),
          color: 'bg-blue-500'
        })))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [address, provider])

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="size-8 animate-spin text-[#d9f85a]" /></div>
  }

  if (!address) {
    return <div className="py-20 text-center text-white/50">Please connect your wallet to view your dashboard.</div>
  }

  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-medium text-[#d9f85a]">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-[34px]">Welcome back<span className="text-white/35">.</span></h1>
          <p className="mt-2 text-sm text-white/45">Your career, verified and working for you.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={ShieldCheck} label="Profile status" value={profile ? 'Verified' : 'Missing'} detail={profile ? `Updated on-chain` : 'Please create profile'} accent="lime" />
        <Stat icon={FileText} label="Applications" value={applications.length.toString()} detail="Lifetime on-chain" accent="blue" />
        <Stat icon={CircleDollarSign} label="Agent escrow" value={`${escrow} USDT`} detail={agentActive ? 'Agent is active' : 'Agent inactive'} accent="violet" />
        <Stat icon={Activity} label="Profile views" value="0" detail="Analytics coming soon" accent="orange" />
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Latest Jobs</h2>
              <p className="mt-1 text-xs text-white/40">From the on-chain registry</p>
            </div>
            <Link href="/jobs" className="text-xs font-medium text-[#d9f85a] hover:underline">
              View all <ArrowUpRight className="ml-1 inline size-3" />
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-white/[0.07]">
            {jobs.length === 0 ? (
              <p className="py-4 text-xs text-white/40">No jobs posted yet.</p>
            ) : jobs.map(job => (
              <div key={job.title} className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${job.color}`}>{job.logo}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-medium">{job.title}</h3>
                    <span className="text-[10px] text-white/30">{job.posted}</span>
                  </div>
                  <p className="mt-1 text-xs text-white/42">{job.company} <span className="mx-1 text-white/20">·</span> {job.location}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {job.tags.map((tag: string) => <span key={tag} className="rounded-md bg-white/[0.06] px-2 py-1 text-[10px] text-white/55">{tag}</span>)}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <span className="text-xs font-medium text-white/70">{job.salary}</span>
                  <Link href={`/jobs/${job.id}`} className="rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] text-white/60 hover:bg-white/[0.05] transition">View job</Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Agent activity</h2>
              <p className="mt-1 text-xs text-white/40">Your delegated assistant</p>
            </div>
          </div>
          <div className={`mb-6 rounded-xl border p-3.5 ${agentActive ? 'border-[#d9f85a]/15 bg-[#d9f85a]/[0.05]' : 'border-white/10 bg-white/5'}`}>
            <div className="flex items-center gap-2">
              <Sparkles className={`size-4 ${agentActive ? 'text-[#d9f85a]' : 'text-white/40'}`} />
              <span className="text-xs font-medium">Agent is {agentActive ? 'active' : 'paused'}</span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-white/45">
              {agentActive ? 'Watching for roles that match your profile.' : 'Your agent is paused or not authorized yet.'}
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <p className="text-xs text-white/30">Recent activity will appear here.</p>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Your profile</h2>
              <p className="mt-1 text-xs text-white/40">What employers see</p>
            </div>
            <Link href="/profile" className="text-xs text-white/40 hover:text-white">Edit <ArrowUpRight className="ml-1 inline size-3" /></Link>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-[#d9f85a] text-sm font-bold text-[#0b0e13]">AR</div>
            <div>
              <p className="text-sm font-medium">Anonymous</p>
              <p className="text-xs text-white/40">{profile?.headline || 'No headline set'}</p>
            </div>
            {profile && (
              <span className="ml-auto flex items-center gap-1 rounded-full bg-[#d9f85a]/10 px-2 py-1 text-[10px] text-[#d9f85a]">
                <ShieldCheck className="size-3" /> Verified
              </span>
            )}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {(profile?.skills || []).map((tag: string) => (
              <span key={tag} className="rounded-md bg-white/[0.06] px-2.5 py-1.5 text-[10px] text-white/60">{tag}</span>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Application pipeline</h2>
              <p className="mt-1 text-xs text-white/40">Your current job search at a glance</p>
            </div>
            <Link href="/applications" className="text-xs text-white/40 hover:text-white">
              See applications <ArrowUpRight className="ml-1 inline size-3" />
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[['Total', applications.length], ['Agent', applications.filter((a: any) => a.submittedBy.toLowerCase() !== address?.toLowerCase()).length], ['Manual', applications.filter((a: any) => a.submittedBy.toLowerCase() === address?.toLowerCase()).length], ['Shortlisted', applications.filter((a: any) => a.status === 2).length]].map(([label, value]) => (
              <div key={label.toString()} className="rounded-xl bg-white/[0.035] p-3">
                <p className="text-xl font-semibold">{value}</p>
                <p className="mt-1 text-[10px] text-white/35">{label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}

function Stat({ icon: Icon, label, value, detail, accent }: { icon: typeof ShieldCheck; label: string; value: string; detail: string; accent: string }) { 
  const colors: Record<string, string> = { 
    lime: 'text-[#d9f85a] bg-[#d9f85a]/10', 
    blue: 'text-blue-300 bg-blue-300/10', 
    violet: 'text-violet-300 bg-violet-300/10', 
    orange: 'text-orange-300 bg-orange-300/10' 
  }; 
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs text-white/40">{label}</span>
        <span className={`flex size-7 items-center justify-center rounded-lg ${colors[accent]}`}>
          <Icon className="size-3.5" />
        </span>
      </div>
      <p className="text-xl font-semibold tracking-[-0.04em]">{value}</p>
      <p className="mt-1 text-[11px] text-white/35">{detail}</p>
    </div>
  ) 
}
