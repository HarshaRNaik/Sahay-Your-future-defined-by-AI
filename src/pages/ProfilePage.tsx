import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ServerCog, UserRound, BadgeCheck, RefreshCw, Award, Mail, Fingerprint, Zap, BrainCircuit, Briefcase } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { authFetch } from '../services/backendApi';
import { getBackendOptions } from '../services/geminiService';
import SkillManager from '../components/SkillManager';
import { cn } from '../lib/utils';

export default function ProfilePage() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [jobType, setJobType] = useState('');
  const [savingJobType, setSavingJobType] = useState(false);
  const [backendOptions, setBackendOptions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (user) {
          const profileResponse = await authFetch('/api/profile');
          setProfile(profileResponse.profile);
          setJobType(profileResponse.profile?.jobType || '');
        }
        setBackendOptions(await getBackendOptions());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const saveJobType = async () => {
    if (!profile) return;
    setSavingJobType(true);
    try {
      await authFetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobType })
      });
      setProfile({ ...profile, jobType });
    } catch (err) {
      console.error("Failed to update job type", err);
    } finally {
      setSavingJobType(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-main">
        <RefreshCw size={48} className="text-brand-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-6 py-12 max-w-6xl mx-auto space-y-12 font-outfit bg-bg-main min-h-screen text-white pb-32">
      <div className="glow-bg right-0 opacity-10" />

      <div className="glass-card p-12 flex flex-col md:flex-row md:items-center justify-between gap-10 border-white/5 bg-gradient-to-br from-brand-blue/[0.02] to-transparent shadow-2xl">
        <div className="flex items-center gap-8">
          <div className="w-24 h-24 rounded-[2.5rem] bg-brand-blue/10 flex items-center justify-center overflow-hidden shadow-2xl border-2 border-brand-blue/30 rotate-2">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <UserRound size={40} className="text-brand-blue" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
               <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">
                {user?.displayName || profile?.displayName || 'Sahay User'}
              </h1>
              {profile?.verification?.status === 'verified' && (
                 <div className="w-6 h-6 rounded-full bg-brand-blue flex items-center justify-center shadow-xl shadow-brand-blue/20">
                    <BadgeCheck size={14} className="text-white" />
                 </div>
              )}
            </div>
            <p className="text-sm font-bold text-text-muted flex items-center gap-2">
               <Mail size={14} className="text-brand-blue" />
               {user?.email || profile?.email}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-xl border border-brand-blue/30 bg-brand-blue/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue shadow-lg">
                {profile?.role || 'Basic Node'}
              </span>
              <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted italic shadow-inner">
                Protocol: {profile?.verification?.status || 'Identity Required'}
              </span>
            </div>
          </div>
        </div>

        <button onClick={() => navigate('/verify')} className="btn-primary px-10 py-5 text-xs">
          <Fingerprint size={18} className="mr-3" />
          Update Credentials
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Trade Specialization Section */}
        <section className="glass-card p-10 lg:col-span-3 relative overflow-hidden group">
          <div className="absolute -top-24 -right-24 opacity-5 group-hover:opacity-10 transition-opacity">
            <Briefcase size={300} />
          </div>
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue border border-brand-blue/20">
               <Briefcase size={20} />
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white italic">Primary Trade Specification</h2>
          </div>

          <div className="relative z-10 max-w-2xl">
            <label className="grid gap-3 group">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted px-4 group-focus-within:text-brand-blue transition-colors">Economic Job Category</span>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  placeholder="e.g. INDUSTRIAL WELDER, CNC OPERATOR"
                  className="flex-1 rounded-3xl border border-white/5 bg-black/40 px-8 py-5 text-sm font-bold uppercase outline-none transition-all focus:border-brand-blue focus:bg-black/60 shadow-inner placeholder:opacity-20 text-white"
                />
                <button 
                  onClick={saveJobType}
                  disabled={savingJobType || jobType === (profile?.jobType || '')}
                  className="px-8 py-5 bg-brand-blue/10 hover:bg-brand-blue/20 border border-brand-blue/20 rounded-3xl text-[10px] font-black uppercase tracking-widest text-brand-blue transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  {savingJobType ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                  Commit Change
                </button>
              </div>
            </label>
            <p className="mt-4 text-[10px] text-text-muted italic opacity-50 px-4">
              This category determines which MSME clusters your node is broadcasted to for match optimization.
            </p>
          </div>
        </section>

        {/* Skills Section */}
        <section className="glass-card p-10 lg:col-span-3 relative overflow-hidden group">
           <div className="absolute -bottom-20 -left-20 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
             <BrainCircuit size={300} />
          </div>
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue border border-brand-blue/20">
               <BrainCircuit size={200} />
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white italic">Vocational Inventory</h2>
          </div>

          <div className="relative z-10">
            <SkillManager 
              initialSkills={profile?.skills || []} 
              onUpdate={(newSkills) => setProfile({ ...profile, skills: newSkills })} 
            />
          </div>
        </section>

        {/* Verification Status */}
        <section className="glass-card p-10 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
             <ShieldCheck size={200} />
          </div>
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue border border-brand-blue/20">
               <ShieldCheck size={20} />
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white italic">Protected Identity</h2>
          </div>
          
          <div className="space-y-8 relative z-10">
            <div className="p-6 rounded-[1.8rem] bg-black/40 border border-white/5 shadow-inner">
               <p className="text-[9px] text-text-muted uppercase tracking-widest mb-2 font-black">Aadhaar Reference</p>
               <p className="text-md font-mono font-black text-white tracking-widest">**** **** {profile?.verification?.aadhaarLast4 || 'XXXX'}</p>
            </div>
            <div className="p-6 rounded-[1.8rem] bg-black/40 border border-white/5 shadow-inner">
               <p className="text-[9px] text-text-muted uppercase tracking-widest mb-2 font-black">Verification Level</p>
               <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full shadow-lg", profile?.verification?.status === 'verified' ? "bg-green-500 shadow-green-500/50" : "bg-red-500 shadow-red-500/50")} />
                  <p className="text-md font-black text-white uppercase italic tracking-tighter">{profile?.verification?.idProofType || 'None'}</p>
               </div>
            </div>
            <p className="text-[10px] text-text-muted italic leading-relaxed px-2 opacity-50">Sahay Protocol encrypts legal identifiers using SHA-256 with industrial-grade salting.</p>
          </div>
        </section>

        {/* Backend Logic (Optional/Meta) */}
        <section className="glass-card p-10 lg:col-span-2 relative overflow-hidden group">
           <div className="absolute -bottom-20 -right-20 opacity-5 group-hover:opacity-10 transition-opacity rotate-45 scale-150">
             <ServerCog size={300} />
          </div>
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue border border-brand-blue/20">
               <ServerCog size={20} />
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white italic">Node Infrastructure</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            {Object.entries(backendOptions).map(([name, option]) => (
              <div key={name} className="group/opt rounded-[2rem] border border-white/5 bg-black/40 p-8 transition-all hover:border-brand-blue/30 shadow-inner">
                <div className="flex items-center justify-between mb-4">
                   <p className="text-xs font-black uppercase tracking-[0.2em] text-white group-hover/opt:text-brand-blue transition-colors">{name}</p>
                   <Zap size={14} className="text-brand-blue opacity-20" />
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-[9px] font-black uppercase bg-brand-blue/10 text-brand-blue px-2 py-1 rounded border border-brand-blue/20">{option.method}</span>
                   <p className="text-[10px] font-mono text-text-muted tracking-tight">{option.path}</p>
                </div>
                <p className="mt-6 text-xs leading-relaxed text-text-muted font-medium italic opacity-70">
                  {option.details}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
      
      <div className="pt-20 opacity-20 text-center">
         <p className="text-[9px] font-black uppercase tracking-[1em] text-white">Transmission Node Sahay-1.0</p>
      </div>
    </div>
  );
}
