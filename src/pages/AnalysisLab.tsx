import { useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { GoogleGenAI } from '@google/genai';
import { Terminal, Code, Cpu, Bug, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '' });

export default function AnalysisLab() {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzeCode = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    
    try {
      const prompt = `You are an elite malware analyst. Analyze the following suspiciously obfuscated code, powershell payload, or phishing headers.
Please explain:
1. What this code does (high-level).
2. Exactly how it achieves its goals and mechanisms used (obfuscation, base64 encoding, steganography).
3. Any immediate IOCs (Indicators of Compromise) found in the payload.

Format your response cleanly.

Code / Payload:
${code}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });

      if (response.text) {
        setAnalysis(response.text.trim());
      }
    } catch (err: any) {
      console.error(err);
      setError("Analysis failed: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col mb-8 p-6 bg-[#121418] border border-white/5 rounded text-center items-center justify-center space-y-4 max-w-2xl mx-auto mt-8">
        <AlertCircle className="w-12 h-12 text-slate-500" />
        <h2 className="text-xl font-bold text-white uppercase tracking-tight">Authentication Required</h2>
        <p className="text-slate-400 text-sm">You must be authenticated to use the Analysis Lab.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 w-full">
      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
        <div className="p-2 bg-blue-600/20 rounded border border-blue-500/20 text-blue-400">
          <Terminal className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight uppercase">AI Analysis Lab</h1>
          <p className="text-slate-400 text-sm font-mono mt-1">Malware Deobfuscation & Payload Analysis Engine</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
        
        {/* Input Panel */}
        <div className="bg-[#121418] border border-white/5 rounded overflow-hidden flex flex-col">
          <div className="bg-[#0B0C0E]/50 border-b border-white/5 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest">
              <Code className="w-4 h-4 text-slate-500" />
              Target Payload
            </div>
          </div>
          <div className="flex-1 p-4 flex flex-col gap-4">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste obfuscated JS, base64 blobs, PowerShell scripts, malicious macros..."
              className="w-full flex-1 bg-[#0B0C0E] border border-white/10 rounded px-4 py-4 text-sm text-green-400 focus:outline-none focus:border-blue-500 transition-colors font-mono resize-none leading-relaxed"
            />
            <button
              onClick={analyzeCode}
              disabled={loading || !code.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded text-xs font-bold transition-colors tracking-widest uppercase flex items-center justify-center gap-2"
            >
              {loading ? (
                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <><Cpu className="w-4 h-4" /> Execute Analysis Scan</>
              )}
            </button>
            {error && <div className="text-red-400 bg-red-500/10 p-3 rounded font-mono text-xs border border-red-500/20">{error}</div>}
          </div>
        </div>

        {/* Output Panel */}
        <div className="bg-[#121418] border border-white/5 rounded overflow-hidden flex flex-col">
          <div className="bg-[#0B0C0E]/50 border-b border-white/5 px-4 py-3 flex items-center gap-2">
            <Bug className="w-4 h-4 text-red-500" />
            <h2 className="text-xs font-bold text-white uppercase tracking-widest">AI Extraction Feed</h2>
          </div>
          <div className="flex-1 p-6 overflow-y-auto bg-[#0B0C0E]/30 relative">
            {!analysis && !loading && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-600 font-mono text-xs uppercase tracking-widest flex-col gap-3 opacity-50">
                <Terminal className="w-12 h-12" />
                Awaiting Payload...
              </div>
            )}
            {loading && (
              <div className="text-blue-400 font-mono text-xs animate-pulse space-y-2">
                <div>[+] Initializing virtual behavioral sandbox...</div>
                <div>[+] Digesting payload morphology...</div>
                <div>[+] Bypassing obfuscation layers...</div>
                <div>[+] Synthesizing telemetry...</div>
              </div>
            )}
            {analysis && !loading && (
              <div className="font-mono text-xs text-slate-300 leading-loose whitespace-pre-wrap">
                {analysis}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
