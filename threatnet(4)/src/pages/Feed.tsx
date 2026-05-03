import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs, where, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { MessageSquare, Clock } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';

interface Report {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  isStarred: boolean;
  upvoteCount: number;
  downvoteCount: number;
  createdAt: number;
  authorId: string;
  threatScore?: number;
}

export default function Feed() {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter');
  const searchQ = searchParams.get('search');
  const { user, isModerator } = useAuth();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      try {
        let results: Report[] = [];
        
        if (isModerator) {
           let q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(50));
           if (filter === 'starred') {
             q = query(collection(db, 'reports'), where('isStarred', '==', true), orderBy('createdAt', 'desc'), limit(50));
           } else if (filter) {
             q = query(collection(db, 'reports'), where('category', '==', filter), orderBy('createdAt', 'desc'), limit(50));
           }
           const snapshot = await getDocs(q);
           results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
        } else {
           // For standard users, we MUST filter by status to satisfy firestore allow list: if resource.data.status in ...
           // To avoid needing a composite index (since we can't create one locally easily), we omit orderBy and sort in UI.
           let q = query(collection(db, 'reports'), where('status', 'in', ['approved', 'starred']), limit(100));
           if (filter === 'starred') {
             q = query(collection(db, 'reports'), where('status', 'in', ['approved', 'starred']), where('isStarred', '==', true), limit(100));
           } else if (filter) {
             q = query(collection(db, 'reports'), where('status', 'in', ['approved', 'starred']), where('category', '==', filter), limit(100));
           }
           const snapshot = await getDocs(q);
           results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
           
           if (user) {
             const ownQ = query(collection(db, 'reports'), where('authorId', '==', user.uid), where('status', '==', 'pending'), limit(50));
             try {
                const ownSnap = await getDocs(ownQ);
                results = [...results, ...ownSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report))];
             } catch(e) {
                console.error("Failed fetching own pending reports", e);
             }
           }
           // Sort in memory
           results.sort((a,b) => b.createdAt - a.createdAt);
        }

        if (searchQ) {
          const lowerQ = searchQ.toLowerCase();
          results = results.filter(r => r.title.toLowerCase().includes(lowerQ));
        }
        
        // Remove duplicates if any
        const unique = Array.from(new Map(results.map(item => [item.id, item])).values());
        setReports(unique.slice(0, 50));
      } catch (err) {
        console.error("Failed to fetch reports", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, [filter, searchQ, isModerator, user]);

  const categoryColors: Record<string, string> = {
    'Malware': 'bg-red-900/20 text-red-400 border-red-500/30',
    'Phishing': 'bg-orange-900/20 text-orange-400 border-orange-500/30',
    'Scams': 'bg-yellow-900/20 text-yellow-500 border-yellow-500/30',
    'Vulnerabilities': 'bg-emerald-900/20 text-emerald-400 border-emerald-500/30',
  };

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex items-center justify-between px-8 py-6 border-b border-emerald-900/30">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black text-emerald-50 tracking-tight">
            {filter === 'starred' ? "The STAR Vault" : filter ? `${filter} Intelligence Feed` : searchQ ? "Search Results" : "Intelligence Feed"}
          </h2>
          {filter && <span className="px-3 py-1 bg-emerald-900/30 border border-emerald-500/30 rounded-lg text-xs uppercase font-bold tracking-wider text-emerald-400">Category: {filter}</span>}
        </div>
        <Link to="/submit" className="bg-emerald-600 hover:bg-emerald-500 text-black px-6 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-emerald-900/20 hover:scale-105">Submit New Report</Link>
      </div>

      <div className="flex-1 p-8 space-y-6 overflow-y-auto w-full max-w-5xl mx-auto">
        {loading ? (
          <div className="text-sm font-medium text-emerald-100/50 animate-pulse text-center mt-10">Loading intelligence feed...</div>
        ) : reports.length === 0 ? (
          <div className="bg-[#0a0a0a] border border-emerald-900/50 border-dashed rounded-2xl p-8 text-center mt-10">
            <div className="text-sm uppercase font-bold text-emerald-600 mb-2 tracking-widest">Database Log</div>
            <div className="text-xs font-mono text-emerald-100/40">0 records matched your query</div>
          </div>
        ) : (
          reports.map((report) => (
            <Link 
              key={report.id} 
              to={`/report/${report.id}`}
              className={cn("flex bg-[#0a0a0a] border rounded-2xl cursor-pointer transition-all hover:border-emerald-500/50 overflow-hidden shadow-lg hover:shadow-emerald-900/20 group", report.status === 'pending' ? 'border-orange-500/40' : 'border-emerald-900/30')}
            >
              <div className="w-16 border-r border-emerald-900/30 flex flex-col items-center py-6 gap-3 bg-black/50 group-hover:bg-emerald-950/20 transition-colors">
                <span className="text-emerald-700 text-sm">▲</span>
                <span className="font-black text-sm text-emerald-50">
                  {report.upvoteCount - report.downvoteCount}
                </span>
                <span className="text-emerald-700 text-sm">▼</span>
              </div>
              <div className="flex-1 p-6">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className={cn("text-xs px-2.5 py-1 rounded-md font-bold border tracking-wider", categoryColors[report.category] || "text-emerald-100/50 bg-emerald-950/30 border-emerald-900/50")}>
                    {report.category.toUpperCase()}
                  </span>
                  {report.threatScore !== undefined && (
                    <span className={cn("text-xs px-2.5 py-1 rounded-md font-bold border flex items-center gap-1 tracking-wider", 
                       report.threatScore >= 80 ? "bg-red-900/20 text-red-400 border-red-500/30" :
                       report.threatScore >= 50 ? "bg-orange-900/20 text-orange-400 border-orange-500/30" :
                       "bg-emerald-900/20 text-emerald-400 border-emerald-500/30"
                    )}>
                       SCORE: {report.threatScore}
                    </span>
                  )}
                  {report.isStarred && (
                    <span className="text-xs font-bold text-yellow-500 flex items-center gap-1 tracking-wider">★ STAR</span>
                  )}
                  {report.status === 'pending' && (
                    <span className="text-[10px] font-bold text-orange-400 flex items-center gap-1.5 bg-orange-500/10 px-2 py-1 rounded-md border border-orange-500/20 uppercase tracking-widest">
                      <Clock className="w-3 h-3" /> PENDING REVIEW
                    </span>
                  )}
                  <h4 className="text-base sm:text-lg font-black text-emerald-50 w-full mt-1 group-hover:text-emerald-400 transition-colors">{report.title}</h4>
                </div>
                <div className="text-sm text-emerald-100/60 leading-relaxed mb-4 line-clamp-2 font-medium">
                  {report.content}
                </div>
                <div className="flex items-center gap-6 text-xs font-medium text-emerald-700 uppercase tracking-wider">
                  <span className="flex items-center gap-2"><span className={cn("w-2 h-2 rounded-full", report.status === 'pending' ? "bg-orange-500" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]")}></span> ACTIVE</span>
                  <span>{report.createdAt ? formatDistanceToNow(report.createdAt, { addSuffix: true }) : ''}</span>
                  <span className="text-emerald-500 flex items-center gap-1.5 group-hover:text-emerald-400 transition-colors"><MessageSquare className="w-4 h-4" /> View Thread</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
