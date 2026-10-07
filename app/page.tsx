import Link from 'next/link'
import { Sparkles, ShieldCheck, FileText, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between px-6 py-6 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <img src="/AgentResume.jpeg" alt="AgentResume Logo" className="size-8 rounded-lg object-cover" />
          <span className="text-lg font-semibold tracking-[-0.03em] text-white">Agent<span className="text-[#d9f85a]">Resume</span></span>
        </div>
        <Link 
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-colors"
        >
          Launch App <ArrowRight className="size-4" />
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-10 rounded-full bg-[#d9f85a]/10 border border-[#d9f85a]/20 text-[#d9f85a] text-xs font-semibold">
          <Sparkles className="size-3" />
          <span>AgentResume is live on BOT Chain Testnet</span>
        </div>
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl mb-8">
          The AI Agent for your <br /> <span className="text-[#d9f85a]">On-Chain Career</span>
        </h1>
        <p className="max-w-2xl text-lg text-white/60 mb-12 leading-relaxed">
          Upload your resume, mint it as an immutable profile on BOT Chain, and let our AI Agent automatically draft hyper-personalized cover letters and apply to Web3 jobs on your behalf.
        </p>
        
        <Link 
          href="/dashboard"
          className="flex items-center justify-center gap-2 rounded-xl bg-[#d9f85a] px-8 py-4 text-base font-bold text-[#0b0e13] hover:bg-[#c2e04d] transition-colors shadow-[0_0_40px_-10px_rgba(217,248,90,0.3)]"
        >
          Launch App <ArrowRight className="size-5" />
        </Link>
        
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl text-left">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 hover:bg-white/[0.07] transition-colors">
            <ShieldCheck className="size-8 text-blue-400 mb-5" />
            <h3 className="text-lg font-semibold mb-3">1. Mint Your Profile</h3>
            <p className="text-sm text-white/50 leading-relaxed">Upload your PDF resume. Our AI extracts your skills and pins the JSON to IPFS, hashing it securely to the blockchain.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 hover:bg-white/[0.07] transition-colors">
            <FileText className="size-8 text-violet-400 mb-5" />
            <h3 className="text-lg font-semibold mb-3">2. Browse Jobs</h3>
            <p className="text-sm text-white/50 leading-relaxed">Explore Web3 job listings posted by verified employers directly to the on-chain Job Board.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 hover:bg-white/[0.07] transition-colors">
            <Sparkles className="size-8 text-[#d9f85a] mb-5" />
            <h3 className="text-lg font-semibold mb-3">3. Let AI Apply</h3>
            <p className="text-sm text-white/50 leading-relaxed">Click one button and our AI writes a custom cover letter based on your on-chain profile and applies for you.</p>
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-white/10 pt-8 pb-8 px-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#0d1016]">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-full bg-white flex items-center justify-center font-bold text-black text-sm">
            BOT
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Built on BOT Chain</p>
            <p className="text-xs text-white/50 mt-1">Empowering decentralized applications.</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center sm:justify-end items-center gap-6 text-sm font-medium">
          <a href="https://botchain.ai" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors">
            BOT Chain Website
          </a>
          <a href="https://scan.botchain.ai" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors">
            BOT Chain Explorer
          </a>
        </div>
      </footer>
    </div>
  )
}
