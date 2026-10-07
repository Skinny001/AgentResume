# PRD 03: AgentResume

**Tagline:** Your on-chain resume plus an AI agent that writes cover letters and applies to jobs for you, within limits you set.
**Target:** BOT Chain Testnet (chain ID 968)
**Stack:** Solidity ^0.8.24, Foundry (forge), OpenZeppelin v5, Next.js (App Router), ethers v6

---

## 0. Common setup (same in every PRD)

| Item | Value |
|---|---|
| Network | BOT Chain Testnet |
| Chain ID | 968 (hex `0x3C8`) |
| RPC | `https://rpc.bohr.life` |
| Explorer | `https://scan.bohr.life` |
| Native token | tBOT (gas). Faucet: `https://faucet.botchain.ai/basic`, 10 tBOT per address per 24h |
| USDT (testnet) | `0x75edC9335175Fc0552D51D48439F229c10420fe3` |

Rules for the whole build:
- The docs do not state USDT decimals. Always read `decimals()` from the token. Never hardcode 6 or 18.
- How you get test USDT is not documented. Day 1: check the faucet and bridge pages. If you cannot get any, deploy your own `MockUSDT` and set `NEXT_PUBLIC_USDT_ADDRESS`. Put this in your README.
- Do not rely on `eth_getLogs` for core data. Store data in contract state and read it with paginated view functions.
- Deploy with: `forge script script/Deploy.s.sol --rpc-url https://rpc.bohr.life --broadcast --private-key $PRIVATE_KEY`. Add `--legacy` if you hit a gas price error.
- tBOT is limited (10 per day per address). Test locally with `forge test` first.

---

## 1. Overview

Job hunting means rewriting the same cover letter again and again. AgentResume gives each user a verifiable on-chain resume profile (hashes and pointers, not raw personal data), lets them delegate an AI agent with a limited allowance, and records every application on-chain so the user can audit exactly what the agent did and what it was paid.

The AI runs off-chain (a Next.js server route calling an LLM API). The chain provides: identity of the resume, delegation limits, payment escrow, and an audit trail.

## 2. Assumptions (decisions already made)

1. **Jobs come from an on-chain Job Board** where employers (any address) post jobs. For the demo, seed 10 to 15 jobs from a script. No scraping of external job sites in MVP.
2. **The agent is a backend wallet** (an address you control, held in server env) with limited permissions granted by each user. The user must approve it.
3. **Human-in-the-loop by default:** the agent drafts the cover letter and the user clicks "Approve and Submit" in the UI. An "auto-apply" toggle exists, limited by the delegation settings (max applications, expiry, budget).
4. **Payments:** User deposits USDT into an escrow balance. Agent fee is a fixed `feePerApplication` set by the user in the delegation, paid on each submitted application.
5. **Privacy:** The full resume JSON is stored off-chain (IPFS). On-chain stores `resumeCid`, `resumeHash`, skill tags, and credential attestations (hashes).
6. **Credentials:** Issuers (schools, bootcamps) are registered by the admin and can attest a credential for a user (hash and title). This is optional but makes "on-chain resume" meaningful.

## 3. Users and roles

| Role | Can do |
|---|---|
| Admin | Add/remove credential issuers |
| Job seeker | Create profile, attach credentials, deposit USDT, delegate agent, review and submit applications |
| Agent (backend address) | Submit applications for users who delegated to it |
| Employer | Post jobs, view applications, update application status |
| Issuer | Attest credentials for users |

## 4. User stories

- As a job seeker, I create my profile by saving my resume JSON to IPFS and registering the hash on-chain.
- As a job seeker, I add a credential issued by a school (the issuer attests it).
- As a job seeker, I authorize the agent with a max number of applications, an expiry date, and a fee per application, and deposit USDT.
- As a job seeker, I pick jobs, the agent drafts a cover letter, I edit it and submit.
- As an employer, I post a job and see applications with the applicant's resume link and cover letter hash/CID.
- As a job seeker, I see an audit log of every application the agent submitted and every fee paid.
- As a job seeker, I revoke the agent instantly and withdraw remaining USDT.

## 5. Scope

**MVP:** profile, credential attestation, job board, delegation + escrow, application submission, status updates, audit view, AI cover letter route with a human review step.

**Out of scope:** scraping third-party jobs, email sending, interview scheduling, multi-agent marketplaces, ZK proofs.

## 6. Smart contract specification

### 6.1 Contracts

1. `ResumeRegistry.sol`: profiles and credential attestations.
2. `JobBoard.sol`: jobs, applications, agent delegation and escrow.
3. `MockUSDT.sol` (tests only).

You may merge into one contract if you prefer, but two keeps files readable.

### 6.2 Data structures

```solidity
struct Profile {
    string resumeCid;
    bytes32 resumeHash;
    string headline;          // short text, max 80 chars
    string[] skills;          // max 15
    uint64 updatedAt;
    bool exists;
}

struct Credential {
    address issuer;
    string title;             // e.g. "BSc Computer Science"
    bytes32 docHash;
    uint64 issuedAt;
    bool revoked;
}

struct Job {
    uint256 id;
    address employer;
    string title;
    string company;
    string descriptionCid;    // IPFS or static URL for demo
    bytes32 descriptionHash;
    uint64 closesAt;
    bool open;
}

enum AppStatus { Submitted, Viewed, Shortlisted, Rejected, Hired }

struct Application {
    uint256 id;
    uint256 jobId;
    address applicant;
    address submittedBy;      // applicant or agent
    string coverLetterCid;
    bytes32 coverLetterHash;
    uint64 submittedAt;
    AppStatus status;
}

struct Delegation {
    address agent;
    uint32 maxApplications;
    uint32 used;
    uint64 expiresAt;
    uint256 feePerApplication; // USDT base units
    bool active;
}
```

State: `profiles`, `credentials[user]` array, `jobs`, `applications`, `applicationsByUser`, `applicationsByJob`, `delegations[user]`, `balances[user]` (escrow USDT), `hasApplied[jobId][applicant]`.

### 6.3 Functions

ResumeRegistry:
- `setProfile(resumeCid, resumeHash, headline, skills[])` (create or update, caller is owner)
- `addIssuer(addr)`, `removeIssuer(addr)` (admin)
- `attestCredential(user, title, docHash)` (issuer only)
- `revokeCredential(user, index)` (the issuer that issued it)
- Views: `getProfile`, `getCredentials`

JobBoard:
- `postJob(title, company, descriptionCid, descriptionHash, closesAt)`
- `closeJob(id)` (employer)
- `deposit(amount)` / `withdraw(amount)` (user escrow, SafeERC20)
- `authorizeAgent(agent, maxApplications, expiresAt, feePerApplication)` (sets delegation, active)
- `revokeAgent()` (user)
- `apply(jobId, coverLetterCid, coverLetterHash)` (user applies directly, no fee)
- `applyFor(user, jobId, coverLetterCid, coverLetterHash)` (agent only): requires active delegation for `user` to `msg.sender`, `used < maxApplications`, not expired, user balance >= fee, user has a profile, job open and not closed, no duplicate application. Deducts fee from `balances[user]` and pays it to the agent (or accrues to `agentEarnings[agent]` with `claimEarnings()` to be pull-based, preferred).
- `setStatus(applicationId, status)` (employer of the job)
- Views: `getJob`, `listJobs(offset, limit)`, `getApplication`, `applicationsOf(user, offset, limit)`, `applicationsForJob(jobId, offset, limit)`, `getDelegation(user)`

### 6.4 Events

`ProfileSet`, `CredentialAttested`, `JobPosted`, `Applied(applicationId, jobId, applicant, submittedBy)`, `AgentAuthorized`, `AgentRevoked`, `StatusChanged`, `Deposited`, `Withdrawn`.

### 6.5 Security checklist

- Agent can only act for users who delegated to it, within limits. Agent cannot withdraw user funds.
- Duplicate application per job per applicant is blocked.
- `maxApplications` and `expiresAt` enforced on every `applyFor`.
- Skills array length and string lengths capped to avoid gas griefing.

## 7. Frontend + AI route specification

### 7.1 Pages

| Route | Purpose |
|---|---|
| `/` | Landing, how it works |
| `/profile` | Edit resume form, preview, save to IPFS then on-chain; credentials list |
| `/jobs` | Job list with search by skill/title (client-side filtering) |
| `/jobs/[id]` | Job detail, "Draft with agent" and "Apply directly" |
| `/agent` | Delegation settings, escrow deposit/withdraw, revoke, audit log of agent applications and fees |
| `/applications` | My applications and statuses |
| `/employer` | Post job, view applicants for my jobs, change status |
| `/issuer` | Attest credential (issuer only) |

### 7.2 AI cover letter route

`POST /api/draft` (server only):
- Input: `jobId`, `userAddress`. The server reads the job description and the user's resume JSON (from IPFS or the request body) and calls an LLM API with a prompt that includes the resume and job, asking for a concise, honest cover letter that only uses facts from the resume.
- Returns the draft text. The UI shows it in an editable box.
- The LLM API key is in server env only (`LLM_API_KEY`). Never expose it to the browser.
- Rate-limit the route per address (simple in-memory limit is enough for the demo).

Submission flow:
1. User approves the draft. The UI uploads the final letter to IPFS (or stores it as a data URL for the demo), computes `keccak256` of the text.
2. If submitting directly, the user calls `apply`.
3. If auto-apply is on and delegation is active, the browser sends the draft to `POST /api/agent-submit`, and the server signs `applyFor` with the agent wallet (`AGENT_PRIVATE_KEY` in server env). The server must verify the user's delegation on-chain before signing.

### 7.3 UX details

- Always show what the agent is allowed to do: max applications left, expiry, fee, escrow balance.
- A visible "Human review required" toggle (default ON).
- Display the cover letter hash next to each application so users can verify what was submitted.
- Wallet connect and chain switching per the common setup.

## 8. Off-chain data

Resume JSON and cover letters on IPFS (Pinata via server route), or for the demo, static JSON in `/public`. Job descriptions seeded from a script.

## 9. Foundry test plan

- Profile: create, update, caps on skills and lengths.
- Credentials: only issuers can attest; revoke only by that issuer.
- Jobs: post, close, closed job rejects applications.
- Delegation: authorize and revoke; agent without delegation reverts; expired delegation reverts; `maxApplications` enforced; insufficient escrow reverts.
- Fee accounting: user balance decreases and agent earnings increase by exactly the fee; withdraw cannot exceed balance.
- Duplicate application blocked.
- Employer-only status updates.
- Fuzz: deposit/withdraw sequences keep `sum(balances) + agentEarnings <= vault USDT balance`.

## 10. Project structure

```
agentresume/
  contracts/ src/ResumeRegistry.sol, JobBoard.sol
             test/, script/Deploy.s.sol, script/SeedJobs.s.sol
  web/ app/..., app/api/draft/route.ts, app/api/agent-submit/route.ts
       lib/, components/
  README.md
```

Env: `PRIVATE_KEY`, `NEXT_PUBLIC_REGISTRY_ADDRESS`, `NEXT_PUBLIC_JOBBOARD_ADDRESS`, `NEXT_PUBLIC_USDT_ADDRESS`, `LLM_API_KEY`, `AGENT_PRIVATE_KEY`, `PINATA_JWT`.

## 11. Build order

1. Contracts + tests. 2. Deploy + seed jobs. 3. Profile and jobs pages. 4. Delegation and escrow UI. 5. AI draft route + review flow. 6. Agent auto-submit route with on-chain checks. 7. Employer view, audit log, polish, README.

## 12. Acceptance criteria

- [ ] All forge tests pass.
- [ ] Testnet deployment with addresses in README.
- [ ] Full flow in the UI: profile, job, AI draft, human review, submit, status change, audit log.
- [ ] Agent cannot exceed limits; revocation works.
- [ ] No API keys or private keys in the repo or the browser bundle.

## 13. Risks and notes

- The agent private key is a hot wallet on your server. Use a fresh testnet-only key.
- LLM output can invent facts. The prompt must restrict claims to the resume, and the UI keeps the human review step.
