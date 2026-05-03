import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { useActiveDefense } from '../components/ActiveDefenseContext';
import { collection, query, where, getDocs, updateDoc, doc, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Shield, FileWarning, Check, X, ShieldAlert, Flag, UploadCloud, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { seedHistoricalThreats } from '../lib/seedData';

export default function AdminPanel() {
  const { user, isModerator, isAdmin } = useAuth();
  const { isUnderAttackMode, setUnderAttackMode } = useActiveDefense();
  
  const [pendingReports, setPendingReports] = useState<any[]>([]);
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!isModerator) return;
    async function loadData() {
      try {
        // Load pending reports
        const pQ = query(collection(db, 'reports'), where('status', '==', 'pending'), limit(20));
        const pSnap = await getDocs(pQ);
        setPendingReports(pSnap.docs.map(d => ({id: d.id, ...d.data()})));

        // Load unresolved flags
        const fQ = query(collection(db, 'flags'), where('status', '==', 'pending'), limit(20));
        const fSnap = await getDocs(fQ);
        setFlags(fSnap.docs.map(d => ({id: d.id, ...d.data()})));

      } catch(err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isModerator]);

  const updateReportStatus = async (reportId: string, status: string, isStarred: boolean = false) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status,
        isStarred,
        updatedAt: Date.now()
      });
      setPendingReports(pendingReports.filter(r => r.id !== reportId));
    } catch(err) {
      console.error(err);
    }
  };

  const resolveFlag = async (flagId: string) => {
    try {
      await updateDoc(doc(db, 'flags', flagId), {
        status: 'resolved',
        updatedAt: Date.now()
      });
      setFlags(flags.filter(f => f.id !== flagId));
    } catch(err) {
       console.error(err);
    }
  };

  const handleSeed = async () => {
    if (!user || !isAdmin) return;
    if (confirm("Execute STAR Vault seeding protocol? This will inject historical threat data into the database.")) {
      setSeeding(true);
      try {
        await seedHistoricalThreats(user.uid);
        alert("Operation successful. STAR Vault seeded.");
      } catch (e) {
        console.error(e);
        alert("Operation failed. Check logs.");
      } finally {
        setSeeding(false);
      }
    }
  };

  if (!isModerator) return <div className="text-center p-12 text-red-500 font-bold font-mono uppercase tracking-widest text-xs">Access Denied. Moderation team only.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-[#0a0a0a] border border-emerald-900/30 rounded-2xl px-8 py-6 shadow-lg">
        <div>
          <h1 className="text-xl font-black tracking-tight text-emerald-50 flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-red-500 drop-shadow-md" /> Moderation Console
          </h1>
          <p className="text-emerald-100/50 text-xs uppercase font-medium tracking-widest mt-1">Approve, reject, and monitor user-submitted intelligence</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
           {isAdmin && (
             <>
               <button 
                 onClick={() => setUnderAttackMode(!isUnderAttackMode)}
                 className={`text-xs font-bold px-4 py-2 rounded-xl uppercase flex items-center gap-2 transition-all shadow-md ${isUnderAttackMode ? 'bg-red-600 hover:bg-red-700 text-white border-red-500 shadow-red-900/50' : 'bg-black text-emerald-100/70 hover:text-red-400 border border-emerald-900/30 hover:border-red-900/50'}`}
                 title="Toggle Active Defense E2EE Protocol"
               >
                 <Lock className="w-4 h-4" /> {isUnderAttackMode ? 'DISABLE E2EE SHIELD' : 'ENGAGE SHIELD'}
               </button>
               <button 
                 onClick={handleSeed}
                 disabled={seeding}
                 className="text-xs font-bold bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-xl uppercase flex items-center gap-2 transition-all mr-2 disabled:opacity-50"
                 title="Seed Historical Data"
               >
                 {seeding ? <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div> : <UploadCloud className="w-4 h-4" />} 
                 Inject STAR Data
               </button>
             </>
           )}
           <span className="text-xs font-bold bg-emerald-950/30 border border-emerald-900/50 text-emerald-50 px-3 py-2 rounded-xl uppercase flex items-center gap-2"><FileWarning className="w-4 h-4 text-orange-500"/> {pendingReports.length} Pending</span>
           <span className="text-xs font-bold bg-emerald-950/30 border border-emerald-900/50 text-emerald-50 px-3 py-2 rounded-xl uppercase flex items-center gap-2"><Flag className="w-4 h-4 text-red-500"/> {flags.length} Flags</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Reports */}
        <section className="bg-[#0a0a0a] border border-emerald-900/30 rounded-2xl overflow-hidden flex flex-col shadow-lg">
          <div className="bg-black/50 border-b border-emerald-900/30 px-6 py-4 flex items-center gap-3">
            <FileWarning className="w-5 h-5 text-orange-500" />
            <h2 className="text-sm font-bold text-emerald-50 uppercase tracking-widest">Pending Reports</h2>
          </div>
          <div className="p-6 space-y-4 max-h-[800px] overflow-y-auto">
            {loading ? <p className="text-emerald-100/50 text-xs animate-pulse font-medium">Querying database...</p> : pendingReports.length === 0 ? <p className="text-emerald-100/50 text-xs font-medium uppercase tracking-wider">Queue is empty.</p> : null}
            {pendingReports.map(r => (
              <div key={r.id} className="bg-black border border-emerald-900/30 rounded-xl p-5 space-y-4 relative overflow-hidden group hover:border-emerald-500/50 transition-colors shadow-md">
                {r.aiModerationStatus === 'flagged' && (
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600 drop-shadow-md" title="AI Flagged" />
                )}
                
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] bg-emerald-900/20 text-emerald-300 font-bold border border-emerald-500/20 px-2 py-1 rounded-md uppercase tracking-wider">{r.category}</span>
                    {r.aiModerationStatus === 'flagged' && <span className="text-[10px] bg-red-500/20 text-red-400 font-bold px-2 py-1 rounded-md border border-red-500/30 uppercase tracking-widest">AI ALERT</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateReportStatus(r.id, 'approved')} className="text-emerald-100/50 hover:text-emerald-400 hover:bg-emerald-900/20 p-2 rounded-lg transition-colors border border-transparent hover:border-emerald-500/30" title="Approve">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => updateReportStatus(r.id, 'rejected')} className="text-emerald-100/50 hover:text-red-400 hover:bg-red-900/20 p-2 rounded-lg transition-colors border border-transparent hover:border-red-500/30" title="Reject">
                      <X className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <button onClick={() => updateReportStatus(r.id, 'starred', true)} className="text-emerald-100/50 hover:text-yellow-400 hover:bg-yellow-900/20 p-2 rounded-lg transition-colors border border-transparent hover:border-yellow-500/30" title="Approve & Star">
                        <Shield className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                   <h3 className="font-bold text-emerald-50 text-base mb-2">{r.title}</h3>
                   <p className="text-sm font-medium text-emerald-100/70 line-clamp-3 bg-[#0a0a0a] p-3 rounded-lg border border-emerald-900/30 leading-relaxed">{r.content}</p>
                </div>
                <div className="text-right pt-2 border-t border-emerald-900/30">
                  <Link to={`/report/${r.id}`} className="text-xs font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-colors">Inspect Origin →</Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Action Flags */}
        <section className="bg-[#0a0a0a] border border-emerald-900/30 rounded-2xl overflow-hidden flex flex-col shadow-lg">
          <div className="bg-black/50 border-b border-emerald-900/30 px-6 py-4 flex items-center gap-3">
             <Flag className="w-5 h-5 text-red-500" />
             <h2 className="text-sm font-bold text-emerald-50 uppercase tracking-widest">User Flags</h2>
          </div>
          <div className="p-6 space-y-4 max-h-[800px] overflow-y-auto">
             {loading ? <p className="text-emerald-100/50 text-xs animate-pulse font-medium">Querying database...</p> : flags.length === 0 ? <p className="text-emerald-100/50 text-xs font-medium uppercase tracking-wider">Queue is empty.</p> : null}
             {flags.map(f => (
               <div key={f.id} className="bg-black border border-emerald-900/30 rounded-xl p-5 flex flex-col gap-4 shadow-md">
                 <div className="text-xs tracking-widest font-bold uppercase text-emerald-100/60">
                   Target: <span className="font-mono text-emerald-400 lowercase">{f.targetPath}</span>
                 </div>
                 <div className="bg-[#0a0a0a] border border-emerald-900/30 p-3 rounded-lg text-sm text-emerald-50 font-medium">
                   {f.reason}
                 </div>
                 <div className="flex justify-between items-center mt-2 pt-4 border-t border-emerald-900/30">
                   <Link to={f.targetPath} className="text-xs font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-colors">Inspect Record →</Link>
                   <button onClick={() => resolveFlag(f.id)} className="text-xs bg-emerald-900/20 hover:bg-emerald-900/40 border border-emerald-500/30 text-emerald-400 font-bold px-4 py-2 rounded-lg transition-all uppercase tracking-widest hover:scale-105 active:scale-95">
                     Resolve Flag
                   </button>
                 </div>
               </div>
             ))}
          </div>
        </section>
      </div>
    </div>
  );
}
