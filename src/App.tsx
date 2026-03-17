import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { authService } from './services/auth';
import { dbService } from './services/db';
import { UserProfile, Candidate, Vote } from './types';
import { Toaster, toast } from 'react-hot-toast';
import { 
  Vote as VoteIcon, 
  LayoutDashboard, 
  LogOut, 
  Users, 
  Trophy, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Trash2,
  BarChart3,
  Camera,
  Upload,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

// --- Components ---

const Loader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
    />
  </div>
);

const Navbar = ({ user, profile, onLogout, view, setView }: { 
  user: User | null, 
  profile: UserProfile | null, 
  onLogout: () => void,
  view: 'vote' | 'admin',
  setView: (v: 'vote' | 'admin') => void
}) => (
  <nav className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-20 items-center">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-gold-400 to-gold-600 p-2 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.3)]">
            <Trophy className="w-6 h-6 text-black" />
          </div>
          <span className="font-serif text-2xl font-black gold-gradient hidden sm:block tracking-tighter">FS Bertoua</span>
        </div>
        
        {user && (
          <div className="flex items-center gap-6">
            {profile?.role === 'admin' && (
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <button 
                  onClick={() => setView('vote')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${view === 'vote' ? 'bg-gold-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  Voter
                </button>
                <button 
                  onClick={() => setView('admin')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${view === 'admin' ? 'bg-gold-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  Admin
                </button>
              </div>
            )}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white">{profile?.name}</p>
              <p className="text-[10px] text-gold-500 uppercase tracking-[0.2em] font-black">{profile?.role}</p>
            </div>
            <button 
              onClick={onLogout}
              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  </nav>
);

const CandidateCard: React.FC<{ 
  candidate: Candidate; 
  onVote: (id: string) => void; 
  disabled: boolean;
  hasVoted: boolean;
}> = ({ candidate, onVote, disabled, hasVoted }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="glass-card rounded-[2rem] overflow-hidden group relative"
  >
    <div className="aspect-[3/4] bg-slate-900 relative overflow-hidden">
      <img 
        src={candidate.image || `https://picsum.photos/seed/${candidate.id}/800/1000`} 
        alt={candidate.name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60" />
      
      {hasVoted && (
        <div className="absolute inset-0 bg-gold-500/10 backdrop-blur-[2px] flex items-center justify-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gold-500 text-black px-6 py-3 rounded-full shadow-[0_0_30px_rgba(234,179,8,0.4)] flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-black uppercase tracking-widest text-xs">Vote Enregistré</span>
          </motion.div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-8">
        <h3 className="text-3xl font-serif font-black text-white mb-1 leading-tight">{candidate.name}</h3>
        <div className="w-12 h-1 bg-gold-500 mb-4 rounded-full" />
        <p className="text-slate-300 text-sm line-clamp-2 font-medium leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {candidate.description}
        </p>
      </div>
    </div>
    
    <div className="p-6 bg-white/5 border-t border-white/10">
      {!hasVoted && (
        <button
          onClick={() => onVote(candidate.id)}
          disabled={disabled}
          className={`w-full py-4 px-6 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-2 ${
            disabled 
            ? 'bg-white/5 text-slate-500 cursor-not-allowed' 
            : 'gold-button hover:scale-[1.02] active:scale-95'
          }`}
        >
          {disabled ? 'Traitement...' : 'Voter maintenant'}
        </button>
      )}
    </div>
  </motion.div>
);

const AdminPanel = ({ candidates, users, votes }: { 
  candidates: Candidate[]; 
  users: UserProfile[];
  votes: Vote[];
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'candidates' | 'users' | 'admins'>('stats');
  const [newCandidate, setNewCandidate] = useState({ name: '', description: '', image: '' });
  const [adminEmails, setAdminEmails] = useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'admins') {
      const unsub = dbService.subscribeAdminEmails(setAdminEmails);
      return () => unsub();
    }
  }, [activeTab]);

  const handleAddAdminEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) return;
    await dbService.addAdminEmail(newAdminEmail);
    setNewAdminEmail('');
    toast.success('Administrateur ajouté !');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500000) { // 500KB limit for base64 in firestore
      toast.error("L'image est trop lourde (max 500KB)");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewCandidate(prev => ({ ...prev, image: reader.result as string }));
      setUploading(false);
      toast.success("Image chargée !");
    };
    reader.readAsDataURL(file);
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.name) return;
    await dbService.addCandidate(newCandidate);
    setNewCandidate({ name: '', description: '', image: '' });
    toast.success('Candidat ajouté !');
  };

  const COLORS = ['#BF953F', '#B38728', '#AA771C', '#854d0e', '#713f12', '#422006'];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 p-1.5 bg-white/5 rounded-2xl w-fit border border-white/10">
        <button 
          onClick={() => setActiveTab('stats')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'stats' ? 'bg-gold-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" /> Statistiques
        </button>
        <button 
          onClick={() => setActiveTab('candidates')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'candidates' ? 'bg-gold-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          <Trophy className="w-4 h-4 inline mr-2" /> Candidats
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-gold-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          <Users className="w-4 h-4 inline mr-2" /> Participants
        </button>
        <button 
          onClick={() => setActiveTab('admins')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'admins' ? 'bg-gold-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          <Sparkles className="w-4 h-4 inline mr-2" /> Admins
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'stats' && (
          <motion.div 
            key="stats"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 glass-card p-8 rounded-[2rem]">
              <h3 className="text-xl font-serif font-black gold-gradient mb-8 uppercase tracking-widest">Résultats en Direct</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={candidates}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                    />
                    <Bar dataKey="voteCount" radius={[8, 8, 0, 0]}>
                      {candidates.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="gold-button p-8 rounded-[2rem] text-black shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-12 h-12" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Total des Suffrages</p>
                <h4 className="text-6xl font-serif font-black mt-2">{votes.length}</h4>
              </div>
              <div className="glass-card p-8 rounded-[2rem]">
                <p className="text-[10px] font-black text-gold-500 uppercase tracking-[0.3em]">Taux de Participation</p>
                <h4 className="text-6xl font-serif font-black text-white mt-2">
                  {users.length > 0 ? Math.round((votes.length / users.length) * 100) : 0}%
                </h4>
                <p className="text-xs text-slate-500 mt-4 font-bold">{votes.length} sur {users.length} inscrits</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'candidates' && (
          <motion.div 
            key="candidates"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <form onSubmit={handleAddCandidate} className="glass-card p-8 rounded-[2rem] space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gold-500 uppercase tracking-widest mb-2">Nom de la Candidate</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Marie Dupont" 
                      className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl text-white focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                      value={newCandidate.name}
                      onChange={e => setNewCandidate({...newCandidate, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gold-500 uppercase tracking-widest mb-2">Description / Bio</label>
                    <textarea 
                      placeholder="Parlez-nous d'elle..." 
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl text-white focus:ring-2 focus:ring-gold-500 outline-none transition-all resize-none"
                      value={newCandidate.description}
                      onChange={e => setNewCandidate({...newCandidate, description: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-[2rem] p-6 bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <input 
                    type="file" 
                    hidden 
                    ref={fileInputRef} 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                  />
                  {newCandidate.image ? (
                    <div className="relative w-full h-full aspect-square rounded-2xl overflow-hidden">
                      <img src={newCandidate.image} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-3">
                      <div className="bg-gold-500/20 p-4 rounded-full inline-block">
                        <Upload className="w-8 h-8 text-gold-500" />
                      </div>
                      <p className="text-sm font-bold text-white">Cliquez pour uploader une photo</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Format JPG, PNG (Max 500KB)</p>
                    </div>
                  )}
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={uploading || !newCandidate.name}
                className="w-full gold-button py-5 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" /> 
                <span className="uppercase tracking-[0.3em] text-sm">Enregistrer la Candidate</span>
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.map(c => (
                <div key={c.id} className="glass-card p-6 rounded-[2rem] flex items-center gap-4 group">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                    <img src={c.image || `https://picsum.photos/seed/${c.id}/200/200`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-serif font-black text-white text-lg">{c.name}</p>
                    <p className="text-[10px] text-gold-500 font-black uppercase tracking-widest">{c.voteCount} voix</p>
                  </div>
                  <button 
                    onClick={() => dbService.deleteCandidate(c.id)}
                    className="p-3 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div 
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card rounded-[2rem] overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-8 py-6 text-[10px] font-black text-gold-500 uppercase tracking-[0.3em]">Participant</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gold-500 uppercase tracking-[0.3em]">Email</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gold-500 uppercase tracking-[0.3em]">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-8 py-6 font-bold text-white">{u.name}</td>
                      <td className="px-8 py-6 text-slate-400 text-sm">{u.email}</td>
                      <td className="px-8 py-6">
                        {u.hasVoted ? (
                          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Confirmé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <AlertCircle className="w-3 h-3" /> En attente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
        {activeTab === 'admins' && (
          <motion.div 
            key="admins"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <form onSubmit={handleAddAdminEmail} className="glass-card p-8 rounded-[2rem] flex flex-col md:flex-row gap-4">
              <div className="flex-grow">
                <label className="block text-[10px] font-black text-gold-500 uppercase tracking-widest mb-2">Email du nouvel administrateur</label>
                <input 
                  type="email" 
                  placeholder="Ex: admin@gmail.com" 
                  className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl text-white focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="gold-button px-8 py-4 rounded-2xl self-end flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="uppercase tracking-widest text-xs">Ajouter</span>
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {adminEmails.map(admin => (
                <div key={admin.email} className="glass-card p-6 rounded-[2rem] flex items-center justify-between group">
                  <div>
                    <p className="font-bold text-white">{admin.email}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Ajouté par {admin.addedBy}</p>
                  </div>
                  {admin.email !== 'angekapel007@gmail.com' && (
                    <button 
                      onClick={() => dbService.removeAdminEmail(admin.email)}
                      className="p-3 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [view, setView] = useState<'vote' | 'admin'>('vote');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailLogin, setShowEmailLogin] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = authService.onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          let userProfile = await dbService.getUserProfile(firebaseUser.uid);
          
          // Auto-upgrade admin role if needed
          if (firebaseUser.email === 'angekapel007@gmail.com' && userProfile?.role !== 'admin') {
            await dbService.updateUserProfile(firebaseUser.uid, { role: 'admin' });
            userProfile = await dbService.getUserProfile(firebaseUser.uid);
          }
          
          setProfile(userProfile);
          if (userProfile?.role === 'admin') setView('admin');
        } catch (err) {
          console.error("Error fetching profile", err);
        }
      } else {
        setProfile(null);
        setCandidates([]);
        setView('vote');
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubscribeCandidates = dbService.subscribeCandidates((data) => {
      setCandidates(data);
    });

    return () => unsubscribeCandidates();
  }, [user]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      const unsubUsers = dbService.subscribeUsers(setUsers);
      const unsubVotes = dbService.subscribeVotes(setVotes);
      return () => {
        unsubUsers();
        unsubVotes();
      };
    }
  }, [profile]);

  const handleLogin = async () => {
    try {
      await authService.signInWithGoogle();
      toast.success('Bienvenue !');
    } catch (error) {
      toast.error('Erreur de connexion');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.signInWithEmail(email, password);
      toast.success('Bienvenue !');
    } catch (error: any) {
      toast.error(error.message || 'Erreur de connexion');
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    toast.success('Déconnecté');
  };

  const handleVote = async (candidateId: string) => {
    if (!user || profile?.hasVoted) return;
    
    setVoting(true);
    try {
      await dbService.castVote(user.uid, candidateId);
      const updatedProfile = await dbService.getUserProfile(user.uid);
      setProfile(updatedProfile);
      toast.success('Votre vote a été enregistré !', {
        icon: '🎉',
        duration: 5000
      });
    } catch (error) {
      toast.error('Erreur lors du vote');
    } finally {
      setVoting(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen night-bg font-sans text-slate-200 selection:bg-gold-500/30">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
          }
        }}
      />
      <Navbar user={user} profile={profile} onLogout={handleLogout} view={view} setView={setView} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!user ? (
          <div className="flex flex-col items-center justify-center py-20 text-center relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/5 blur-[120px] rounded-full -z-10" />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl w-full"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
                <Sparkles className="w-4 h-4 text-gold-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold-500">Événement de Prestige</span>
              </div>
              
              <h1 className="text-6xl sm:text-8xl font-serif font-black text-white tracking-tighter mb-8 leading-[0.9]">
                Soirée de Gala <br />
                <span className="gold-gradient">FS Bertoua</span>
              </h1>
              
              <p className="text-xl text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                Une nuit d'élégance et de distinction. <br />
                Soutenez l'excellence en votant pour votre candidate favorite.
              </p>
              
              <div className="space-y-8 max-w-md mx-auto">
                <button
                  onClick={handleLogin}
                  className="w-full bg-white text-black px-10 py-5 rounded-2xl font-black text-lg shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:bg-gold-500 hover:scale-[1.02] transition-all flex items-center justify-center gap-4"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
                  Continuer avec Google
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-[0.4em]"><span className="bg-[#050505] px-4 text-slate-500 font-black">Ou</span></div>
                </div>

                {!showEmailLogin ? (
                  <button 
                    onClick={() => setShowEmailLogin(true)}
                    className="text-gold-500 font-black uppercase tracking-widest text-xs hover:text-gold-400 transition-colors"
                  >
                    Accès par Identifiants
                  </button>
                ) : (
                  <form onSubmit={handleEmailLogin} className="space-y-5 text-left glass-card p-10 rounded-[2.5rem] border border-white/10">
                    <div>
                      <label className="block text-[10px] font-black text-gold-500 uppercase tracking-[0.2em] mb-2">Adresse Email</label>
                      <input 
                        type="email" 
                        required
                        className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl text-white focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gold-500 uppercase tracking-[0.2em] mb-2">Mot de Passe</label>
                      <input 
                        type="password" 
                        required
                        className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl text-white focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full gold-button py-5 rounded-2xl flex items-center justify-center gap-3"
                    >
                      <span>Se Connecter</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowEmailLogin(false)}
                      className="w-full text-slate-500 text-xs font-black uppercase tracking-widest hover:text-white transition-colors"
                    >
                      Retour
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-16">
            {profile?.role === 'admin' && view === 'admin' ? (
              <AdminPanel candidates={candidates} users={users} votes={votes} />
            ) : (
              <div className="space-y-16">
                <header className="text-center space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h2 className="text-5xl sm:text-7xl font-serif font-black text-white tracking-tighter">
                      {profile?.hasVoted ? "Merci de votre" : "Exprimez votre"} <br />
                      <span className="gold-gradient">{profile?.hasVoted ? "Participation" : "Soutien"}</span>
                    </h2>
                    <p className="text-slate-400 max-w-xl mx-auto mt-6 text-lg font-medium leading-relaxed">
                      {profile?.hasVoted 
                        ? "Votre voix a été enregistrée avec succès. Les résultats seront proclamés lors de la cérémonie de clôture." 
                        : "Chaque vote compte. Choisissez la candidate qui incarne le mieux les valeurs de notre faculté."}
                    </p>
                  </motion.div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {candidates.map((candidate: Candidate) => (
                    <CandidateCard 
                      key={candidate.id} 
                      candidate={candidate} 
                      onVote={handleVote}
                      disabled={voting || profile?.hasVoted || false}
                      hasVoted={profile?.hasVoted || false}
                    />
                  ))}
                  {candidates.length === 0 && (
                    <div className="col-span-full py-32 text-center glass-card rounded-[3rem] border-2 border-dashed border-white/5">
                      <Trophy className="w-16 h-16 text-white/10 mx-auto mb-6" />
                      <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-sm">Ouverture des candidatures prochainement</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-20 border-t border-white/5 mt-20 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center gap-8 mb-8">
            <div className="w-2 h-2 rounded-full bg-gold-500/20" />
            <div className="w-2 h-2 rounded-full bg-gold-500/40" />
            <div className="w-2 h-2 rounded-full bg-gold-500/20" />
          </div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.5em]">
            &copy; 2026 Faculté des Sciences de Bertoua &bull; Excellence &bull; Prestige
          </p>
        </div>
      </footer>
    </div>
  );
}
