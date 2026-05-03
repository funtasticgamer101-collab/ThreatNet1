import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { signInWithGoogle } from '../lib/firebase';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-full bg-black w-full items-center justify-start p-6 pt-24 pb-20">
      <div className="max-w-4xl text-center space-y-8">
        <div className="inline-flex items-center justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-white tracking-tighter text-3xl shadow-[0_0_50px_-5px_rgba(16,185,129,0.3)] bg-gradient-to-br from-emerald-600 to-emerald-900 border border-emerald-500/30">
            <span className="z-10 text-emerald-50">TN</span>
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase leading-tight">
          ThreatNet <br/><span className="text-emerald-500 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600">Intelligence Node</span>
        </h1>
        
        <p className="text-base text-emerald-100/60 max-w-2xl mx-auto leading-relaxed font-medium">
          Decentralized threat intelligence database. Identify malware patterns, track active phishing campaigns, and verify zero-day vulnerabilities.
        </p>
        
        <div className="flex items-center justify-center gap-6 pt-10">
          <Link to="/feed" className="bg-emerald-600 hover:bg-emerald-500 text-black px-10 py-4 rounded-xl text-sm font-bold transition-all uppercase tracking-widest shadow-lg shadow-emerald-900/40 hover:scale-105 active:scale-95">
            Access Database
          </Link>
          {!user && (
            <button onClick={signInWithGoogle} className="bg-black hover:bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 px-10 py-4 rounded-xl text-sm font-bold transition-all uppercase tracking-widest hover:border-emerald-500/50 hover:scale-105 active:scale-95">
              Authenticate
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 max-w-5xl w-full">
        <div className="bg-[#0a0a0a] border border-emerald-900/30 p-8 rounded-2xl text-center shadow-lg hover:border-emerald-500/30 transition-colors">
          <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-3">Live Updates</h3>
          <p className="text-xs text-emerald-100/50 leading-relaxed font-medium">
            Real-time synchronization with active community reports.
          </p>
        </div>
        <div className="bg-[#0a0a0a] border border-emerald-900/30 p-8 rounded-2xl text-center shadow-lg hover:border-emerald-500/30 transition-colors">
          <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-3">AI Vetted</h3>
          <p className="text-xs text-emerald-100/50 leading-relaxed font-medium">
            Automated scrubbing of PII and malicious payloads.
          </p>
        </div>
        <div className="bg-[#0a0a0a] border border-emerald-900/30 p-8 rounded-2xl text-center shadow-lg hover:border-emerald-500/30 transition-colors">
          <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-3">Peer Review</h3>
          <p className="text-xs text-emerald-100/50 leading-relaxed font-medium">
            Every indicator of compromise requires community consensus.
          </p>
        </div>
      </div>
    </div>
  );
}
