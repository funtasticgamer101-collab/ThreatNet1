import { Flame, ShieldAlert, FileWarning, EyeOff, Radio } from 'lucide-react';

const COMMON_THREATS = [
  {
    id: "CT-RNS-23-01",
    name: "LockBit 3.0",
    source: "CrowdSec",
    category: "Ransomware",
    description: "A highly active ransomware-as-a-service (RaaS) platform. Uses double extortion tactics and highly obfuscated payloads. Primarily targets large enterprises via compromised credentials or unpatched VPN vulnerabilities.",
    iocs: ["185.10.68.235", "C:\Windows\Temp\lb3.exe"],
    detectedBy: 14205,
    severity: "CRITICAL"
  },
  {
    id: "CT-PHS-23-04",
    name: "AitM Microsoft 365 Phishing",
    source: "Microsoft Threat Intelligence",
    category: "Phishing",
    description: "Adversary-in-the-Middle (AitM) phishing campaigns bypassing MFA to steal session cookies for M365 accounts. Uses reverse proxy servers (like Evilginx2).",
    iocs: ["auth-microsoft-update.com", "login-m365-secure.net"],
    detectedBy: 8532,
    severity: "HIGH"
  },
  {
    id: "CT-MAL-23-11",
    name: "Emotet Botnet",
    source: "CISA",
    category: "Malware",
    description: "Advanced, self-propagating modular trojan. Once a banking trojan, now primarily used as an initial infection vector and dropper for other malware families like TrickBot and Ryuk.",
    iocs: ["103.11.23.44", "45.142.114.231"],
    detectedBy: 112000,
    severity: "CRITICAL"
  },
  {
    id: "CT-SCM-23-02",
    name: "Pig Butchering (Crypto Romance)",
    source: "FBI IC3",
    category: "Scam",
    description: "Long-term social engineering scams where threat actors build trust with victims over dating apps / messaging apps before convincing them to invest in fraudulent cryptocurrency platforms.",
    iocs: ["WhatsApp / Telegram random outreach patterns", "fraud-crypto-fx.app"],
    detectedBy: 4500,
    severity: "MODERATE"
  },
  {
    id: "CT-VUL-24-01",
    name: "MoveIT Transfer (CVE-2023-34362)",
    source: "NVD",
    category: "Vulnerability",
    description: "SQL injection vulnerability in Progress MOVEit Transfer used by Cl0p ransomware gang to perform mass data exfiltration.",
    iocs: ["human2.aspx", "138.197.152.201"],
    detectedBy: 2154,
    severity: "CRITICAL"
  }
];

export default function CommonThreats() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between bg-[#121418] border border-white/5 rounded px-6 py-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Globe className="w-64 h-64" />
        </div>
        <div className="relative z-10 w-full">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
             <Radio className="w-6 h-6 text-blue-500 animate-pulse" /> Global Threat Intelligence
          </h1>
          <p className="text-slate-400 mt-2 font-mono text-xs max-w-2xl leading-relaxed">
            Real-time telemetry and aggregated reports of the most pervasive cyber threats currently circulating globally. Data is sourced automatically from partnered intelligence feeds including CrowdSec, CISA, and leading security research firms. 
            <span className="text-red-400 block mt-2">NOTICE: User submissions are blocked in this sector. This is a read-only global feed.</span>
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {COMMON_THREATS.map((threat) => (
          <div key={threat.id} className="bg-[#121418] border border-white/5 rounded p-5 relative overflow-hidden transition-colors hover:border-white/10 group">
            {threat.severity === 'CRITICAL' && (
               <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
            )}
            
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
               <div>
                  <div className="flex items-center gap-3 mb-2">
                     <span className="text-[10px] bg-white/5 text-slate-300 font-bold border border-white/10 px-2 py-0.5 rounded uppercase">{threat.category}</span>
                     <span className={`text-[10px] bg-white/5 font-bold border border-white/10 px-2 py-0.5 rounded uppercase tracking-widest ${threat.severity==='CRITICAL' ? 'text-red-500' : 'text-orange-400'}`}>{threat.severity}</span>
                     <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1"><EyeOff className="w-3 h-3"/> Vetted / Read-Only</span>
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">{threat.name}</h2>
                  <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">Source: <span className="text-blue-400">{threat.source}</span> • Ref: {threat.id}</p>
               </div>
               
               <div className="bg-[#0B0C0E] border border-white/5 rounded px-4 py-2 text-center min-w-[120px]">
                 <div className="text-xs text-slate-500 uppercase tracking-widest font-black mb-1">Detections</div>
                 <div className="text-xl font-mono font-bold text-white">{(threat.detectedBy).toLocaleString()}</div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
               <div className="md:col-span-2 space-y-2">
                  <h3 className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Threat Summary</h3>
                  <p className="text-xs text-slate-300 font-mono leading-relaxed">{threat.description}</p>
               </div>
               <div className="space-y-2">
                  <h3 className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Identified IOCs</h3>
                  <ul className="space-y-1">
                     {threat.iocs.map((ioc, i) => (
                       <li key={i} className="text-[10px] font-mono bg-red-950/30 text-red-400 border border-red-500/20 px-2 py-1 rounded truncate" title={ioc}>
                         {ioc}
                       </li>
                     ))}
                  </ul>
               </div>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}

function Globe({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
      <path d="M2 12h20"/>
    </svg>
  );
}
