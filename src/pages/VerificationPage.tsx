import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, BriefcaseBusiness, ShieldCheck, UserRoundCheck, ArrowRight, Zap, Info, RefreshCw } from 'lucide-react';
import { verifyIdProof, VerificationRole } from '../services/securityApi';

export default function VerificationPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<VerificationRole>('employee');
  const [legalName, setLegalName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
       setError("System protocol requires consent for ID verification.");
       return;
    }
    setLoading(true);
    setError(null);

    try {
      await verifyIdProof({
        role,
        legalName,
        organizationName,
        aadhaarNumber,
        consent,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification transmission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main px-6 py-12 font-outfit text-white relative overflow-hidden flex items-center justify-center">
      <div className="glow-bg opacity-20" />
      
      <div className="w-full max-w-3xl relative z-10">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-brand-blue/30 bg-brand-blue/10 text-[10px] uppercase tracking-[0.4em] font-black text-brand-blue mb-12 shadow-2xl"
        >
          <ShieldCheck size={14} className="animate-pulse" />
          Identity Proofing Protocol
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={submitVerification}
          className="glass-card w-full border-white/5 p-12 md:p-16 shadow-[0_80px_150px_rgba(0,0,0,0.8)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-blue/5 rounded-bl-[10rem] opacity-50" />

          <div className="mb-16 flex items-center gap-8 relative z-10">
            <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-brand-blue/10 text-brand-blue shadow-2xl border border-brand-blue/20 rotate-3 transition-transform hover:rotate-0">
              <ShieldCheck size={36} />
            </div>
            <div>
              <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-3">Initialize Node</h1>
              <p className="text-sm font-medium text-text-muted italic opacity-70 tracking-wide">Validate your identity for vocational and institutional access.</p>
            </div>
          </div>

          <div className="mb-12 grid grid-cols-2 gap-6 relative z-10">
            <button
              type="button"
              onClick={() => setRole('employee')}
              className={`group flex min-h-[140px] flex-col items-center justify-center gap-4 rounded-[2.5rem] border-2 p-6 transition-all duration-500 ${
                role === 'employee'
                  ? 'border-brand-blue bg-brand-blue/10 text-white shadow-2xl shadow-brand-blue/20'
                  : 'border-white/5 bg-white/[0.02] text-text-muted hover:bg-white/5 hover:border-white/10'
              }`}
            >
              <UserRoundCheck size={32} className={role === 'employee' ? 'text-white' : 'group-hover:text-white transition-colors'} />
              <div className="text-center">
                <span className="block text-[11px] font-black uppercase tracking-[0.25em]">Worker Node</span>
                <span className="text-[9px] opacity-40 uppercase font-black tracking-widest mt-1">Seeking Service</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setRole('employer')}
              className={`group flex min-h-[140px] flex-col items-center justify-center gap-4 rounded-[2.5rem] border-2 p-6 transition-all duration-500 ${
                role === 'employer'
                  ? 'border-brand-blue bg-brand-blue/10 text-white shadow-2xl shadow-brand-blue/20'
                  : 'border-white/5 bg-white/[0.02] text-text-muted hover:bg-white/5 hover:border-white/10'
              }`}
            >
              <BriefcaseBusiness size={32} className={role === 'employer' ? 'text-white' : 'group-hover:text-white transition-colors'} />
              <div className="text-center">
                <span className="block text-[11px] font-black uppercase tracking-[0.25em]">MSME Node</span>
                <span className="text-[9px] opacity-40 uppercase font-black tracking-widest mt-1">Site Requirement</span>
              </div>
            </button>
          </div>

          <div className="grid gap-8 relative z-10">
            <label className="grid gap-3 group">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted px-4 group-focus-within:text-brand-blue transition-colors">Legal Identity Name</span>
              <input
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                required
                maxLength={100}
                placeholder="PROPER CASE NAME"
                className="rounded-3xl border border-white/5 bg-black/40 px-8 py-6 text-sm font-bold outline-none transition-all focus:border-brand-blue focus:bg-black/60 shadow-inner placeholder:opacity-10"
              />
            </label>

            {role === 'employer' && (
              <label className="grid gap-3 animate-in slide-in-from-top-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted px-4">Organization Hub UID</span>
                <input
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  required
                  maxLength={140}
                  placeholder="GSTIN / REGISTRATION NO."
                  className="rounded-3xl border border-white/5 bg-black/40 px-8 py-6 text-sm font-bold outline-none transition-all focus:border-brand-blue focus:bg-black/60 shadow-inner placeholder:opacity-10"
                />
              </label>
            )}

            <label className="grid gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted px-4">Aadhaar Identification</span>
              <input
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value.replace(/[^\d]/g, '').slice(0, 12))}
                required
                inputMode="numeric"
                autoComplete="off"
                placeholder="0000 0000 0000"
                className="rounded-3xl border border-white/5 bg-black/40 px-8 py-6 text-sm font-mono font-black outline-none transition-all focus:border-brand-blue focus:bg-black/60 shadow-inner tracking-widest placeholder:opacity-10"
              />
              <div className="flex items-center gap-3 px-4 mt-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-40">System only stores salted digest and suffix metadata.</span>
              </div>
            </label>

            <label className="flex items-start gap-5 rounded-[2rem] bg-white/[0.02] border border-white/5 p-8 transition-all hover:bg-white/[0.04]">
              <div className="relative flex items-center">
                 <input
                   type="checkbox"
                   checked={consent}
                   onChange={(e) => setConsent(e.target.checked)}
                   className="peer h-6 w-6 opacity-0 absolute z-10 cursor-pointer"
                 />
                 <div className="h-6 w-6 rounded-lg border-2 border-white/20 flex items-center justify-center peer-checked:bg-brand-blue peer-checked:border-brand-blue transition-all">
                    <Check size={14} className="text-white font-black" />
                 </div>
              </div>
              <p className="text-xs font-bold leading-relaxed text-text-muted italic">
                I authorize Sahay to verify this credential via industrial trust consensus. I acknowledge that accurate identification is a mandatory protocol for direct bank transfers and safety audits.
              </p>
            </label>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 rounded-[2rem] border border-red-500/20 bg-red-500/5 p-6 flex gap-4 text-left shadow-2xl"
            >
              <Info size={18} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400 leading-tight">
                {error}
              </p>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-12 flex w-full items-center justify-center gap-4 rounded-[2rem] bg-white py-6 text-xs font-black uppercase tracking-[0.3em] text-black shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all hover:bg-gray-100 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-3">
                 <RefreshCw size={20} className="animate-spin" />
                 CALIBRATING CONSENSUS...
              </div>
            ) : (
              <>
                <BadgeCheck size={20} />
                Initialize Verification Protocol
              </>
            )}
          </button>
        </motion.form>
        
        <div className="mt-12 flex justify-center items-center gap-8 opacity-20">
           <Zap className="text-brand-blue" size={24} />
           <div className="h-px bg-white/10 flex-1" />
           <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white">Encrypted Node Validation</p>
           <div className="h-px bg-white/10 flex-1" />
           <ShieldCheck className="text-brand-blue" size={24} />
        </div>
      </div>
    </div>
  );
}

const Check = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
