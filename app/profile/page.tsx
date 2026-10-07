'use client'

import { useState, useEffect, useRef } from 'react'
import { ShieldCheck, Save, Check, Loader2, FileText, Upload } from 'lucide-react'
import { useWeb3 } from '@/lib/web3'
import { getRegistryContract } from '@/lib/contracts'
import { ethers } from 'ethers'
import { toast } from 'react-hot-toast'

export default function ProfilePage() {
  const { provider, signer, address } = useWeb3()
  const [headline, setHeadline] = useState('')
  const [skills, setSkills] = useState('')
  const [resumeText, setResumeText] = useState('')
  
  const [isSaving, setIsSaving] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [credentials, setCredentials] = useState<any[]>([])
  const [savedCid, setSavedCid] = useState('')
  
  // PDF Parsing state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isParsing, setIsParsing] = useState(false)
  
  useEffect(() => {
    async function loadProfile() {
      if (!address || !provider) {
        setIsFetching(false)
        return
      }
      try {
        const registry = getRegistryContract(provider)
        const profile = await registry.getProfile(address)
        if (profile.exists) {
          setHeadline(profile.headline)
          setSkills(profile.skills.join(', '))
          setSavedCid(profile.resumeCid)
        }
        
        const creds = await registry.getCredentials(address)
        setCredentials(creds)
      } catch (error) {
        console.error("Failed to load profile:", error)
      } finally {
        setIsFetching(false)
      }
    }
    loadProfile()
  }, [address, provider])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsParsing(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to parse resume')
      
      if (data.resume.headline) setHeadline(data.resume.headline)
      if (data.resume.skills && Array.isArray(data.resume.skills)) setSkills(data.resume.skills.join(', '))
      
      if (data.resume.email) delete data.resume.email
      if (data.resume.phone) delete data.resume.phone
      
      setResumeText(JSON.stringify(data.resume, null, 2))
      toast.success("Resume parsed successfully! You can review and edit the JSON below before saving.")
    } catch (err: any) {
      toast.error("Error: " + err.message)
    } finally {
      setIsParsing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    if (!signer) return toast.error("Please connect wallet first")
    if (!headline || !skills || !resumeText) return toast.error("Please fill out all fields before saving.")
    
    setIsSaving(true)
    try {
      let payload: any;
      try {
        payload = JSON.parse(resumeText)
      } catch {
        payload = { resumeBody: resumeText }
      }
      
      // Contract allows max 15 skills and 32 chars per skill
      const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0).slice(0, 15).map(s => s.slice(0, 32))
      if (skillsArray.length < skills.split(',').filter(s => s.trim().length > 0).length) {
         toast.success("Skills limited to 15 items to match on-chain registry limits")
      }

      payload.headline = headline
      payload.skills = skillsArray
      if (!payload.name) payload.name = "Anonymous Job Seeker"
      if (payload.email) delete payload.email
      if (payload.phone) delete payload.phone
      
      const jsonString = JSON.stringify(payload, null, 2)
      const docHash = ethers.id(jsonString)

      const res = await fetch('/api/ipfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonString
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'IPFS Upload Failed')
      
      const cid = data.cid
      setSavedCid(cid)

      const registry = getRegistryContract(signer)
      const tx = await registry.setProfile(cid, docHash, headline.slice(0, 80), skillsArray)
      toast.loading("Waiting for transaction confirmation...", { id: 'tx' })
      await tx.wait()
      
      toast.success("Profile saved to IPFS and Blockchain successfully!", { id: 'tx' })
    } catch (error: any) {
      console.error("Save failed:", error)
      toast.error("Error: " + (error.reason || error.message), { id: 'tx' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isFetching) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="size-8 animate-spin text-[#d9f85a]" /></div>
  }

  if (!address) {
    return <div className="py-20 text-center text-white/50">Please connect your wallet to view and edit your profile.</div>
  }

  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-[34px]">Your Profile</h1>
          <p className="mt-2 text-sm text-white/45">Manage your on-chain resume and credentials.</p>
        </div>
      </div>
       
      <section className="mb-8 rounded-2xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6">
        <h2 className="mb-6 font-semibold">Basic Information</h2>
        <div className="grid gap-5">
          <div>
            <label className="mb-2 block text-xs text-white/60">Headline (max 80 chars)</label>
            <input 
              value={headline} 
              onChange={e => setHeadline(e.target.value)} 
              placeholder="e.g. Smart Contract Engineer" 
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-[#d9f85a] focus:outline-none transition-colors" 
            />
          </div>
          <div>
            <label className="mb-2 block text-xs text-white/60">Skills (comma separated)</label>
            <input 
              value={skills} 
              onChange={e => setSkills(e.target.value)} 
              placeholder="Solidity, Foundry, Next.js, ethers.js" 
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-[#d9f85a] focus:outline-none transition-colors" 
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-white/60">
              <span>Paste Resume</span>
              
              <div className="flex items-center gap-3">
                {savedCid && <span className="flex items-center gap-1 text-[#d9f85a]"><Check className="size-3" /> Backed up to IPFS</span>}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isParsing}
                  className="flex items-center gap-2 rounded-lg bg-white/[0.07] px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.1] transition-colors"
                >
                  {isParsing ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
                  {isParsing ? 'Parsing PDF...' : 'Auto-fill from PDF'}
                </button>
                <input 
                  type="file" 
                  accept=".pdf" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload}
                />
              </div>
            </div>
            <textarea 
              value={resumeText} 
              onChange={e => setResumeText(e.target.value)} 
              placeholder="Paste your plain text resume here, or upload a PDF to auto-fill..." 
              className="h-48 w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] p-3.5 text-sm text-white placeholder:text-white/20 focus:border-[#d9f85a] focus:outline-none transition-colors" 
            />
          </div>
          
          <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-5">
            <p className="text-[11px] text-white/40 max-w-[250px]">
              When you click save, we automatically package your data into a JSON file, pin it to IPFS, and secure the hash on-chain.
            </p>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-[#d9f85a] px-5 py-2.5 text-xs font-semibold text-[#0b0e13] hover:bg-[#c2e04d] transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin text-[#0b0e13]" />
              ) : (
                <Save className="size-4" />
              )}
              {isSaving ? 'Uploading & Saving...' : 'Save Profile to Chain'}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-[#10141b] p-5 sm:p-6">
        <h2 className="mb-6 font-semibold">Verified Credentials</h2>
        <div className="flex flex-col gap-3">
          {credentials.length === 0 ? (
            <p className="text-xs text-white/30">No credentials attested to your address yet.</p>
          ) : (
            credentials.map((cred, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                <div className="flex items-center gap-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">{cred.title}</h3>
                    <p className="text-xs text-white/40">Issued by {cred.issuer.slice(0,6)}...{cred.issuer.slice(-4)}</p>
                  </div>
                </div>
                {cred.revoked ? (
                   <span className="flex items-center gap-1 text-xs font-medium text-red-400">Revoked</span>
                ) : (
                   <span className="flex items-center gap-1 text-xs font-medium text-[#d9f85a]"><Check className="size-3" /> Valid</span>
                )}
              </div>
            ))
          )}
          <p className="mt-2 text-xs text-white/30 border-t border-white/10 pt-4">Only registered issuers can attest credentials to your profile.</p>
        </div>
      </section>
    </>
  )
}
