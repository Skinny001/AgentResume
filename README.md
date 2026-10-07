# 🛡️ AgentResume

**The AI Agent for your On-Chain Career.** 

AgentResume is a decentralized application (dApp) built on **BOT Chain** that revolutionizes the Web3 job application process. Upload your PDF resume to instantly mint an immutable, verified on-chain profile. Then, let our built-in AI Agent automatically draft hyper-personalized cover letters and apply to jobs on your behalf.

![AgentResume Built on BOT Chain](https://img.shields.io/badge/Built_on-BOT_Chain-black?style=for-the-badge&logo=web3)
![Next.js](https://img.shields.io/badge/Next.js-0b0e13?style=for-the-badge&logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![IPFS Pinata](https://img.shields.io/badge/IPFS-Pinata-62D5CD?style=for-the-badge&logo=ipfs)
![Gemini AI](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google)

---

## ✨ Key Features

- **1. Mint Your Profile:** Upload your standard PDF resume. The Gemini AI engine parses it, structures it into JSON, and securely pins it to IPFS. The hash is then verified and minted to your wallet on BOT Chain.
- **2. Decentralized Job Board:** Employers post Web3 jobs directly to the on-chain registry. 
- **3. 1-Click AI Applications:** When you find a job you like, the AI Agent automatically drafts a customized cover letter bridging your on-chain resume to the specific job description, uploads it to IPFS, and submits your application on-chain.
- **4. Employer Dashboard:** Employers can view incoming applications, read AI-generated cover letters on IPFS, and update candidate statuses (Shortlist, Hire, Reject) entirely via smart contracts.

## 🛠 Tech Stack

- **Frontend Framework:** Next.js (App Router) + React
- **Styling:** Tailwind CSS + Lucide Icons (Dark mode neon aesthetic)
- **Blockchain Network:** BOT Chain Testnet (Chain ID: 968)
- **Web3 Integration:** Ethers.js
- **Decentralized Storage:** IPFS via Pinata Gateway
- **AI Engine:** `@google/genai` (Gemini 3.5 Flash Lite)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Web3 Wallet (like MetaMask or Rabby) configured for the **BOT Chain Testnet**.
- A Google Gemini API Key
- A Pinata JWT (for IPFS uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/agent-resume.git
   cd agent-resume
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory and add the following:
   ```env
   # Your Google Gemini API Key for parsing resumes and drafting cover letters
   GEMINI_API_KEY=your_gemini_api_key_here

   # Your Pinata JWT for pinning JSON profiles and cover letters to IPFS
   PINATA_JWT=your_pinata_jwt_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔗 BOT Chain Ecosystem

This project proudly contributes to the BOT Chain ecosystem. 
- **BOT Chain Website:** [https://botchain.ai](https://botchain.ai)
- **BOT Chain Explorer:** [https://scan.botchain.ai](https://scan.botchain.ai)

## 📄 Smart Contracts

The smart contracts for `ResumeRegistry` and `JobBoard` are deployed on the **BOT Chain Testnet** (Chain ID: 968) at the following addresses:

- **ResumeRegistry:** `0x9df702B01B5Bb9Aa29B32Dc9009be8b173f32781`
- **JobBoard:** `0xe4B94b636365992Eec004414Bd9Cf9b077593bbe`
- **Mock USDT (Escrow):** `0x38b1F50e2c483C40a71E83C28b69EDb99FfBC0f9`

These contracts handle:
- Immutable mapping of Wallet Addresses -> Resume IPFS CIDs.
- Secure Job Board posting and application tracking.
- Employer-driven application status state-machine (Submitted -> Shortlisted -> Hired).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check the [issues page](https://github.com/your-username/agent-resume/issues).

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
