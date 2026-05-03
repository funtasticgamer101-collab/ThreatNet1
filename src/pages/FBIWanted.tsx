import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, setDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { ShieldAlert, AlertTriangle, Globe, MapPin, Skull, Database, X, Printer } from 'lucide-react';
import { cn } from '../lib/utils';

interface ScammerInfo {
  id: string;
  name: string;
  alias: string;
  description: string;
  photoUrl: string;
  address: string;
  country: string;
  knownFor: string[];
  severity: 'high' | 'critical';
  createdAt: number;
  pdfUrl?: string;
  charges?: string[];
  reward?: string;
  remarks?: string;
  caution?: string;
  dob?: string;
  hair?: string;
  eyes?: string;
  height?: string;
  weight?: string;
  sex?: string;
  race?: string;
  occupation?: string;
  ncic?: string;
  url?: string;
  details?: string;
  warningMessage?: string;
  images?: { original: string, caption?: string }[];
}

const SEED_DATA: Omit<ScammerInfo, 'id'>[] = [
  {
    name: "Evgeniy Mikhailovich Bogachev",
    alias: "lucky12345, slavik, Yevgeniy Bogachev, Evgeniy Mikhaylovich Bogachev, Pollingsoon",
    description: "Wanted for his alleged involvement in a wide-ranging racketeering enterprise and scheme that installed, without authorization, malicious software known as 'Zeus' on victims' computers.",
    photoUrl: "https://www.fbi.gov/wanted/cyber/evgeniy-mikhailovich-bogachev/@@images/image/large",
    address: "Anapa, Russian Federation",
    country: "Russia",
    knownFor: ["Zeus Malware", "CryptoLocker", "Zero10"],
    severity: "critical",
    createdAt: Date.now(),
    pdfUrl: "https://www.fbi.gov/wanted/cyber/evgeniy-mikhailovich-bogachev/download.pdf",
    charges: [
      "Conspiracy to Participate in Racketeering Activity",
      "Bank Fraud",
      "Conspiracy to Violate the Computer Fraud and Abuse Act",
      "Conspiracy to Violate the Identity Theft and Assumption Deterrence Act",
      "Aggravated Identity Theft",
      "Conspiracy",
      "Computer Fraud",
      "Wire Fraud",
      "Money Laundering",
      "Conspiracy to Commit Bank Fraud"
    ],
    reward: "The United States Department of State's Transnational Organized Crime Rewards Program is offering a reward of up to $3 million for information leading to the arrest and/or conviction of Evgeniy Mikhailovich Bogachev.",
    remarks: "Bogachev was last known to reside in Anapa, Russia. He is known to enjoy boating and may travel to locations along the Black Sea in his boat. He also owns property in Krasnodar, Russia.",
    caution: "Evgeniy Mikhailovich Bogachev, using the online monikers “lucky12345” and “slavik”, is wanted for his alleged involvement in a wide-ranging racketeering enterprise and scheme that installed, without authorization, malicious software known as “Zeus” on victims’ computers. The software was used to capture bank account numbers, passwords, personal identification numbers, and other information necessary to log into online banking accounts. While Bogachev knowingly acted in a role as an administrator, others involved in the scheme conspired to distribute spam and phishing emails, which contained links to compromised web sites. Victims who visited these web sites were infected with the malware, which Bogachev and others utilized to steal money from the victims’ bank accounts. This online account takeover fraud has been investigated by the FBI since the summer of 2009. Starting in September of 2011, the FBI began investigating a modified version of the Zeus Trojan, known as GameOver Zeus (GOZ). It is believed GOZ is responsible for more than one million computer infections, resulting in financial losses of more than $100 million.",
    dob: "October 28, 1983",
    hair: "Brown (usually shaves his head)",
    eyes: "Brown",
    height: "Approximately 5'9\"",
    weight: "Approximately 180 pounds",
    sex: "Male",
    race: "White",
    occupation: "Bogachev works in the Information Technology field.",
    ncic: "W890989955"
  },
  {
    name: "Park Jin Hyok",
    alias: "Lazarus Group, Chosun Expo",
    description: "Park Jin Hyok is allegedly a North Korean state-sponsored computer programmer who was part of a conspiracy responsible for some of the costliest computer intrusions in history, including the Sony Pictures Entertainment hack, the WannaCry ransomware attack, and the theft of $81 million from Bangladesh Bank.",
    photoUrl: "https://www.fbi.gov/wanted/cyber/park-jin-hyok/@@images/image/large",
    address: "Pyongyang, Democratic People's Republic of Korea",
    country: "North Korea",
    knownFor: ["WannaCry Ransomware", "Sony Pictures Hack", "SWIFT Network Heists"],
    severity: "critical",
    pdfUrl: "https://www.fbi.gov/wanted/cyber/park-jin-hyok/download.pdf",
    createdAt: Date.now() - 1000
  },
  {
    name: "Alexsey Belan",
    alias: "Magg, M4G, Abyrvaig",
    description: "Wanted for his alleged involvement in the cyber intrusions of major American e-commerce and internet connectivity companies, including Yahoo. He compromised millions of user accounts and stole massive databases containing user information and encrypted passwords.",
    photoUrl: "https://www.fbi.gov/wanted/cyber/alexey-belan/@@images/image/large",
    address: "Krasnodar, Russia",
    country: "Russia",
    knownFor: ["Database Theft", "Yahoo Breach", "Credential Harvesting"],
    severity: "high",
    pdfUrl: "https://www.fbi.gov/wanted/cyber/alexey-belan/download.pdf",
    createdAt: Date.now() - 2000
  },
  {
    name: "Ruoqiang Wang",
    alias: "APT31, Zirconium",
    description: "Allegedly part of a PRC state-sponsored hacking group targeting politicians, cybersecurity firms, and dissidents globally. Operating under the guise of an IT company in Wuhan.",
    photoUrl: "https://www.fbi.gov/wanted/cyber/wang-dong/@@images/image/large",
    address: "Wuhan, China",
    country: "China",
    knownFor: ["Espionage", "Spear-phishing", "Zero-day exploits"],
    severity: "critical",
    pdfUrl: "https://www.fbi.gov/wanted/cyber/wang-ruoqiang/download.pdf",
    createdAt: Date.now() - 3000
  },
  {
    name: "Björn Sundell",
    alias: "Wannabe, GhostSec",
    description: "Allegedly a core member of a massive credit card fraud ring that compromised tens of thousands of point-of-sale systems across Europe. Currently wanted by INTERPOL.",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Unknown_person.jpg",
    address: "Unknown, Last seen in Stockholm",
    country: "Sweden",
    knownFor: ["PoS Malware", "Carding", "Wire Fraud"],
    severity: "high",
    createdAt: Date.now() - 4000
  },
  {
    name: "Maksim V. Yakubets",
    alias: "aqua",
    description: "Alleged leader of the 'Evil Corp' cybercrime syndicate, responsible for the development and distribution of the Bugat/Dridex/Cridex banking trojan. This malware was used to automate the theft of confidential personal and financial information, leading to millions in losses worldwide.",
    photoUrl: "https://www.fbi.gov/wanted/cyber/maksim-viktorovich-yakubets/@@images/image/large",
    address: "Moscow, Russia",
    country: "Russia",
    knownFor: ["Dridex", "Evil Corp", "Banking Trojan", "BitPaymer"],
    severity: "critical",
    pdfUrl: "https://www.fbi.gov/wanted/cyber/maksim-v-yakubets/download.pdf",
    createdAt: Date.now() - 5000
  },
  {
    name: "Igor Turashev",
    alias: "Enki",
    description: "Allegedly an administrator and lead IT specialist for the 'Evil Corp' cybercrime group. Indicted for his involvement in deploying the Bugat/Dridex banking trojan and the Zeus malware against financial institutions.",
    photoUrl: "https://www.fbi.gov/wanted/cyber/igor-olegovich-turashev/@@images/image/large",
    address: "Yoshkar-Ola, Russia",
    country: "Russia",
    knownFor: ["Dridex Admin", "Botnet operations", "Ransomware"],
    severity: "high",
    pdfUrl: "https://www.fbi.gov/wanted/cyber/igor-turashev/download.pdf",
    createdAt: Date.now() - 6000
  },
  {
    name: "Sandshaker Group",
    alias: "FIN7, Carbanak",
    description: "A highly prolific and financially motivated threat group that targets point-of-sale systems and internal networks of retail, restaurant, and hospitality industries. They are known for their sophisticated phishing campaigns and custom malware.",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Test-Logo.svg/500px-Test-Logo.svg.png",
    address: "Distributed",
    country: "Eastern Europe",
    knownFor: ["Carbanak", "Bateleur", "SQL Injection", "Spear Phishing"],
    severity: "critical",
    createdAt: Date.now() - 7000
  },
  {
    name: "Mohammad Saeid Parmar",
    alias: "Mabna Institute",
    description: "Allegedly a leader in the Mabna Institute, a supposedly Iran-based contractor that conducted massive, coordinated cyber intrusions into computer systems of hundreds of universities and companies. Operated for the Islamic Revolutionary Guard Corps (IRGC).",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Unknown_person.jpg",
    address: "Tehran, Iran",
    country: "Iran",
    knownFor: ["Mabna Institute", "Academic IP Theft", "Phishing"],
    severity: "high",
    createdAt: Date.now() - 8000
  },
  {
    name: "Danil Potekhin",
    alias: "cron",
    description: "Allegedly involved in a massive sophisticated phishing campaign targeting virtual currency exchanges. The conspiracy allegedly defrauded victims of millions of dollars of cryptocurrency and manipulated cryptocurrency markets.",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Unknown_person.jpg",
    address: "Penza, Russia",
    country: "Russia",
    knownFor: ["Crypto Phishing", "Market Manipulation", "Spoofing"],
    severity: "high",
    pdfUrl: "https://www.fbi.gov/wanted/cyber/danil-potekhin/download.pdf",
    createdAt: Date.now() - 9000
  }
];

export default function FBIWanted() {
  const { isAdmin } = useAuth();
  const [scammers, setScammers] = useState<ScammerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScammer, setSelectedScammer] = useState<ScammerInfo | null>(null);

  // Admin form state
  const [isAdding, setIsAdding] = useState(false);
  const [newScammer, setNewScammer] = useState<Partial<ScammerInfo>>({
    name: '',
    alias: '',
    description: '',
    photoUrl: '',
    address: '',
    country: '',
    knownFor: [],
    severity: 'high'
  });
  const [knownForInput, setKnownForInput] = useState('');

  useEffect(() => {
    fetchScammers();
  }, [isAdmin]);

  async function fetchScammers() {
    setLoading(true);
    setScammers([]);
    let allCyberScammers: ScammerInfo[] = [];
    try {
      // Fetch the first page to get total items
      const firstPageRes = await fetch("https://api.fbi.gov/wanted/v1/list?pageSize=50&page=1");
      const firstPageJson = await firstPageRes.json();
      
      const totalItems = firstPageJson.total;
      const totalPages = Math.ceil(totalItems / 50);
      
      let allItems = [...firstPageJson.items];
      
      // Fetch remaining pages in parallel
      const fetchPromises = [];
      for (let i = 2; i <= totalPages; i++) {
        fetchPromises.push(
          fetch(`https://api.fbi.gov/wanted/v1/list?pageSize=50&page=${i}`)
            .then(r => r.json())
            .then(j => j.items)
            .catch(() => [])
        );
      }
      
      const remainingPages = await Promise.all(fetchPromises);
      for (const pageItems of remainingPages) {
        if (pageItems) allItems = allItems.concat(pageItems);
      }
      
      const cyberItems = allItems.filter(item => 
        item.subjects && item.subjects.some((s: string) => s.toLowerCase().includes('cyber'))
      );

      // Deduplicate by uid to avoid repetitive profiles at the end
      const uniqueCyberItems = Array.from(new Map(cyberItems.map(item => [item.uid, item])).values());
      
      allCyberScammers = uniqueCyberItems.map(item => {
        let thePdf = '';
        if (item.files && item.files.length > 0) {
          const englishPdf = item.files.find((f: any) => f.name?.toLowerCase() === 'english');
          thePdf = englishPdf ? englishPdf.url : item.files[0].url;
        }

        return {
          id: item.uid,
          name: item.title,
          alias: item.aliases ? item.aliases.join(', ') : '',
          description: item.description || '',
          photoUrl: item.images && item.images.length > 0 ? item.images[0].original : '',
          address: (item.locations && item.locations.length > 0) ? item.locations.join(', ') : (item.place_of_birth ? `Born: ${item.place_of_birth}` : 'N/A'),
          country: item.nationality || (item.possible_countries ? item.possible_countries.join(', ') : 'N/A'),
          knownFor: item.subjects || [],
          severity: 'critical',
          createdAt: Date.now(),
          pdfUrl: thePdf,
          url: item.url,
          charges: item.description ? [item.description] : undefined,
          reward: item.reward_text || undefined,
          remarks: item.remarks || undefined,
          caution: item.caution || undefined,
          dob: item.dates_of_birth_used ? item.dates_of_birth_used.join(', ') : 'N/A',
          hair: item.hair_raw || item.hair || 'N/A',
          eyes: item.eyes_raw || item.eyes || 'N/A',
          height: item.height_min ? `${item.height_min} inches` : 'N/A',
          weight: item.weight || 'N/A',
          sex: item.sex || 'N/A',
          race: item.race_raw || item.race || 'N/A',
          occupation: item.occupations ? item.occupations.join(', ') : 'N/A',
          ncic: item.ncic || 'N/A',
          details: item.details || undefined,
          warningMessage: item.warning_message || undefined,
          images: item.images || undefined
        };
      });
      
      // Deduplicate by name just in case different IDs represent the exact same person
      const uniqueByName = Array.from(new Map(allCyberScammers.map(s => [s.name, s])).values());
      setScammers(uniqueByName);
    } catch(e) {
      console.error("Error fetching from FBI API:", e);
    } finally {
      setLoading(false);
    }
  }

  const handleAddKnownFor = () => {
    if (knownForInput.trim()) {
      setNewScammer(prev => ({ ...prev, knownFor: [...(prev.knownFor || []), knownForInput.trim()] }));
      setKnownForInput('');
    }
  };

  const handleAddScammer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      const ref = doc(collection(db, 'scammers'));
      const data: ScammerInfo = {
        id: ref.id,
        name: newScammer.name || '',
        alias: newScammer.alias || '',
        description: newScammer.description || '',
        photoUrl: newScammer.photoUrl || '',
        address: newScammer.address || '',
        country: newScammer.country || '',
        knownFor: newScammer.knownFor || [],
        severity: newScammer.severity as 'high' | 'critical',
        createdAt: Date.now()
      };
      
      await setDoc(ref, data);
      setIsAdding(false);
      setNewScammer({ name: '', alias: '', description: '', photoUrl: '', address: '', country: '', knownFor: [], severity: 'high' });
      fetchScammers();
    } catch(err) {
      console.error(err);
      alert('Failed to add record.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between border-b border-red-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center border-4 border-[#0B0C0E]">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter shadow-red-500/50 drop-shadow-lg">Most Wanted Adversaries</h1>
            <p className="text-red-400 text-xs font-mono font-bold uppercase overflow-hidden whitespace-nowrap border-r-2 border-red-400 animate-pulse w-max pr-2">
              MOST WANTED CYBER THREATS AND GROUPS
            </p>
          </div>
        </div>
        
        {isAdmin && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              {isAdding ? 'Cancel' : 'Add Intel Record'}
            </button>
          </div>
        )}
      </div>

      {isAdmin && isAdding && (
         <div className="bg-[#121418] border border-red-500/30 rounded p-6 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]">
            <h2 className="text-red-500 font-bold uppercase tracking-widest text-sm mb-4 border-b border-red-500/10 pb-2">Add New Threat Actor Record</h2>
            <form onSubmit={handleAddScammer} className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Full Name / Group Name</label>
                     <input required value={newScammer.name} onChange={e => setNewScammer({...newScammer, name: e.target.value})} className="w-full bg-[#0B0C0E] border border-white/10 p-2 rounded text-sm text-white" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Known Alias / Handle</label>
                     <input required value={newScammer.alias} onChange={e => setNewScammer({...newScammer, alias: e.target.value})} className="w-full bg-[#0B0C0E] border border-white/10 p-2 rounded text-sm text-white" />
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                     <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Mugshot / Logo URL</label>
                     <input required value={newScammer.photoUrl} onChange={e => setNewScammer({...newScammer, photoUrl: e.target.value})} className="w-full bg-[#0B0C0E] border border-white/10 p-2 rounded text-sm text-white" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Country of Origin</label>
                     <input required value={newScammer.country} onChange={e => setNewScammer({...newScammer, country: e.target.value})} className="w-full bg-[#0B0C0E] border border-white/10 p-2 rounded text-sm text-white" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Severity</label>
                     <select value={newScammer.severity} onChange={e => setNewScammer({...newScammer, severity: e.target.value as any})} className="w-full bg-[#0B0C0E] border border-white/10 p-2 rounded text-sm text-white">
                        <option value="high">HIGH PRIORITY</option>
                        <option value="critical">CRITICAL THREAT</option>
                     </select>
                  </div>
               </div>
               
               <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Last Known Address / Coordinates</label>
                  <input required value={newScammer.address} onChange={e => setNewScammer({...newScammer, address: e.target.value})} className="w-full bg-[#0B0C0E] border border-white/10 p-2 rounded text-sm text-red-400 font-mono" />
               </div>
               
               <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Detailed Threat Description</label>
                  <textarea required value={newScammer.description} onChange={e => setNewScammer({...newScammer, description: e.target.value})} className="w-full bg-[#0B0C0E] border border-white/10 p-2 rounded text-sm text-white resize-none" rows={4} />
               </div>
               
               <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Known Tactics / Malware (Add Multiple)</label>
                  <div className="flex gap-2">
                     <input value={knownForInput} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddKnownFor(); }}} onChange={e => setKnownForInput(e.target.value)} className="flex-1 bg-[#0B0C0E] border border-white/10 p-2 rounded text-sm text-white" placeholder="e.g. Ransomware, BEC" />
                     <button type="button" onClick={handleAddKnownFor} className="bg-white/10 hover:bg-white/20 text-white px-4 rounded text-xs font-bold uppercase transition-colors">Add</button>
                  </div>
                  {newScammer.knownFor && newScammer.knownFor.length > 0 && (
                     <div className="flex flex-wrap gap-2 mt-2">
                        {newScammer.knownFor.map((item, i) => (
                           <span key={i} className="text-[10px] bg-red-500/20 text-red-500 border border-red-500/20 py-0.5 px-2 rounded">{item}</span>
                        ))}
                     </div>
                  )}
               </div>

               <div className="flex justify-end pt-4 border-t border-red-500/10">
                  <button type="submit" className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                     <AlertTriangle className="w-4 h-4" /> Publish Record
                  </button>
               </div>
            </form>
         </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
         {loading ? (
            <div className="col-span-full text-center font-mono text-[10px] text-red-500 animate-pulse py-12 uppercase tracking-widest">
               Accessing FBI & Interpol Databases... (Gathering {scammers.length || ''} intel packets)
            </div>
         ) : scammers.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center font-mono py-12 border border-white/5 border-dashed rounded space-y-4">
               <div className="text-[10px] text-slate-500 py-2 uppercase tracking-widest">
                 No active adversary profiles found in primary database.
               </div>
            </div>
         ) : (
            scammers.map((scammer, index) => (
               <div key={scammer.id} onClick={() => setSelectedScammer(scammer)} className="bg-[#121418] border border-white/5 p-2 rounded-lg overflow-hidden flex flex-col items-center justify-start shadow-lg relative group cursor-pointer hover:border-red-500/50 hover:bg-black transition-colors w-full aspect-[3/4]" title="View details">
                  
                  {/* Image Section */}
                  <div className="w-full flex-1 relative mb-2 overflow-hidden bg-black rounded border border-white/5">
                     <div className="absolute top-1 left-1 bg-red-600 text-white text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm border border-red-500 z-10 uppercase">
                        #{index + 1}
                     </div>
                     <div className="absolute inset-0 bg-red-500/10 mix-blend-overlay pointer-events-none z-10 group-hover:bg-red-500/0 transition-colors"></div>
                     <img 
                        src={scammer.photoUrl || "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3e%3ccircle cx='12' cy='7' r='4'/%3e%3c/svg%3e"} 
                        alt={scammer.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.onerror = null; 
                          e.currentTarget.src = "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3e%3ccircle cx='12' cy='7' r='4'/%3e%3c/svg%3e";
                        }}
                        className="w-full h-full object-cover filter contrast-125 grayscale-[50%] group-hover:grayscale-0 transition-all duration-300 transform group-hover:scale-105"
                     />
                  </div>

                  <div className="w-full truncate text-center">
                    <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-tighter truncate" title={scammer.name}>{scammer.name}</h2>
                    {scammer.alias && (
                       <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 block truncate" title={scammer.alias}>
                         {scammer.alias}
                       </span>
                    )}
                  </div>
               </div>
            ))
         )}
      </div>

      {selectedScammer && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 md:p-12 overflow-y-auto">
          <div id="fbi-modal-content" className={cn("bg-white w-full rounded shadow-[0_0_50px_-5px_rgba(239,68,68,0.3)] relative text-black my-auto font-serif", selectedScammer.pdfUrl ? "max-w-5xl" : "max-w-4xl")}>
            <button 
              onClick={() => setSelectedScammer(null)} 
              className="absolute right-4 top-4 text-slate-400 hover:text-red-400 transition-colors z-10 print:hidden"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="p-8 pb-4">
              <div className="text-center space-y-4 mb-8">
                <h2 className="text-3xl md:text-5xl font-black text-red-700 uppercase tracking-tighter w-full text-center border-y-4 border-red-700 py-4 font-sans">
                  Wanted by the FBI
                </h2>
                <h1 className="text-3xl md:text-5xl font-black text-red-700 uppercase tracking-tight font-sans">
                  {selectedScammer.name}
                </h1>
                
                {selectedScammer.charges && selectedScammer.charges.length > 0 && (
                  <div className="text-red-700 font-bold text-lg max-w-2xl mx-auto leading-snug">
                    {selectedScammer.charges.join("; ")}
                  </div>
                )}
              </div>

              <div className="flex justify-center mb-8 flex-col items-center gap-4">
                 <div className="flex flex-wrap justify-center gap-6">
                    {selectedScammer.images && selectedScammer.images.length > 0 ? (
                      selectedScammer.images.map((img, idx) => (
                        <div key={idx} className="p-2 border border-slate-300 shadow-xl bg-slate-50 relative group inline-block flex flex-col items-center">
                          <img 
                            src={img.original} 
                            alt={img.caption || "Mugshot"} 
                            referrerPolicy="no-referrer"
                            className="max-w-[200px] md:max-w-[300px] max-h-[350px] object-contain h-auto grayscale-[20%] contrast-125"
                          />
                          {img.caption && <span className="text-xs font-bold mt-2 text-slate-600 uppercase text-center max-w-[200px] md:max-w-[300px]">{img.caption}</span>}
                        </div>
                      ))
                    ) : selectedScammer.photoUrl ? (
                      <div className="p-2 border border-slate-300 shadow-xl bg-slate-50 relative group inline-block">
                        <img 
                          src={selectedScammer.photoUrl} 
                          alt="Mugshot" 
                          referrerPolicy="no-referrer"
                          className="max-w-[200px] md:max-w-[300px] max-h-[350px] object-contain h-auto grayscale-[20%] contrast-125"
                        />
                      </div>
                    ) : (
                      <div className="w-[300px] h-[350px] flex items-center justify-center bg-slate-200">
                        <span className="text-slate-400 font-bold font-sans uppercase">No Image Available</span>
                      </div>
                    )}
                 </div>
                 <div className="flex flex-wrap gap-4 justify-center">
                   {selectedScammer.url && (
                      <button onClick={() => window.open(selectedScammer.url, '_blank')} className="mt-4 bg-red-700 text-white px-6 py-2 rounded shadow uppercase font-bold text-sm tracking-widest hover:bg-red-600 transition-colors">
                        View Official FBI Profile
                      </button>
                   )}
                   <button onClick={() => window.print()} className="mt-4 bg-slate-800 text-white px-6 py-2 rounded shadow uppercase font-bold text-sm tracking-widest hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 print:hidden">
                      <Printer className="w-4 h-4" />
                      Print Poster
                   </button>
                 </div>
              </div>

              <h3 className="text-2xl font-bold text-red-700 text-center uppercase tracking-widest border-b-2 border-red-700 pb-2 mb-4 font-sans">
                Description
              </h3>
              
              <div className="mb-6">
                {selectedScammer.alias && selectedScammer.alias !== 'N/A' && (
                  <p className="text-sm font-bold border-b border-slate-200 pb-1 mb-2">
                    <span className="mr-2">Aliases:</span>
                    <span className="font-normal">{selectedScammer.alias}</span>
                  </p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 text-sm border border-slate-300 mt-4 font-sans">
                   {[
                     { label: 'Date(s) of Birth Used', value: selectedScammer.dob },
                     { label: 'Hair', value: selectedScammer.hair },
                     { label: 'Eyes', value: selectedScammer.eyes },
                     { label: 'Height', value: selectedScammer.height },
                     { label: 'Weight', value: selectedScammer.weight },
                     { label: 'Sex', value: selectedScammer.sex },
                     { label: 'Race', value: selectedScammer.race },
                     { label: 'Occupation', value: selectedScammer.occupation },
                   ].filter(item => item.value && item.value !== 'N/A').map((item, idx) => (
                     <div key={idx} className="border-b border-slate-300 flex">
                       <div className="p-2 border-r border-slate-300 font-bold w-1/3 shrink-0 bg-slate-100">{item.label}:</div>
                       <div className="p-2 flex-1">{item.value}</div>
                     </div>
                   ))}
                   {selectedScammer.ncic && selectedScammer.ncic !== 'N/A' && (
                     <div className="border-b md:col-span-2 border-slate-300 flex">
                       <div className="p-2 border-r border-slate-300 font-bold sm:w-1/6 md:w-[16.666%] shrink-0 bg-slate-100">NCIC:</div>
                       <div className="p-2 flex-1">{selectedScammer.ncic}</div>
                     </div>
                   )}
                </div>
              </div>

              {selectedScammer.reward && (
                <div className="mb-6">
                   <h3 className="text-xl font-bold text-red-700 text-center uppercase tracking-widest font-sans mb-2">Reward</h3>
                   <p className="text-sm border border-slate-300 p-4 font-bold">
                     {selectedScammer.reward}
                   </p>
                </div>
              )}

              {selectedScammer.warningMessage && (
                 <div className="mb-6 border-l-4 border-red-600 bg-red-50 p-4">
                    <p className="text-red-700 font-bold font-sans uppercase tracking-wide text-sm mb-1">Warning</p>
                    <div className="text-sm text-red-900 font-sans" dangerouslySetInnerHTML={{ __html: selectedScammer.warningMessage }} />
                 </div>
              )}

              {selectedScammer.details && (
                <div className="mb-6">
                   <h3 className="text-lg font-bold text-slate-800 uppercase tracking-widest font-sans mb-2">Details</h3>
                   <div className="text-sm font-sans [&>p]:mb-4" dangerouslySetInnerHTML={{ __html: selectedScammer.details }} />
                </div>
              )}

              {selectedScammer.remarks && (
                <div className="mb-6">
                   <h3 className="text-lg font-bold text-slate-800 uppercase tracking-widest font-sans mb-2">Remarks</h3>
                   <div className="text-sm font-sans [&>p]:mb-4" dangerouslySetInnerHTML={{ __html: selectedScammer.remarks }} />
                </div>
              )}

              {selectedScammer.caution && (
              <div className="mb-8">
                 <h3 className="text-xl font-bold text-red-700 text-center uppercase tracking-widest font-sans mb-2">Caution</h3>
                 <div className="text-sm leading-relaxed font-sans whitespace-pre-line border border-red-200 bg-red-50 p-4 [&>p]:mb-4"
                      dangerouslySetInnerHTML={{ __html: selectedScammer.caution }}
                 />
              </div>
              )}

               <div className="mb-6 border border-slate-300 p-4 bg-slate-50 text-center mt-8">
                 <p className="font-bold font-sans text-sm mb-2 text-red-700">SHOULD BE CONSIDERED A FLIGHT RISK</p>
                 <p className="text-xs font-sans text-slate-600">If you have any information concerning this person, please contact your local FBI office or the nearest American Embassy or Consulate.</p>
               </div>
               
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
