import React, { createContext, useContext, useState, useEffect } from 'react';
import { ShieldAlert, Fingerprint, Lock, Shield, Cpu, RefreshCcw } from 'lucide-react';
import { logMaliciousActivity } from '../lib/security';

interface ActiveDefenseState {
  isUnderAttackMode: boolean;
  setUnderAttackMode: (state: boolean) => void;
  encryptionLevel: 'standard' | 'maximum';
  setEncryptionLevel: (level: 'standard' | 'maximum') => void;
}


const ActiveDefenseContext = createContext<ActiveDefenseState | null>(null);

export function useActiveDefense() {
  const context = useContext(ActiveDefenseContext);
  if (!context) throw new Error('useActiveDefense must be used within an ActiveDefenseProvider');
  return context;
}

export function ActiveDefenseProvider({ children }: { children: React.ReactNode }) {
  // Normally this would be toggled from a backend admin panel for the whole app.
  // We'll manage it locally in localStorage to persist the "state of the app" for the demo.
  const [isUnderAttackMode, setUnderAttackModeState] = useState(() => {
    return localStorage.getItem('threathunter_under_attack') === 'true';
  });
  
  const [encryptionLevel, setEncryptionLevelState] = useState<'standard' | 'maximum'>(() => {
    return (localStorage.getItem('threathunter_encryption') as 'standard' | 'maximum') || 'standard';
  });

  const [isScrubbing, setIsScrubbing] = useState(isUnderAttackMode);
  const [logs, setLogs] = useState<string[]>([]);
  const actionTimestamps = React.useRef<number[]>([]);

  useEffect(() => {
    const handleAction = () => {
      if (isUnderAttackMode) return;
      const now = Date.now();
      actionTimestamps.current = actionTimestamps.current.filter(time => now - time < 3000);
      actionTimestamps.current.push(now);
      
      if (actionTimestamps.current.length > 20) {
        console.warn("AUTOMATED DDOS/BRUTE-FORCE MITIGATION ENGAGED");
        actionTimestamps.current = [];
        setUnderAttackMode(true);
        logMaliciousActivity("Automated DDoS/Brute-Force detected from high click/key rate.");
      }

    };

    window.addEventListener('click', handleAction);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === 'Space') handleAction();
    });

    return () => {
      window.removeEventListener('click', handleAction);
      window.removeEventListener('keydown', handleAction);
    };
  }, [isUnderAttackMode]);

  useEffect(() => {
    if (isScrubbing && isUnderAttackMode) {
      const messages = [
         "Initiating Active Defense Gateway...",
         "Evaluating browser integrity & TLS fingerprint...",
         "Performing localized Proof-of-Work puzzle...",
         "Analyzing behavioral anomalies...",
         "Verifying IP reputational telemetry...",
         "Establishing End-to-End Encryption protocol...",
         "Redundant Security Layers Activated.",
         "Access granted. Redirecting."
      ];
      
      let i = 0;
      const interval = setInterval(() => {
         if (i < messages.length) {
            setLogs(prev => [...prev, messages[i]]);
            i++;
         } else {
            clearInterval(interval);
            setTimeout(() => {
               setIsScrubbing(false);
            }, 1000);
         }
      }, 700);

      return () => clearInterval(interval);
    }
  }, [isScrubbing, isUnderAttackMode]);

  const setUnderAttackMode = (state: boolean) => {
    if (state) {
      setLogs([]);
      setIsScrubbing(true);
    }
    localStorage.setItem('threathunter_under_attack', state ? 'true' : 'false');
    setUnderAttackModeState(state);
  };

  const setEncryptionLevel = (level: 'standard' | 'maximum') => {
    localStorage.setItem('threathunter_encryption', level);
    setEncryptionLevelState(level);
  };

  if (isScrubbing && isUnderAttackMode) {
     return (
        <div className="fixed inset-0 z-[100] bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-green-500 font-mono">
           <div className="max-w-2xl w-full space-y-8">
              <div className="text-center space-y-4">
                 <ShieldAlert className="w-20 h-20 text-red-500 mx-auto animate-pulse" />
                 <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter shadow-red-500/50 drop-shadow-md">
                   Active Defense Mode Engaged
                 </h1>
                 <p className="text-sm text-slate-400">
                   This platform is currently experiencing high-volume targeted attacks. We are enforcing redundant security layers and End-to-End Encryption checks. Please stand by.
                 </p>
              </div>

              <div className="bg-[#121418] border border-white/10 rounded p-6 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />
                 
                 <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
                    <div className="w-12 h-12 rounded bg-black flex items-center justify-center border border-white/10 relative">
                       <RefreshCcw className="w-5 h-5 text-white animate-spin" />
                    </div>
                    <div>
                       <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Status</div>
                       <div className="text-sm text-white">Scrubbing Incoming Traffic...</div>
                    </div>
                 </div>

                 <div className="space-y-2 h-48 overflow-y-auto font-mono text-[10px] sm:text-xs">
                    {logs.map((log, i) => (
                       <div key={i} className="flex items-start gap-2 text-slate-400">
                          <span className="text-blue-500 shrink-0">[{new Date().toISOString()}]</span>
                          <span className={`${i === logs.length - 1 && i === 7 ? 'text-green-400 font-bold' : ''}`}>{log}</span>
                       </div>
                    ))}
                    {logs.length < 8 && (
                       <div className="flex items-start gap-2 text-slate-500 animate-pulse">
                          <span className="text-blue-500/50 shrink-0">[{new Date().toISOString()}]</span>
                          <span>_</span>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
     );
  }

  return (
    <ActiveDefenseContext.Provider value={{ isUnderAttackMode, setUnderAttackMode, encryptionLevel, setEncryptionLevel }}>
      {children}
    </ActiveDefenseContext.Provider>
  );
}
