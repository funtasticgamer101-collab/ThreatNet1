import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { doc, getDoc, collection, query, orderBy, getDocs, setDoc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowUp, ArrowDown, User as UserIcon, MessageSquare, Flag, Edit, Copy, Check, Lock, Key, LockOpen, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { GoogleGenAI } from '@google/genai';
import CryptoJS from 'crypto-js';
import { containsDox, redactDox } from '../lib/security';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isModerator, isAdmin } = useAuth();
  
  const [report, setReport] = useState<any>(null);
  const [authorName, setAuthorName] = useState<string>('Unknown User');
  const [userVote, setUserVote] = useState<number>(0);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  const [takedownDraft, setTakedownDraft] = useState<string | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Decryption state
  const [passphrase, setPassphrase] = useState('');
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const rDoc = await getDoc(doc(db, 'reports', id));
        if (!rDoc.exists()) {
          setLoading(false);
          return;
        }
        const data = { id: rDoc.id, ...rDoc.data() } as any;
        setReport(data);

        // Load Author Profile
        const uDoc = await getDoc(doc(db, 'users', data.authorId));
        if (uDoc.exists()) {
          setAuthorName(uDoc.data().displayName);
        }

        // Load Comments
        const commentsQ = query(collection(db, 'reports', id, 'comments'), orderBy('createdAt', 'desc'));
        const commentsSnap = await getDocs(commentsQ);
        setComments(commentsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Load vote status if logged in
        if (user) {
          const voteDoc = await getDoc(doc(db, 'reports', id, 'votes', user.uid));
          if (voteDoc.exists()) {
             setUserVote(voteDoc.data().value);
          }
        }
        
        // Auto-decrypt if not encrypted
        if (!data.isEncrypted) {
           setDecryptedContent(data.content);
        }
      } catch (err) {
        console.error("Failed to load report", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, user]);

  const handleDecrypt = (e: React.FormEvent) => {
     e.preventDefault();
     setDecryptError('');
     try {
       const bytes = CryptoJS.AES.decrypt(report.content, passphrase);
       const originalText = bytes.toString(CryptoJS.enc.Utf8);
       
       if (!originalText) {
          setDecryptError("Invalid passphrase or corrupted payload.");
          return;
       }
       setDecryptedContent(originalText);
     } catch(e) {
       setDecryptError("Decryption failed. Invalid passphrase.");
     }
  };

  const handleVote = async (value: number) => {
    if (!user || !id || !report) return;
    
    const voteRef = doc(db, 'reports', id, 'votes', user.uid);
    const reportRef = doc(db, 'reports', id);

    let newVote = userVote === value ? 0 : value;

    try {
      await runTransaction(db, async (t) => {
        const pDoc = await t.get(reportRef);
        if (!pDoc.exists()) return;
        
        let { upvoteCount, downvoteCount } = pDoc.data();
        
        // Remove previous vote impact
        if (userVote === 1) upvoteCount--;
        if (userVote === -1) downvoteCount--;
        
        // Apply new vote impact
        if (newVote === 1) upvoteCount++;
        if (newVote === -1) downvoteCount++;

        t.update(reportRef, { upvoteCount, downvoteCount });
        if (newVote === 0) {
          t.delete(voteRef);
        } else {
          t.set(voteRef, { value: newVote });
        }
      });
      setUserVote(newVote);
      setReport({ ...report, 
        upvoteCount: report.upvoteCount + (newVote===1?1:0) - (userVote===1?1:0),
        downvoteCount: report.downvoteCount + (newVote===-1?1:0) - (userVote===-1?1:0)
      });
    } catch(err) {
       console.error("Vote failed", err);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !newComment.trim()) return;

    if (containsDox(newComment)) {
       alert("SECURITY CLEARANCE REJECTED: Potential DOXING detected. The text contains sensitive PII.");
       return;
    }

    const commentRef = doc(collection(db, 'reports', id, 'comments'));
    const newDoc = {
      authorId: user.uid,
      content: newComment.trim(),
      createdAt: Date.now()
    };
    
    try {
      await setDoc(commentRef, newDoc);
      setComments([{ id: commentRef.id, ...newDoc, authorDisplayName: 'You' }, ...comments]);
      setNewComment('');
    } catch(err) {
      console.error(err);
    }
  };

  const handleFlag = async () => {
     if (!user || !id) return;
     const flagRef = doc(collection(db, 'flags'));
     try {
       await setDoc(flagRef, {
         targetId: id,
         targetPath: `/reports/${id}`,
         reporterId: user.uid,
         reason: 'User flagged report via button',
         status: 'pending',
         createdAt: Date.now()
       });
       alert('Report flagged for moderation review.');
     } catch(err) {
       console.error(err);
     }
  };

  const generateTakedown = async () => {
    if (!isAdmin) return;
    setIsDrafting(true);
    setTakedownDraft(null);
    setCopied(false);
    
    try {
      const prompt = `You are an expert cyber security legal analyst. Based on this intelligence report, draft a formal Abuse and Takedown Notice addressed to a hosting provider or registrar.
      
Requirements:
1. Be extremely professional and authoritative.
2. Cite typical Acceptable Use Policy (AUP) or Terms of Service violations regarding malware/phishing.
3. CLEARLY LIST the specific Indicators of Compromise (domains, IP addresses) mentioned in the report.
4. Provide placeholders like [Hosting Provider], [Date], and [Your Name / Organization] for the user to fill out.
5. Emphasize the urgent threat to the public.

Report Title: ${report.title}
Report Category: ${report.category}
Report Content: ${decryptedContent || report.content}
Extracted IOCs (if any): ${(report.iocs || []).join(', ')}

Return ONLY the text of the legal notice.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });
      
      setTakedownDraft(response.text || "Failed to generate takedown notice.");
    } catch (err) {
      console.error("AI Takedown Generation failed", err);
      setTakedownDraft(`Error generating draft. Please review API limits. Details: ${err}`);
    } finally {
      setIsDrafting(false);
    }
  };

  const copyTakedown = () => {
    if (takedownDraft) {
      navigator.clipboard.writeText(takedownDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-mono text-[10px] animate-pulse">Loading report data...</div>;
  if (!report) return <div className="text-center p-12 text-slate-500 font-mono text-[10px]">RECORD NOT FOUND</div>;

  return (
    <div className="max-w-5xl mx-auto flex gap-6 flex-col md:flex-row">
       <div className="hidden md:flex flex-col items-center gap-2 pt-2 w-12 border-r border-white/5 bg-[#121418] rounded shrink-0 h-min pb-4 border-b">
         <button onClick={() => handleVote(1)} className={cn("p-2 transition-colors", userVote === 1 ? "text-green-500" : "text-slate-600 hover:text-slate-400")}>
           <ArrowUp className="w-5 h-5" />
         </button>
         <span className="font-mono font-bold text-sm text-white">{report.upvoteCount - report.downvoteCount}</span>
         <button onClick={() => handleVote(-1)} className={cn("p-2 transition-colors", userVote === -1 ? "text-red-500" : "text-slate-600 hover:text-slate-400")}>
           <ArrowDown className="w-5 h-5" />
         </button>
       </div>

       <div className="flex-1 space-y-6">
         <div className="bg-[#121418] border border-white/5 rounded overflow-hidden">
           <div className="border-b border-white/5 p-4 flex items-center justify-between bg-[#0B0C0E]/50">
             <div className="flex items-center gap-3 text-xs text-slate-500 font-mono flex-wrap">
               <span className="bg-white/5 px-2 py-0.5 rounded text-white font-bold border border-white/10">{report.category}</span>
               {report.threatScore !== undefined && (
                 <span className={cn("text-[10px] px-2 py-0.5 rounded font-bold uppercase border flex items-center gap-1",
                    report.threatScore >= 80 ? "bg-red-500/10 text-red-400 border-red-500/20" :
                    report.threatScore >= 50 ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                    "bg-green-500/10 text-green-400 border-green-500/20"
                 )}>
                   SCORE: {report.threatScore}
                 </span>
               )}
               <span>ID: {report.id.substring(0,8)}</span>
               <span>•</span>
               <span>{report.createdAt ? formatDistanceToNow(report.createdAt, { addSuffix: true }) : ''}</span>
               {report.isEncrypted && (
                 <span className="flex items-center gap-1 text-red-500 font-bold border-l border-white/10 pl-3">
                   <Lock className="w-3 h-3" /> TLP:RED
                 </span>
               )}
             </div>
             <div className="flex gap-2">
               {isAdmin && (
                 <button onClick={generateTakedown} disabled={isDrafting} className="hidden sm:flex items-center gap-1 text-slate-500 hover:text-blue-500 transition-colors text-[10px] uppercase font-bold tracking-widest disabled:opacity-50">
                   {isDrafting ? <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> : <Edit className="w-3 h-3" />} Draft Takedown
                 </button>
               )}
               {user && (
                 <button onClick={handleFlag} className="flex items-center gap-1 text-slate-500 hover:text-red-500 transition-colors text-[10px] uppercase font-bold tracking-widest" title="Flag report">
                   <Flag className="w-3 h-3" /> Flag
                 </button>
               )}
             </div>
           </div>
           
           <div className="p-6">
             <div className="flex items-center justify-between mb-6">
               <h1 className="text-xl font-bold text-white tracking-tight">{report.title}</h1>
               <div className="text-right">
                 <div className="text-xs font-bold text-white">{authorName}</div>
                 <div className="text-[10px] text-slate-500 uppercase font-mono tracking-widest">Origin</div >
               </div>
             </div>

             {report.iocs && report.iocs.length > 0 && (
               <div className="mb-6 space-y-2">
                 <h3 className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Extracted IOCs</h3>
                 <div className="flex flex-wrap gap-2">
                   {report.iocs.map((ioc: string, idx: number) => (
                      <span key={idx} className="text-xs font-mono bg-[#0B0C0E] text-red-400 border border-red-500/20 px-2 py-1 rounded select-all cursor-text">{ioc}</span>
                   ))}
                 </div>
               </div>
             )}
             
             {report.isEncrypted && !decryptedContent ? (
                <div className="bg-[#0B0C0E] border border-red-500/20 rounded p-6 font-mono text-sm flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                     <Lock className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-white font-bold uppercase tracking-widest">Encrypted Payload</h3>
                    <p className="text-slate-500 text-xs mt-1">This intelligence is strictly TLP:RED. Enter passphrase to decrypt locally.</p>
                  </div>
                  {decryptError && <div className="text-red-400 text-xs border border-red-500/20 bg-red-500/5 px-3 py-1 rounded">{decryptError}</div>}
                  <form onSubmit={handleDecrypt} className="flex items-center gap-2 w-full max-w-sm">
                    <input 
                      type="password"
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Passphrase"
                      className="flex-1 bg-[#121418] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500 text-xs"
                    />
                    <button type="submit" className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
                      <LockOpen className="w-3 h-3" /> Unlock
                    </button>
                  </form>
                  <p className="text-[10px] text-slate-600 uppercase pt-2 text-center break-all">Ciphertext Blob:<br/>{report.content.substring(0,64)}...</p>
                </div>
             ) : (
                <div className="bg-[#0B0C0E] border border-white/5 rounded p-4 font-mono text-sm leading-relaxed text-slate-300 overflow-x-auto whitespace-pre-wrap relative">
                  {report.isEncrypted && <div className="absolute top-2 right-2 text-[10px] text-red-500 font-bold border border-red-500/20 bg-red-500/10 px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-widest"><LockOpen className="w-3 h-3" /> Decrypted</div>}
                  {decryptedContent}
                </div>
             )}
           </div>
         </div>

         {/* AI Generated Takedown Draft */}
         {takedownDraft && (
            <div className="bg-[#121418] border border-blue-500/30 rounded p-6 shadow-xl relative">
              <div className="absolute top-0 right-0 p-4">
                 <button onClick={copyTakedown} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest p-1.5 rounded transition-colors bg-blue-500/10 hover:bg-blue-500/20">
                   {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                   {copied ? 'Copied' : 'Copy'}
                 </button>
              </div>
              <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Edit className="w-4 h-4" /> AI Generated Takedown Notice
              </h2>
              <div className="bg-[#0B0C0E] p-4 rounded text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed border border-white/5 overflow-y-auto max-h-[400px]">
                {takedownDraft}
              </div>
            </div>
         )}

         {/* Comments */}
         {report.allowComments ? (
            <div className="bg-[#121418] border border-white/5 rounded p-6">
              <h2 className="text-sm border-b border-white/5 pb-4 mb-4 font-bold tracking-widest text-white uppercase flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                Community Intel
              </h2>
              {user && (
                <form onSubmit={submitComment} className="flex flex-col gap-3 mb-8">
                  <textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Provide additional indicators, context, or corrections..."
                    rows={3}
                    className="w-full bg-[#0B0C0E] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600 font-mono resize-none"
                  />
                  <div className="flex justify-end">
                    <button type="submit" disabled={!newComment.trim()} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-1.5 rounded text-xs font-bold transition-colors uppercase tracking-widest">
                      Broadcast
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-slate-600 text-[10px] font-mono uppercase text-center py-4">0 Logs Available</p>
                ) : comments.map(c => (
                  <div key={c.id} className="bg-[#0B0C0E] border border-white/5 rounded p-3">
                     <div className="flex items-center gap-2 text-[10px] uppercase font-mono text-slate-500 mb-2">
                        <UserIcon className="w-3 h-3" />
                        <span className="font-bold text-white">Analyst_{c.authorId.substring(0, 5)}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(c.createdAt)}</span>
                     </div>
                     <p className="text-slate-300 text-xs font-mono whitespace-pre-wrap leading-relaxed">{c.content}</p>
                  </div>
                ))}
              </div>
            </div>
         ) : (
           <div className="text-center p-6 border border-white/5 border-dashed rounded text-slate-500 text-[10px] font-mono uppercase tracking-widest">
              Analyst has disabled collaborative logs for this report.
           </div>
         )}
       </div>
    </div>
  );
}
