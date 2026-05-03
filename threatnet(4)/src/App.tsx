import React from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { ActiveDefenseProvider, useActiveDefense } from './components/ActiveDefenseContext';
import { signInWithGoogle, signOut } from './lib/firebase';
import { Shield, ShieldAlert, LayoutDashboard, Flag, User, LogOut, Search, PlusCircle, AlertTriangle, Bug, Ghost, Globe, Terminal, Crosshair, Lock } from 'lucide-react';
import Home from './pages/Home';
import Feed from './pages/Feed';
import ReportThreat from './pages/ReportThreat';
import ReportDetail from './pages/ReportDetail';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import CommonThreats from './pages/CommonThreats';
import AnalysisLab from './pages/AnalysisLab';
import ActiveDefense from './pages/ActiveDefense';
import { cn } from './lib/utils';

import { CloudflareShield } from './components/CloudflareShield';
import FBIWanted from './pages/FBIWanted';

function Navbar() {
  const { user, userData, isModerator } = useAuth();
  const { isUnderAttackMode, encryptionLevel } = useActiveDefense();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 z-50 w-full bg-[#0a0a0a] border-b border-emerald-900/30 text-emerald-100">
      <div className="flex h-16 items-center px-6 justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white tracking-tighter shadow-lg shadow-emerald-900/20", isUnderAttackMode ? "bg-red-600 animate-pulse" : "bg-emerald-600")}>
              <ShieldAlert className="h-6 w-6" />
            </div>
            <span className="font-black text-lg tracking-widest text-white uppercase hidden md:block">ThreatNet</span>
          </Link>

          <div className="h-4 w-[1px] bg-white/10 mx-2 hidden sm:block"></div>

          {/* Search Bar */}
          <div className="relative hidden sm:block">
            <form onSubmit={(e) => { e.preventDefault(); const target = e.target as any; navigate(`/feed?search=${target.search.value}`); }}>
              <input
                name="search"
                type="text"
                placeholder={isUnderAttackMode ? "REDUNDANT ENCRYPTION ACTIVE..." : "Search intelligence database..."}
                className={cn("bg-black border rounded-lg px-4 py-2 text-sm w-72 focus:outline-none placeholder-emerald-800/50 text-emerald-100 transition-colors shadow-inner", isUnderAttackMode ? "border-red-500/50 focus:border-red-500" : "border-emerald-900/50 focus:border-emerald-500")}
              />
            </form>
          </div>
          
          {isUnderAttackMode && (
             <div className="hidden lg:flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold text-red-500 uppercase tracking-widest font-mono">
                <Lock className="w-3 h-3" /> E2EE Enforced
             </div>
          )}
        </div>

        <div className="flex items-center gap-5">
          {user ? (
            <>
              <Link to="/submit" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-black px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/30 hover:scale-105 active:scale-95">
                <PlusCircle className="h-5 w-5" />
                <span className="hidden md:inline">Submit New Report</span>
              </Link>
              <div className="flex items-center gap-3 ml-2 border-l border-emerald-900/30 pl-6">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-bold text-emerald-50">{userData?.displayName || 'User'}</div>
                  <div className="text-xs text-emerald-600 font-medium uppercase tracking-wider">{userData?.role === 'admin' ? 'Admin' : userData?.role === 'moderator' ? 'Moderator Tier 3' : 'Analyst'}</div>
                </div>
                <Link to="/profile">
                  <img src={userData?.photoUrl || `https://ui-avatars.com/api/?name=${userData?.displayName || 'User'}&background=random`} alt="Profile" className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-900 to-black border border-emerald-800/50 shadow-md" />
                </Link>
              </div>
              <button onClick={() => { signOut(); navigate('/'); }} className="text-emerald-700 hover:text-red-500 transition-colors p-2 bg-black rounded-lg border border-emerald-900/30 hover:border-red-900/50" title="Sign out">
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="bg-emerald-600 hover:bg-emerald-500 text-black px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/30 hover:scale-105 active:scale-95"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function SidebarItem({ to, icon: Icon, children, count, isActiveRegex }: { to: string, icon: any, count?: number, children: React.ReactNode, isActiveRegex?: RegExp }) {
  const location = useLocation();
  const basePath = to.split('?')[0];
  const isPathMatch = location.pathname === basePath;
  const pathAndSearch = location.pathname + location.search;
  
  const isActive = isActiveRegex 
    ? isPathMatch && isActiveRegex.test(pathAndSearch) 
    : pathAndSearch === to;
  
  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all",
        isActive 
          ? "bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 font-bold shadow-inner" 
          : "text-emerald-700 hover:bg-emerald-900/10 hover:text-emerald-500 border border-transparent font-medium"
      )}
    >
      <div className="flex items-center gap-3 text-sm">
        <span className={cn("text-xl leading-none", !isActive && "opacity-40")}>#</span> {children}
      </div>
      {count !== undefined && (
        <span className={cn("text-xs px-1.5 py-0.5 rounded-md", isActive ? "bg-emerald-500/20" : "opacity-40")}>{count}</span>
      )}
    </Link>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen w-full bg-black text-emerald-50 font-sans overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden mt-16 w-full">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-[#0a0a0a] border-r border-emerald-900/30 overflow-y-auto">
          <div className="p-4 flex-1">
            <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-3 pl-2">Intelligence Feed</h3>
            <ul className="space-y-1.5 mb-8">
              <SidebarItem to="/feed" icon={LayoutDashboard} isActiveRegex={/^(?!.*filter=).*$/}>All Reports</SidebarItem>
              <SidebarItem to="/feed?filter=starred" icon={Shield} isActiveRegex={/filter=starred/}>The STAR Vault</SidebarItem>
              <SidebarItem to="/common-threats" icon={Globe}>Global Threats</SidebarItem>
              <SidebarItem to="/wanted" icon={AlertTriangle}>Most Wanted</SidebarItem>
            </ul>

            <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-3 pl-2">AI Intelligence</h3>
            <ul className="space-y-1.5 mb-8">
              <SidebarItem to="/lab" icon={Terminal} isActiveRegex={/^\/lab/}>Analysis Lab</SidebarItem>
              <SidebarItem to="/defense" icon={Crosshair} isActiveRegex={/^\/defense/}>Active Defense</SidebarItem>
            </ul>
            
            <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-3 pl-2">Administration</h3>
            <ul className="space-y-1.5 mb-8">
              <SidebarItem to="/admin" icon={Flag} isActiveRegex={/^\/admin/}>Admin Panel</SidebarItem>
            </ul>
            
            <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-3 pl-2">Threat Vectors</h3>
            <ul className="space-y-1.5">
              <SidebarItem to="/feed?filter=Malware" icon={Bug} isActiveRegex={/filter=Malware/}>Malware</SidebarItem>
              <SidebarItem to="/feed?filter=Phishing" icon={Ghost} isActiveRegex={/filter=Phishing/}>Phishing</SidebarItem>
              <SidebarItem to="/feed?filter=Scams" icon={AlertTriangle} isActiveRegex={/filter=Scams/}>Scams</SidebarItem>
              <SidebarItem to="/feed?filter=Vulnerabilities" icon={ShieldAlert} isActiveRegex={/filter=Vulnerabilities/}>Vulnerabilities</SidebarItem>
            </ul>
          </div>
          
          <div className="mt-auto p-4 border-t border-emerald-900/30">
            <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-900/30">
              <div className="text-xs font-bold text-emerald-500 uppercase mb-2 tracking-wider">ThreatNet System</div>
              <div className="flex flex-col gap-2">
                <Link to="/terms" className="text-[11px] text-emerald-700 text-left hover:text-emerald-400 transition-colors font-medium">• Terms & Conditions</Link>
                <Link to="/privacy" className="text-[11px] text-emerald-700 text-left hover:text-emerald-400 transition-colors font-medium">• Privacy Policy</Link>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-black overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

function Legal({ title }: { title: string }) {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
       <h1 className="text-3xl font-black text-emerald-400 tracking-tight">{title}</h1>
       <div className="text-sm text-emerald-100/70 space-y-4 bg-[#0a0a0a] border border-emerald-900/30 p-6 rounded-2xl shadow-lg">
         <p>This is a placeholder page for the {title}. As ThreatNet is a cyber threat intelligence platform with user-submitted data, you must not submit Personal Identifiable Information (PII) belonging to victims. Our AI Moderation strictly enforces these rules.</p>
         <p>Data submitted is encrypted in transit and at rest using modern standards inside of our Firestore environment.</p>
       </div>
    </div>
  );
}

export default function App() {
  return (
    <CloudflareShield>
      <ActiveDefenseProvider>
        <AuthProvider>
          <BrowserRouter>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/feed" element={<Feed />} />
                <Route path="/submit" element={<ReportThreat />} />
                <Route path="/report/:id" element={<ReportDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/common-threats" element={<CommonThreats />} />
                <Route path="/wanted" element={<FBIWanted />} />
                <Route path="/lab" element={<AnalysisLab />} />
                <Route path="/defense" element={<ActiveDefense />} />
                <Route path="/terms" element={<Legal title="Terms & Conditions" />} />
                <Route path="/privacy" element={<Legal title="Privacy Policy" />} />
              </Routes>
            </MainLayout>
          </BrowserRouter>
        </AuthProvider>
      </ActiveDefenseProvider>
    </CloudflareShield>
  );
}
