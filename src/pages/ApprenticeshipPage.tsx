import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  MapPin,
  Search,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  History,
  Zap,
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { getJobMatches, getJobs, submitApplication } from '../services/geminiService';
import JobMap from '../components/JobMap';

export default function ApprenticeshipPage() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const jobData = await getJobs();
        setJobs(jobData);
        if (user) {
          // Attempt to get matches if possible
          const matchData = await getJobMatches([]);
          setMatches(Array.isArray(matchData) ? matchData : []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const filteredJobs = jobs.filter((job) => {
    const text = `${job.title} ${job.category} ${job.company} ${job.location} ${job.description}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  const matchFor = (jobId: string) => matches.find((match) => match.jobId === jobId);

  const handleApply = async (job: any) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const match = matchFor(job.id) || {};
    setStatus(`Applying for ${job.title}...`);
    try {
      await submitApplication({
        jobId: job.id,
        matchScore: match.matchScore || 0,
        matchingReason: match.matchingReason || 'Self-initiated application.',
      });
      setStatus(`Application for ${job.title} broadcasted.`);
      setTimeout(() => setStatus(null), 4000);
    } catch (err) {
      setStatus('Broadcasting failed. Check node connection.');
    }
  };

  return (
    <div className="px-6 py-12 max-w-7xl mx-auto space-y-20 font-outfit bg-bg-main min-h-screen pb-32">
      <div className="glow-bg left-0 opacity-10" />

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="text-left flex-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-brand-blue font-black text-[10px] uppercase tracking-[0.4em] mb-6 italic"
          >
            <History size={14} className="animate-spin-slow" />
            Live Institutional Feed
          </motion.div>
          <h1 className="text-5xl font-black text-white tracking-tighter sm:text-7xl lg:text-8xl uppercase italic leading-[0.85] py-2">
            Sahay <span className="text-brand-blue">Apprenticeships</span>
          </h1>
          <p className="text-text-muted mt-8 max-w-xl text-xl font-medium leading-relaxed">
            Browse verified NAPS industrial vacancies. AI scores your suitability for each institutional node.
          </p>
        </div>

        <div className="relative group w-full md:w-auto">
          <div className="absolute -inset-1 bg-brand-blue/20 rounded-[2rem] blur opacity-25 group-hover:opacity-100 transition duration-1000" />
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted opacity-30" size={24} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search trade, company, MSME..."
              className="bg-bg-card/50 border border-white/10 rounded-[2rem] py-6 px-16 text-white text-lg focus:border-brand-blue/30 outline-none w-full md:w-[420px] font-bold transition-all placeholder:text-text-muted/20 backdrop-blur-xl shadow-2xl"
            />
          </div>
        </div>
      </div>

      {status && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-10 py-5 rounded-[2rem] bg-brand-blue text-white text-xs font-black uppercase tracking-[0.35em] shadow-[0_20px_50px_rgba(59,130,246,0.3)] flex items-center gap-4"
        >
          <Zap size={18} className="animate-pulse" />
          {status}
        </motion.div>
      )}

      {/* Visual Map Node */}
      {!loading && filteredJobs.length > 0 && (
        <div className="space-y-10">
          <div className="flex items-center gap-4 px-6 border-l-2 border-brand-blue">
            <h2 className="text-sm uppercase tracking-[0.4em] font-black text-white italic">Geographic Vacancy Matrix</h2>
          </div>
          <div className="rounded-[4rem] overflow-hidden border border-white/5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] relative group">
             <div className="absolute inset-0 bg-brand-blue/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" />
             <JobMap jobs={filteredJobs} />
          </div>
        </div>
      )}

      {/* Vacancy Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[450px] rounded-[3.5rem] bg-white/[0.02] animate-pulse border border-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {filteredJobs.map((job: any) => {
            const match = matchFor(job.id);
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="glass-card p-12 group relative overflow-hidden flex flex-col h-full border-white/5 hover:border-brand-blue/30 transition-all duration-700 shadow-2xl bg-gradient-to-br from-white/[0.02] to-transparent"
              >
                <div className="absolute -top-20 -right-20 opacity-5 group-hover:opacity-10 transition-opacity rotate-12 duration-1000 scale-150">
                  <Briefcase size={300} />
                </div>

                <div className="mb-12 relative z-10">
                  <div className="flex items-center justify-between mb-10">
                    <div className="w-20 h-20 bg-brand-blue/10 rounded-[2rem] flex items-center justify-center text-brand-blue border border-brand-blue/20 shadow-2xl shadow-brand-blue/10 rotate-2 group-hover:rotate-0 transition-transform">
                      {job.category === 'Apprenticeship' ? <GraduationCap size={40} /> : <Briefcase size={40} />}
                    </div>
                    <div className="px-6 py-2 rounded-full bg-brand-blue/10 border border-brand-blue/30 text-[10px] text-brand-blue tracking-[0.2em] font-black uppercase italic shadow-xl">
                      {match?.matchScore ? `${match.matchScore}% Suitability` : job.category || 'Direct Hire'}
                    </div>
                  </div>

                  <h3 className="text-3xl font-black text-white mb-3 leading-tight group-hover:text-brand-blue transition-colors uppercase italic tracking-tighter">
                    {job.title}
                  </h3>
                  <p className="text-[11px] text-brand-blue uppercase tracking-[0.3em] font-black italic opacity-60">
                    {job.company}
                  </p>
                </div>

                <div className="space-y-6 mb-12 flex-1 relative z-10">
                  <div className="flex items-center gap-4 text-text-muted text-sm font-bold tracking-tight">
                    <MapPin size={22} className="text-brand-blue opacity-50" />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-4 text-text-muted text-sm font-bold tracking-tight">
                    <CheckCircle2 size={22} className="text-green-500 opacity-80" />
                    Verified Industrial Site
                  </div>
                  
                  <div className="mt-10 p-8 rounded-[2.5rem] bg-black/40 border border-white/5 text-sm text-white/70 leading-relaxed font-medium italic opacity-90 backdrop-blur-3xl shadow-inner line-clamp-4 group-hover:line-clamp-none transition-all duration-700">
                    "{match?.matchingReason || job.description}"
                  </div>
                </div>

                <div className="flex items-center justify-between pt-10 border-t border-white/5 relative z-10">
                  <div className="flex flex-col">
                    <p className="text-[9px] text-text-muted uppercase font-black tracking-widest mb-1">Scale / Stipend</p>
                    <div className="font-mono text-white text-2xl font-black italic tracking-tighter">
                      {job.salary}
                    </div>
                  </div>
                  <button
                    onClick={() => handleApply(job)}
                    className="flex items-center gap-3 bg-white text-black px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] group/btn hover:bg-brand-blue hover:text-white transition-all shadow-2xl active:scale-[0.9]"
                  >
                    {user ? 'Initialize Apply' : 'Auth Required'} <ArrowRight size={18} className="group-hover/btn:translate-x-2 transition-transform" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* MSME CTA */}
      <div className="mt-32 p-20 glass-card text-center border-dashed bg-gradient-to-br from-brand-blue/10 to-transparent border-brand-blue/30 relative overflow-hidden group shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-0 bg-brand-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="w-20 h-20 bg-brand-blue/10 rounded-[2rem] flex items-center justify-center text-brand-blue mb-10 mx-auto shadow-2xl rotate-12 group-hover:rotate-0 transition-transform">
             <Briefcase size={36} />
          </div>
          <h2 className="text-5xl font-black text-white mb-8 uppercase italic tracking-tighter leading-none">Are you an MSME Node?</h2>
          <p className="text-text-muted mb-16 text-xl font-medium leading-relaxed">
            Directly connect your industrial site to Sahay's verified ITI labor pool. Zero brokerage, 100% vocational alignment.
          </p>
          <button 
            onClick={() => navigate(user ? '/contractor' : '/auth')} 
            className="btn-primary px-16 py-6 text-sm group"
          >
            Register Business Node <ArrowRight size={20} className="ml-4 group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
