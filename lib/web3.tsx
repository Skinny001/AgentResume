'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { BrowserProvider, Signer } from 'ethers'

interface Web3ContextType {
  provider: BrowserProvider | null;
  signer: Signer | null;
  address: string | null;
  chainId: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
}

const Web3Context = createContext<Web3ContextType>({} as Web3ContextType)

export function Web3Provider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [signer, setSigner] = useState<Signer | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  // BOT Chain Testnet params
  const targetChainId = 968
  const targetChainHex = '0x3c8'

  const connect = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert("Please install MetaMask or a Web3 wallet.")
      return
    }
    setIsConnecting(true)
    try {
      const eth = (window as any).ethereum;
      
      // 1. Request connection to the wallet first
      const browserProvider = new BrowserProvider(eth)
      const accounts = await browserProvider.send("eth_requestAccounts", [])
      
      // 2. Then switch network if needed
      try {
        await eth.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainHex }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: targetChainHex,
              chainName: 'BOT Chain Testnet',
              rpcUrls: ['https://rpc.bohr.life'],
              nativeCurrency: { name: 'tBOT', symbol: 'tBOT', decimals: 18 },
              blockExplorerUrls: ['https://scan.bohr.life']
            }],
          });
        } else {
          throw switchError;
        }
      }

      const _signer = await browserProvider.getSigner()
      const network = await browserProvider.getNetwork()
      
      setProvider(browserProvider)
      setSigner(_signer)
      setAddress(accounts[0])
      setChainId(Number(network.chainId))
    } catch (error: any) {
      console.error("Wallet connection failed:", error)
      alert(error?.message || "Wallet connection failed or was rejected. Check your wallet extension.")
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setProvider(null)
    setSigner(null)
    setAddress(null)
    setChainId(null)
  }

  useEffect(() => {
    const eth = (window as any).ethereum;
    if (eth) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0])
          if (provider) {
            provider.getSigner().then(setSigner)
          }
        } else {
          disconnect()
        }
      }
      const handleChainChanged = () => window.location.reload()

      eth.on('accountsChanged', handleAccountsChanged)
      eth.on('chainChanged', handleChainChanged)

      return () => {
        eth.removeListener('accountsChanged', handleAccountsChanged)
        eth.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [provider])

  return (
    <Web3Context.Provider value={{ provider, signer, address, chainId, connect, disconnect, isConnecting }}>
      {children}
    </Web3Context.Provider>
  )
}

export const useWeb3 = () => useContext(Web3Context)
