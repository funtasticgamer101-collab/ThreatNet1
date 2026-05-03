import { useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { GoogleGenAI } from '@google/genai';
import { Crosshair, User, Mail, ShieldAlert, Cpu, Check, Copy } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '' });

export default function ActiveDefense() {
  const { user } = useAuth();
  
  const [loadingPersona, setLoadingPersona] = useState(false);
  const [persona, setPersona] = useState('');
  
  const [scammerAddress, setScammerAddress] = useState('');
  const [scammerInfo, setScammerInfo] = useState('');
  const [scamMessage, setScamMessage] = useState('');
  const [baitReply, setBaitReply] = useState('');
  const [loadingBait, setLoadingBait] = useState(false);

  const [copied, setCopied] = useState(false);

  const generatePersona = async () => {
    setLoadingPersona(true);
    try {
      const prompt = `You are a cybersecurity expert building a 'scam-baiting' persona to waste the time of malicious actors. 
Generate a completely fake, incredibly detailed fictional persona.
Include:
- Fake Full Name
- Fake Age & Occupation (make it sound naive or vulnerable)
- Fake System OS and Browser (e.g. Windows 7, ancient IE browser)
- A brief narrative of how they might act (e.g., highly trusting, confused by technology).

Format nicely in Markdown or clear text. DO NOT use any real PII.`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt
      });

      if (response.text) setPersona(response.text.trim());
    } catch (e) {
      console.error(e);
      setPersona("Failed to generate persona.");
    } finally {
      setLoadingPersona(false);
    }
  };

  const generateBait = async () => {
    if (!scamMessage.trim()) return;
    setLoadingBait(true);
    try {
      const prompt = `You are an expert scam-baiter. I am going to provide details of a cyber criminal / scammer and their message.
Your goal is to write a highly believable, time-wasting response email from a confused user. 
The response should:
- String the scammer along.
- Pretend to misunderstand basic instructions to waste their time.
- Sound incredibly polite but obtuse.
- Consider any extra info provided.
- Do NOT include any real PII, fake it all.

Scammer Email / Address:
${scammerAddress || "Not provided"}

Extra Info:
${scammerInfo || "Not provided"}

Scammer's Message:
${scamMessage}`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt
      });

      if (response.text) setBaitReply(response.text.trim());
    } catch (e) {
      console.error(e);
      setBaitReply("Failed to generate bait response.");
    } finally {
      setLoadingBait(false);
    }
  };

  const copyToClipboard = () => {
    if (baitReply) {
      navigator.clipboard.writeText(baitReply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col mb-8 p-6 bg-[#121418] border border-white/5 rounded text-center items-center justify-center space-y-4 max-w-2xl mx-auto mt-8">
        <ShieldAlert className="w-12 h-12 text-slate-500" />
        <h2 className="text-xl font-bold text-white uppercase tracking-tight">Authentication Required</h2>
        <p className="text-slate-400 text-sm">You must be authenticated to use Active Defense protocols.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 w-full">
      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
        <div className="p-2 bg-red-600/20 rounded border border-red-500/20 text-red-500">
          <Crosshair className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Active Defense Engine</h1>
          <p className="text-slate-400 text-sm font-mono mt-1">Scammer Resource Exhaustion & Engagement Tactics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Persona Generator */}
        <div className="bg-[#121418] border border-white/5 rounded overflow-hidden flex flex-col min-h-[400px]">
          <div className="bg-[#0B0C0E]/50 border-b border-white/5 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest">
              <User className="w-4 h-4 text-slate-500" />
              Alias Generator
            </div>
            <button
              onClick={generatePersona}
              disabled={loadingPersona}
              className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1"
            >
              {loadingPersona ? <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div> : <Cpu className="w-3 h-3" />}
              Generate Alias
            </button>
          </div>
          <div className="p-4 flex-1 bg-[#0B0C0E]/30 font-mono text-xs text-slate-300 leading-loose overflow-y-auto whitespace-pre-wrap">
             {!persona && !loadingPersona ? (
               <div className="h-full flex items-center justify-center text-slate-600 uppercase tracking-widest opacity-50">No Alias Generated</div>
             ) : loadingPersona ? (
               <div className="animate-pulse text-blue-400">Synthesizing deep-cover persona parameters...</div>
             ) : (
               persona
             )}
          </div>
        </div>

        {/* Bait Generator */}
        <div className="bg-[#121418] border border-white/5 rounded overflow-hidden flex flex-col h-full">
           <div className="bg-[#0B0C0E]/50 border-b border-white/5 px-4 py-3 flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest">
              <Mail className="w-4 h-4 text-orange-500" />
              Tarpit Draft Engine
           </div>
           
           <div className="p-4 flex flex-col gap-4 border-b border-white/5">
             <input
               value={scammerAddress}
               onChange={(e) => setScammerAddress(e.target.value)}
               placeholder="Scammer Email / Address (optional)"
               className="w-full bg-[#0B0C0E] border border-white/10 rounded px-4 py-2 text-sm text-orange-400 focus:outline-none focus:border-orange-500 transition-colors font-mono"
             />
             <input
               value={scammerInfo}
               onChange={(e) => setScammerInfo(e.target.value)}
               placeholder="Other Info / Context (optional)"
               className="w-full bg-[#0B0C0E] border border-white/10 rounded px-4 py-2 text-sm text-orange-400 focus:outline-none focus:border-orange-500 transition-colors font-mono"
             />
             <textarea
               value={scamMessage}
               onChange={(e) => setScamMessage(e.target.value)}
               placeholder="Paste the scammer's message here..."
               className="w-full h-32 bg-[#0B0C0E] border border-white/10 rounded px-4 py-3 text-sm text-orange-400 focus:outline-none focus:border-orange-500 transition-colors font-mono resize-none leading-relaxed"
             />
             <button
               onClick={generateBait}
               disabled={loadingBait || !scamMessage.trim()}
               className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white px-6 py-2 rounded text-xs font-bold transition-colors tracking-widest uppercase flex items-center justify-center gap-2"
             >
               {loadingBait ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
               ) : (
                 <><Crosshair className="w-4 h-4" /> Draft Engagement Payload</>
               )}
             </button>
           </div>

           <div className="p-4 flex-1 bg-[#0B0C0E]/30 relative font-mono text-xs text-slate-300 leading-loose whitespace-pre-wrap min-h-[200px]">
              {baitReply && (
                <button onClick={copyToClipboard} className="absolute top-2 right-2 bg-white/5 hover:bg-white/10 border border-white/10 p-1.5 rounded transition-colors text-slate-400 hover:text-white" title="Copy to clipboard">
                   {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
              {!baitReply && !loadingBait ? (
                <div className="h-full flex items-center justify-center text-slate-600 uppercase tracking-widest opacity-50">Reply payload will appear here</div>
              ) : loadingBait ? (
                <div className="animate-pulse text-orange-400">Drafting psychologically exhausting response...</div>
              ) : (
                baitReply
              )}
           </div>
        </div>

      </div>
    </div>
  );
}
