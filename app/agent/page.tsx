'use client'

import { useState, useEffect } from 'react'
import { Sparkles, CircleDollarSign, Check, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react'
import { useWeb3 } from '@/lib/web3'
import { getJobBoardContract, getUSDTContract, JOBBOARD_ADDRESS } from '@/lib/contracts'
import { ethers } from 'ethers'
import { toast } from 'react-hot-toast'

export default function AgentPage() {
  const { provider, signer, address } = useWeb3()
  const [maxApps, setMaxApps] = useState('10')
  const [fee, setFee] = useState('5.0')
  const [depositAmount, setDepositAmount] = useState('50.0')
  
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [isRevoking, setIsRevoking] = useState(false)
  
  const [agentActive, setAgentActive] = useState(false)
  const [escrowBalance, setEscrowBalance] = useState('0.0')

  async function loadData() {
    if (!address || !provider) {
      setIsFetching(false)
      return
    }
    try {
      const jobBoard = getJobBoardContract(provider)
      const bal = await jobBoard.balances(address)
      setEscrowBalance(ethers.formatUnits(bal, 6)) // MockUSDT has 6 decimals
      
      const delegation = await jobBoard.delegations(address)
      setAgentActive(delegation.active)
      if (delegation.active) {
        setMaxApps(delegation.maxApplications.toString())
        setFee(ethers.formatUnits(delegation.feePerApplication, 6))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [address, provider])

  const handleDeposit = async () => {
    if (!signer) return toast.error("Connect wallet first")
    setIsDepositing(true)
    try {
      const usdt = getUSDTContract(signer)
      const jobBoard = getJobBoardContract(signer)
      const amount = ethers.parseUnits(depositAmount, 6)
      
      toast.loading("Approving USDT...", { id: 'dep-tx' })
      const tx1 = await usdt.approve(JOBBOARD_ADDRESS, amount)
      await tx1.wait()
      
      toast.loading("Depositing to escrow...", { id: 'dep-tx' })
      const tx2 = await jobBoard.deposit(amount)
      await tx2.wait()
      
      toast.success("Deposit successful!", { id: 'dep-tx' })
      loadData()
    } catch (err: any) {
      toast.error("Deposit failed: " + (err.reason || err.message), { id: 'dep-tx' })
    } finally {
      setIsDepositing(false)
    }
  }

  const handleAuthorize = async () => {
    if (!signer) return toast.error("Connect wallet first")
    setIsAuthorizing(true)
    try {
      const jobBoard = getJobBoardContract(signer)
      // Mock agent address for now
      const agentAddress = "0x000000000000000000000000000000000000aBcD" 
      const max = parseInt(maxApps)
      const expiry = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days from now
      const feeBN = ethers.parseUnits(fee, 6)
      
      toast.loading("Authorizing agent...", { id: 'auth-tx' })
      const tx = await jobBoard.authorizeAgent(agentAddress, max, expiry, feeBN)
      await tx.wait()
      toast.success("Agent authorized!", { id: 'auth-tx' })
      loadData()
    } catch (err: any) {
      toast.error("Auth failed: " + (err.reason || err.message), { id: 'auth-tx' })
    } finally {
      setIsAuthorizing(false)
    }
  }

  const handleRevoke = async () => {
    if (!signer) return
    setIsRevoking(true)
    try {
      const jobBoard = getJobBoardContract(signer)
      toast.loading("Revoking agent...", { id: 'rev-tx' })
      const tx = await jobBoard.revokeAgent()
      await tx.wait()
      toast.success("Agent revoked!", { id: 'rev-tx' })
      loadData()
    } catch (err: any) {
      toast.error("Revoke failed: " + (err.reason || err.message), { id: 'rev-tx' })
    } finally {
      setIsRevoking(false)
    }
  }

  if (isFetching) {
    return <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-[#d9f85a]" /></div>
  }

  if (!address) {
    return <div className="py-20 text-center text-white/50">Please connect your wallet to manage your AI agent.</div>
  }

  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-[34px]">AI Agent</h1>
          <p className="mt-2 text-sm text-white/45">Delegate your job search securely on-chain.</p>
        </div>
      </div>
       
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-3 border-b border-white/[0.07] pb-5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#d9f85a]/10 text-[#d9f85a]">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">Agent Delegation</h2>
              <p className="text-xs text-white/40">Set strict limits for your AI assistant</p>
            </div>
          </div>
          
          <div className="grid gap-5">
            <div>
              <label className="mb-2 block text-xs text-white/60">Max Applications</label>
              <input 
                type="number"
                value={maxApps}
                onChange={e => setMaxApps(e.target.value)}
                disabled={agentActive}
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-[#d9f85a] focus:outline-none transition-colors disabled:opacity-50" 
              />
            </div>
            <div>
              <label className="mb-2 block text-xs text-white/60">Fee per Application (USDT)</label>
              <input 
                type="number"
                value={fee}
                onChange={e => setFee(e.target.value)}
                disabled={agentActive}
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-[#d9f85a] focus:outline-none transition-colors disabled:opacity-50" 
              />
            </div>
            
            <div className="mt-4 rounded-xl border border-[#d9f85a]/20 bg-[#d9f85a]/5 p-4">
              <h3 className="mb-2 text-xs font-semibold text-[#d9f85a]">What this means:</h3>
              <ul className="space-y-2 text-[11px] text-white/60">
                <li className="flex items-start gap-2"><Check className="size-3 shrink-0 text-[#d9f85a]" /> The agent can submit up to {maxApps} applications.</li>
                <li className="flex items-start gap-2"><Check className="size-3 shrink-0 text-[#d9f85a]" /> Each submission costs {fee} USDT from your escrow.</li>
                <li className="flex items-start gap-2"><Check className="size-3 shrink-0 text-[#d9f85a]" /> You can revoke this permission instantly at any time.</li>
              </ul>
            </div>

            <button 
              onClick={handleAuthorize}
              disabled={isAuthorizing || agentActive}
              className={`mt-2 flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-colors ${agentActive ? 'bg-white/10 text-white/50 cursor-not-allowed' : 'bg-[#d9f85a] text-[#0b0e13] hover:bg-[#c2e04d]'}`}
            >
              {isAuthorizing ? <Loader2 className="size-4 animate-spin text-[#0b0e13]" /> : null}
              {agentActive ? 'Agent Authorized' : 'Authorize Agent On-Chain'}
            </button>
            {agentActive && (
              <button onClick={handleRevoke} disabled={isRevoking} className="text-xs text-red-400 hover:text-red-300">
                {isRevoking ? 'Revoking...' : 'Revoke Agent'}
              </button>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6">
            <h2 className="mb-4 font-semibold">Escrow Balance</h2>
            <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <CircleDollarSign className="size-8 text-violet-400" />
                <div>
                  <p className="text-xl font-bold">{escrowBalance} <span className="text-sm font-medium text-white/50">USDT</span></p>
                  <p className="text-[10px] text-white/40">Available for agent fees</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="w-16 rounded-lg bg-white/5 px-2 py-1 text-xs text-white" />
                  <button onClick={handleDeposit} disabled={isDepositing} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20 transition-colors">
                    {isDepositing ? '...' : 'Deposit'}
                  </button>
                </div>
                <button className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white transition-colors">Withdraw</button>
              </div>
            </div>
          </section>

          <section className="flex-1 rounded-2xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold">Audit Log</h2>
              <span className="flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-1 text-[10px] text-white/50"><ShieldCheck className="size-3" /> On-chain</span>
            </div>
            <div className="flex flex-col gap-4">
              <p className="text-xs text-white/30 text-center py-4">No on-chain events found for your address yet.</p>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
