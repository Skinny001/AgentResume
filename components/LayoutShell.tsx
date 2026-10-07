'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useWeb3 } from '@/lib/web3'
import { LayoutDashboard, UserRound, BriefcaseBusiness, FileText, Sparkles, Settings2, ArrowUpRight, Wallet, Menu, ShieldCheck, GitBranch, Check } from 'lucide-react'

const navItems: { label: string, icon: any, href: string, count?: string | number }[] = [
  { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'My profile', icon: UserRound, href: '/profile' },
  { label: 'Job board', icon: BriefcaseBusiness, href: '/jobs' },
  { label: 'Applications', icon: FileText, href: '/applications' },
  { label: 'Employer', icon: BriefcaseBusiness, href: '/employer' },
  { label: 'Agent', icon: Sparkles, href: '/agent' }
]

function Brand() { 
  return (
    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      <img src="/AgentResume.jpeg" alt="AgentResume Logo" className="size-8 rounded-lg object-cover" />
      <span className="text-[17px] font-semibold tracking-[-0.03em] text-white">Agent<span className="text-[#d9f85a]">Resume</span></span>
    </Link>
  ) 
}

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { address, connect, disconnect, isConnecting, chainId } = useWeb3()

  const activeItem = navItems.find(item => item.href === pathname) || navItems[0]
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''

  if (pathname === '/') {
    return <div className="min-h-screen bg-[#0b0e13] text-white">{children}</div>
  }

  return (
    <div className="min-h-screen bg-[#0b0e13] text-white">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[244px] flex-col border-r border-white/[0.07] bg-[#0d1016] lg:flex">
        <div className="flex h-[74px] items-center border-b border-white/[0.07] px-6"><Brand /></div>
        <div className="flex flex-1 flex-col px-3 py-6">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Workspace</p>
          <nav className="flex flex-col gap-1">
            {navItems.map(({ label, icon: Icon, href, count }) => {
              const isActive = pathname === href
              return (
                <Link key={label} href={href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition ${isActive ? 'bg-white/[0.09] text-white' : 'text-white/50 hover:bg-white/[0.05] hover:text-white'}`}>
                  <Icon className={`size-[17px] ${isActive ? 'text-[#d9f85a]' : ''}`} />
                  <span className="flex-1 text-left">{label}</span>
                  {count && <span className="rounded-md bg-[#d9f85a]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#d9f85a]">{count}</span>}
                </Link>
              )
            })}
          </nav>
          <p className="mb-3 mt-9 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Account</p>
          <Link href="/settings" className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition ${pathname === '/settings' ? 'bg-white/[0.09] text-white' : 'text-white/50 hover:bg-white/[0.05] hover:text-white'}`}>
            <Settings2 className={`size-[17px] ${pathname === '/settings' ? 'text-[#d9f85a]' : ''}`} /> Settings
          </Link>
          <div className="mt-auto rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] text-white/45">Network</span>
              <span className="flex items-center gap-1.5 text-[10px] text-[#d9f85a]">
                <span className={`size-1.5 rounded-full ${chainId === 968 ? 'bg-[#d9f85a]' : 'bg-orange-400'}`} /> {chainId === 968 ? 'BOT Testnet' : (chainId ? 'Wrong Network' : 'Not Connected')}
              </span>
            </div>
            {address && <p className="mb-1 font-mono text-[11px] text-white/70">{shortAddress}</p>}
            <button onClick={address ? disconnect : connect} className="text-[11px] text-white/35 hover:text-white transition-colors">
              {address ? 'Disconnect wallet' : 'Connect wallet'} <ArrowUpRight className="ml-0.5 inline size-3" />
            </button>
          </div>
        </div>
      </aside>

      <section className="lg:pl-[244px]">
        <header className="flex h-[74px] items-center justify-between border-b border-white/[0.07] px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <Menu className="size-5 text-white/60 lg:hidden" />
            <div className="lg:hidden"><Brand /></div>
            <div className="hidden items-center gap-2 text-[13px] text-white/35 lg:flex">
              <span>Workspace</span><span>/</span><span className="text-white/70">{activeItem.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {address && (
              <button className="hidden items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 sm:flex">
                <GitBranch className="size-3.5" /> {shortAddress}
              </button>
            )}
            <button 
              onClick={address ? disconnect : connect} 
              disabled={isConnecting}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${address ? 'bg-white/[0.05] text-white hover:bg-white/10' : 'bg-[#d9f85a] text-[#0b0e13] hover:bg-[#c2e04d]'}`}
            >
              {isConnecting ? <div className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Wallet className="size-3.5" />}
              {address ? 'Connected' : (isConnecting ? 'Connecting...' : 'Connect wallet')}
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1230px] px-5 py-8 sm:px-8 lg:px-10">
          {children}
        </div>
      </section>
    </div>
  )
}
