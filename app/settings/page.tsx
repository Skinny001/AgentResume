'use client'

import { Bell, Lock, Moon, Globe, ArrowUpRight } from 'lucide-react'

export default function SettingsPage() {
  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-[34px]">Settings</h1>
          <p className="mt-2 text-sm text-white/45">Manage your preferences and workspace configuration.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        <aside className="flex flex-col gap-1">
          {['General', 'Notifications', 'Privacy & Security', 'Billing'].map((tab, i) => (
            <button key={tab} className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-left transition-colors ${i === 0 ? 'bg-white/10 text-white font-medium' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </aside>

        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6">
            <div className="mb-6 border-b border-white/[0.07] pb-5">
              <h2 className="text-base font-semibold">Appearance</h2>
              <p className="mt-1 text-xs text-white/40">Customize how AgentResume looks on your device.</p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-white/[0.03] text-white/50">
                  <Moon className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Dark Mode</p>
                  <p className="text-[11px] text-white/40">Default premium aesthetic</p>
                </div>
              </div>
              <button className="relative h-5 w-9 rounded-full bg-[#d9f85a] transition-colors" aria-label="Toggle dark mode">
                <span className="absolute left-5 top-1 size-3 rounded-full bg-[#0b0e13] transition-all" />
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6">
            <div className="mb-6 border-b border-white/[0.07] pb-5">
              <h2 className="text-base font-semibold">Notifications</h2>
              <p className="mt-1 text-xs text-white/40">Control what alerts you receive.</p>
            </div>
            
            <div className="flex flex-col gap-5">
              {[
                { title: 'Agent Activity', desc: 'When your agent submits an application or drafts a letter.', active: true },
                { title: 'Application Updates', desc: 'When an employer views your application or shortlists you.', active: true },
                { title: 'Job Matches', desc: 'When a new on-chain job matches your skills perfectly.', active: false },
              ].map(notif => (
                <div key={notif.title} className="flex items-center justify-between">
                  <div className="pr-4">
                    <p className="text-sm font-medium">{notif.title}</p>
                    <p className="text-[11px] text-white/40">{notif.desc}</p>
                  </div>
                  <button className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${notif.active ? 'bg-[#d9f85a]' : 'bg-white/15'}`}>
                    <span className={`absolute top-1 size-3 rounded-full transition-all ${notif.active ? 'left-5 bg-[#0b0e13]' : 'left-1 bg-white/60'}`} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
