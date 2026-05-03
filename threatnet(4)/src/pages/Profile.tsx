import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User as UserIcon, Save, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, userData } = useAuth();
  
  const [bio, setBio] = useState('');
  const [organization, setOrganization] = useState('');
  const [focusAreas, setFocusAreas] = useState('');
  const [saving, setSaving] = useState(false);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    if (userData) {
      setBio(userData.bio || '');
      setOrganization(userData.organization || '');
      setFocusAreas(userData.focusAreas || '');
    }
  }, [userData]);

  useEffect(() => {
    if (!user) return;
    async function loadReports() {
       const q = query(collection(db, 'reports'), where('authorId', '==', user.uid));
       const snap = await getDocs(q);
       const docs = snap.docs.map(d => ({id: d.id, ...d.data()}));
       docs.sort((a: any, b: any) => b.createdAt - a.createdAt);
       setReports(docs);
    }
    loadReports();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
       await updateDoc(doc(db, 'users', user.uid), {
         bio,
         organization,
         focusAreas,
         updatedAt: Date.now()
       });
       alert('Profile saved.');
    } catch (err) {
       console.error("Failed to save profile", err);
    } finally {
       setSaving(false);
    }
  };

  const isChanged = bio !== (userData?.bio || '') || organization !== (userData?.organization || '') || focusAreas !== (userData?.focusAreas || '');

  if (!user) return <div className="text-center p-12 text-slate-500 font-mono text-[10px] uppercase">User Not Verified</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex items-center gap-6 p-6 bg-[#121418] border border-white/5 rounded">
        <img 
          src={userData?.photoUrl || `https://ui-avatars.com/api/?name=${userData?.displayName}&background=random`} 
          alt="Avatar" 
          className="w-16 h-16 rounded border border-white/10 bg-gradient-to-br from-[#0B0C0E] to-[#121418]"
        />
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
             {userData?.displayName}
             {userData?.organization && (
               <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">@{userData.organization}</span>
             )}
            {userData?.role !== 'user' && (
               <span className="text-[10px] bg-blue-600 border border-blue-500 text-white px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                 {userData?.role}
               </span>
            )}
          </h1>
          <p className="text-slate-500 font-mono text-[10px] uppercase mt-1">UUID: {user.uid}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="bg-[#121418] border border-white/5 rounded overflow-hidden flex flex-col h-min">
          <div className="bg-[#0B0C0E]/50 px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-bold text-white uppercase tracking-widest">Configuration</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase">Affiliated Organization</label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. CrowdSec, Independent"
                className="w-full bg-[#0B0C0E] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors font-mono placeholder-slate-600"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase">Security Focus Areas</label>
              <input
                type="text"
                value={focusAreas}
                onChange={(e) => setFocusAreas(e.target.value)}
                placeholder="e.g. Ransomware, Reverse Engineering"
                className="w-full bg-[#0B0C0E] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors font-mono placeholder-slate-600"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase">Analyst Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Log your expertise and background..."
                className="w-full bg-[#0B0C0E] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors font-mono resize-none placeholder-slate-600"
              />
            </div>
            <button 
              onClick={saveProfile} 
              disabled={saving || !isChanged}
              className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white px-4 py-2 rounded text-xs font-bold transition-colors border border-white/10 tracking-widest uppercase"
            >
              {saving ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> : <Save className="w-3 h-3" />}
              Commit Changes
            </button>
          </div>
        </section>

        <section className="bg-[#121418] border border-white/5 rounded overflow-hidden flex flex-col">
          <div className="bg-[#0B0C0E]/50 px-4 py-3 border-b border-white/5">
             <h2 className="text-xs font-bold text-white uppercase tracking-widest">Submitted Intelligence</h2>
          </div>
          <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
            {reports.length === 0 ? (
              <p className="text-slate-500 text-[10px] uppercase font-mono text-center py-4">0 Logs Found</p>
            ) : reports.map(r => (
              <Link to={`/report/${r.id}`} key={r.id} className="block bg-[#0B0C0E] border border-white/5 rounded p-3 hover:border-white/20 transition-colors">
                 <div className="flex items-center justify-between mb-1">
                   <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/10 text-slate-300 bg-white/5">
                     {r.category.toUpperCase()}
                   </span>
                   <span className={`text-[10px] font-bold font-mono tracking-widest uppercase ${r.status==='approved' || r.status==='starred' ? 'text-green-500' : r.status==='rejected' ? 'text-red-500' : 'text-yellow-500'}`}>
                     {r.status}
                   </span>
                 </div>
                 <h3 className="text-sm font-bold text-white truncate">{r.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
