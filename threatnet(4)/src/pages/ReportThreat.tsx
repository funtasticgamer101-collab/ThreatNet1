import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { GoogleGenAI } from '@google/genai';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AlertCircle, FileText, Send, Sparkles, Lock, Key, ShieldAlert } from 'lucide-react';
import CryptoJS from 'crypto-js';
import { containsDox } from '../lib/security';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const CATEGORIES = ["Malware", "Phishing", "Scams", "Vulnerabilities"];

export default function ReportThreat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState('');
  
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [allowComments, setAllowComments] = useState(true);
  
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [passphrase, setPassphrase] = useState('');

  const handleOptimize = async () => {
    if (!content.trim()) return;
    setOptimizing(true);
    setError('');
    
    try {
      const aiPrompt = `You are an expert cyber security threat analyst. 
Please rewrite and optimize the following threat intelligence description to be heavily analytical, highly structured, and easy for other analysts to digest.
Format the output with clear headers and bullet points if necessary. Emphasize indicators to watch out for. DO NOT make up fake indicators, strictly enhance the readability and professional tone of the provided text.

Original text:
${content}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: aiPrompt
      });

      if (response.text) {
        setContent(response.text.trim());
      }
    } catch (err: any) {
      console.error("AI Optimization error:", err);
      setError("AI Optimization failed: " + (err.message || "Unknown error"));
    } finally {
      setOptimizing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Please sign in to submit a report.");
      return;
    }

    if (containsDox(content) || containsDox(title)) {
      setError("SECURITY CLEARANCE REJECTED: Potential DOXING detected (SSN or Credit Card data). This platform blocks unauthorized PII sharing.");
      return;
    }
    
    if (isEncrypted && passphrase.length < 6) {
      setError("Encryption passphrase must be at least 6 characters.");
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // AI Moderation & IOC Extraction Step
      let aiModerationStatus = "clean";
      let extractedIocs: string[] = [];
      let initialThreatScore = 0;
      let finalContent = content;
      
      try {
        const aiPrompt = `Analyze the following user-submitted threat report. 
Your goal is to perform three tasks:
1. Content Moderation: Determine if it contains ANY PII/Doxxing (full addresses, personal phone numbers, non-public personal emails) or NSFW content. Note: Scammer emails or malicious IPs are ALLOWED.
2. IOC Extraction: Extract all actionable Indicators of Compromise (domains, IP addresses, crypto wallets, malicious URLs, file hashes).
3. Threat Scoring: Evaluate the severity of the threat on a scale of 0 to 100 based on potential impact and damage.

Return ONLY a JSON object with this exact structure:
{"status": "clean" | "flagged", "iocs": ["array", "of", "strings", "here"], "threatScore": 85}

Report Title: ${title}
Report Content: ${content}

If no IOCs are found, return an empty array for iocs.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: aiPrompt,
          config: {
            responseMimeType: "application/json",
          }
        });

        const jText = response.text?.trim() || "{}";
        const parsed = JSON.parse(jText);
        if (parsed.status === "flagged") {
          aiModerationStatus = "flagged";
        }
        if (Array.isArray(parsed.iocs)) {
          // ensure no ridiculously long strings are saved
          extractedIocs = parsed.iocs.map((i: string) => i.substring(0, 100));
        }
        if (typeof parsed.threatScore === 'number') {
          initialThreatScore = Math.max(0, Math.min(100, parsed.threatScore));
        }
      } catch (aiErr) {
        console.error("AI Mod error:", aiErr);
        aiModerationStatus = "pending";
      }

      if (isEncrypted) {
         finalContent = CryptoJS.AES.encrypt(content, passphrase).toString();
      }

      const reportRef = doc(collection(db, 'reports'));
      
      await setDoc(reportRef, {
        category,
        title,
        content: finalContent,
        authorId: user.uid,
        status: 'pending', 
        isStarred: false,
        allowComments,
        upvoteCount: 0,
        downvoteCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        aiModerationStatus,
        iocs: extractedIocs,
        threatScore: initialThreatScore,
        isEncrypted
      });

      // Redirect to feed
      navigate('/feed');
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col mb-8 p-6 bg-[#121418] border border-white/5 rounded text-center items-center justify-center space-y-4 max-w-2xl mx-auto mt-8">
        <AlertCircle className="w-12 h-12 text-slate-500" />
        <h2 className="text-xl font-bold text-white uppercase tracking-tight">Authentication Required</h2>
        <p className="text-slate-400 text-sm">You must be authenticated to submit intelligence reports.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-[#121418] border border-white/5 rounded overflow-hidden">
      <div className="bg-[#0B0C0E]/50 px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-500" />
          <h1 className="text-lg font-bold text-white tracking-tight uppercase">Submit Threat Intelligence</h1>
        </div>
        <div className="text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/5 flex items-center gap-2">
          <span>AI ASSIST: <span className="text-blue-400">IOC PARSING ACTIVE</span></span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 text-red-500 px-6 py-3 text-xs font-mono">
          <span className="font-bold">ERROR:</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
             <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase">Vector Category</label>
             <select 
               value={category}
               onChange={(e) => setCategory(e.target.value)}
               className="w-full bg-[#0B0C0E] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
             >
               {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>

          <div className="space-y-1">
             <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase">Identified Threat</label>
             <input 
               required
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               placeholder="e.g. Malicious PDF dropping AgentTesla"
               className="w-full bg-[#0B0C0E] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
             />
          </div>
        </div>

        <div className="bg-[#0B0C0E]/50 border border-white/5 rounded p-4 space-y-4">
          <label className="flex items-center gap-2 cursor-pointer group w-max">
             <input 
               type="checkbox" 
               checked={isEncrypted}
               onChange={(e) => setIsEncrypted(e.target.checked)}
               className="w-4 h-4 rounded bg-[#0B0C0E] border-white/10 text-red-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
             />
             <Lock className="w-4 h-4 text-red-500" />
             <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors uppercase tracking-widest">TLP:RED (Client-Side Encryption)</span>
          </label>
          
          {isEncrypted && (
             <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase flex items-center gap-1">
                   <Key className="w-3 h-3 text-red-400"/> Encryption Passphrase
                </label>
                <input 
                  required={isEncrypted}
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter a strong passphrase to encrypt payload before transmission..."
                  className="w-full bg-[#0B0C0E] border border-red-500/20 rounded px-3 py-2 text-sm text-red-400 focus:outline-none focus:border-red-500 transition-colors placeholder:text-slate-600 font-mono"
                />
             </div>
          )}
        </div>

        <div className="space-y-1">
           <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase flex justify-between gap-4">
             <span>Context & Technical Evidence</span>
             <div className="flex items-center gap-3">
               {content.length > 0 && (
                 <button 
                   type="button" 
                   onClick={handleOptimize} 
                   disabled={optimizing}
                   className="text-blue-400 hover:text-blue-300 flex items-center gap-1 disabled:opacity-50 transition-colors font-bold bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/20"
                 >
                   {optimizing ? (
                     <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                   ) : (
                     <Sparkles className="w-3 h-3" />
                   )}
                   OPTIMIZE TEXT
                 </button>
               )}
               <span className="text-slate-600 hidden sm:inline">IOCs will be extracted</span>
             </div>
           </label>
           <textarea 
             required
             value={content}
             onChange={(e) => setContent(e.target.value)}
             rows={10}
             placeholder="Paste raw log data, URLs, hashes, or Bitcoin addresses here. AI will detect and isolate structured indicators automatically upon submission."
             className="w-full bg-[#0B0C0E] border border-white/10 rounded px-3 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600 font-mono resize-y"
           />
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-6">
           <label className="flex items-center gap-2 cursor-pointer group">
             <input 
               type="checkbox" 
               checked={allowComments}
               onChange={(e) => setAllowComments(e.target.checked)}
               className="w-4 h-4 rounded bg-[#0B0C0E] border-white/10 text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
             />
             <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">Enable Community Comments</span>
           </label>

           <button 
             type="submit" 
             disabled={loading || optimizing}
             className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2 rounded text-xs font-bold transition-colors tracking-widest flex items-center gap-2"
           >
             {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
             ) : (
               <>
                <Send className="w-3 h-3" /> TRANSMIT & ANALYZE
               </>
             )}
           </button>
        </div>
      </form>
    </div>
  );
}
