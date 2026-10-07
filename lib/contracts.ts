import { Contract, Provider, Signer } from 'ethers'

export const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || ''
export const JOBBOARD_ADDRESS = process.env.NEXT_PUBLIC_JOBBOARD_ADDRESS || ''
export const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS || ''

export const REGISTRY_ABI = [
  "function setProfile(string calldata cid, bytes32 hash, string calldata headline, string[] calldata skills) external",
  "function getProfile(address user) external view returns (tuple(string resumeCid, bytes32 resumeHash, string headline, string[] skills, uint64 updatedAt, bool exists))",
  "function getCredentials(address user) external view returns (tuple(address issuer, string title, bytes32 docHash, uint64 issuedAt, bool revoked)[])"
]

export const JOBBOARD_ABI = [
  "function postJob(string calldata title, string calldata company, string calldata cid, bytes32 hash, uint64 closesAt) external",
  "function deposit(uint256 amount) external",
  "function withdraw(uint256 amount) external",
  "function authorizeAgent(address agent, uint32 max, uint64 expiry, uint256 fee) external",
  "function revokeAgent() external",
  "function applyDirect(uint256 jobId, string calldata cid, bytes32 hash) external",
  "function applyFor(address user, uint256 jobId, string calldata cid, bytes32 hash) external",
  "function setStatus(uint256 id, uint8 status) external",
  "function listJobs(uint256 offset, uint256 limit) external view returns (tuple(uint256 id, address employer, string title, string company, string descriptionCid, bytes32 descriptionHash, uint64 closesAt, bool open)[])",
  "function jobs(uint256 id) external view returns (uint256 id, address employer, string title, string company, string descriptionCid, bytes32 descriptionHash, uint64 closesAt, bool open)",
  "function applicationsForJob(uint256 id, uint256 offset, uint256 limit) external view returns (tuple(uint256 id, uint256 jobId, address applicant, address submittedBy, string coverLetterCid, bytes32 coverLetterHash, uint64 submittedAt, uint8 status)[])",
  "function applicationsOf(address user, uint256 offset, uint256 limit) external view returns (tuple(uint256 id, uint256 jobId, address applicant, address submittedBy, string coverLetterCid, bytes32 coverLetterHash, uint64 submittedAt, uint8 status)[])",
  "function balances(address user) external view returns (uint256)",
  "function delegations(address user) external view returns (tuple(address agent, uint32 maxApplications, uint32 used, uint64 expiresAt, uint256 feePerApplication, bool active))"
]

export const USDT_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function mint(address to, uint256 amount) external"
]

export function getRegistryContract(providerOrSigner: Provider | Signer) {
  return new Contract(REGISTRY_ADDRESS, REGISTRY_ABI, providerOrSigner)
}

export function getJobBoardContract(providerOrSigner: Provider | Signer) {
  return new Contract(JOBBOARD_ADDRESS, JOBBOARD_ABI, providerOrSigner)
}

export function getUSDTContract(providerOrSigner: Provider | Signer) {
  return new Contract(USDT_ADDRESS, USDT_ABI, providerOrSigner)
}
