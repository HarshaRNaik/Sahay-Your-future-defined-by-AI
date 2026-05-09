import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  MapPin, 
  Users, 
  Clock, 
  ChevronRight, 
  FileText, 
  Download,
  CheckCircle2,
  PhoneCall,
  Sparkles,
  Zap,
  Briefcase,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { createJob, generateSiteReport, getApplications } from '../services/geminiService';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';

export default function ContractorPage() {
  const [user] = useAuthState(auth);
  const [report, setReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [jobForm, setJobForm] = useState({
    title: 'Precision Machining Crew',
    category: 'Full-Time / ITI',
    company: '',
    location: 'Peenya Hub, Bengaluru',
    salary: '₹950/day Base',
    description: 'Looking for 3 ITI Machinist graduates with CNC knowledge for a verified contractor site.',
  });

  const activeSites = [
    {
      id: "site_node_77",
      trade: "Precision Machining",
      location: "Peenya Industrial Area",
      workersNeeded: 3,
      workersPlaced: 1,
      wage: "₹950/day",
      status: "Actively Vetting",
      payoutProtocol: "Direct Daily Transfer"
    }
  ];

  const handleGenerateReport = async () => {
    setLoadingReport(true);
    try {
      const data = await generateSiteReport({
        siteData: activeSites[0],
        personnel: [{ name: "Harsha N", trade: "ITI Machinist", status: "Active / Verified" }]
      });
      setReport(data.report);
    } catch (err) {
      console.error(err);
      setStatus("Error calibrating report engine.");
    } finally {
      setLoadingReport(false);
    }
  };

  const handlePostSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Transmitting site protocol...');
    try {
      await createJob({ ...jobForm, company: user?.displayName || 'Sahay Partner' });
      setStatus('Node published to public vacancy feed.');
      setShowPostForm(false);
      setTimeout(() => setStatus(null), 4000);
    } catch (err) {
      setStatus('Transmission disruption. Check node authentication.');
    }
  };

  const handleManageRoster = async () => {
    setShowRoster(true);
    setStatus('Syncing applicant database...');
    try {
      const data = await getApplications();
      setApplications(data);
      setStatus(null);
    } catch (err) {
      setStatus('Database sync error.');
    }
  };

  return (
    <div className="px-6 py-12 max-w-7xl mx-auto space-y-16 font-outfit bg-bg-main min-h-screen pb-32">
      <div className="glow-bg top-0 right-0 opacity-10" />

      {/* Institutional Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="flex-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-brand-blue font-black text-[10px] uppercase tracking-[0.4em] mb-6 italic"
          >
            <ShieldCheck size={14} />
            Institutional Node Hub
          </motion.div>
          <h1 className="text-5xl font-black text-white tracking-tighter sm:text-7xl uppercase italic leading-none">
            Sahay <span className="text-brand-blue">Contractor</span>
          </h1>
          <p className="text-text-muted mt-8 text-xl font-medium leading-relaxed max-w-2xl">
            Streamline industrial site workforce management. Automate vetting, compliance reports, and direct daily payouts.
          </p>
        </div>
        <button 
          onClick={() => setShowPostForm(!showPostForm)} 
          className="btn-primary group px-12 py-6 text-sm"
        >
          {showPostForm ? 'Exit Protocol' : 'Deploy New Site Node'} <Plus size={20} className="ml-4" />
        </button>
      </div>

      {status && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-[2rem] border border-brand-blue/30 bg-brand-blue/10 text-xs font-black uppercase tracking-[0.3em] text-brand-blue flex items-center gap-4 shadow-xl backdrop-blur-xl"
        >
          <Zap size={18} className="animate-pulse" />
          {status}
        </motion.div>
      )}

      {showPostForm && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 border-brand-blue/20 bg-gradient-to-br from-brand-blue/[0.03] to-transparent shadow-[0_50px_100px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center gap-4 mb-12">
             <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue border border-brand-blue/20">
                <Briefcase size={24} />
             </div>
             <h2 className="text-xl font-black text-white uppercase italic tracking-widest">Construct Vacancy Node</h2>
          </div>

          <form onSubmit={handlePostSite} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              ['title', 'Industrial Role / Trade'],
              ['category', 'Listing Protocol'],
              ['location', 'Geographic Cluster'],
              ['salary', 'Daily Scaled Pay / Stipend'],
            ].map(([key, label]) => (
              <label key={key} className="grid gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted px-2">{label}</span>
                <input
                  value={(jobForm as any)[key]}
                  onChange={(e) => setJobForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="rounded-2xl border border-white/5 bg-black/40 px-6 py-5 text-sm font-bold text-white outline-none focus:border-brand-blue/40 shadow-inner transition-all"
                  required
                />
              </label>
            ))}
            <label className="md:col-span-2 grid gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted px-2">Detailed Site Protocol (Description)</span>
              <textarea
                value={jobForm.description}
                onChange={(e) => setJobForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="rounded-[2rem] border border-white/5 bg-black/40 px-6 py-5 text-sm font-bold text-white outline-none focus:border-brand-blue/40 shadow-inner transition-all resize-none"
                required
              />
            </label>
            <button className="btn-primary md:col-span-2 py-6 text-sm">Initialize Transmission</button>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Active Sites Monitor */}
        <div className="lg:col-span-2 space-y-12">
          <div className="flex items-center gap-4 px-6 border-l-2 border-brand-blue">
            <h2 className="text-sm uppercase tracking-[0.4em] font-black text-white italic">Active Node Registry</h2>
          </div>
          
          {activeSites.map(site => (
            <motion.div 
              key={site.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-12 border-white/5 bg-gradient-to-br from-brand-blue/[0.02] to-transparent hover:border-brand-blue/20 transition-all duration-700 shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-bl-[6rem] opacity-50 group-hover:bg-brand-blue/10 transition-colors" />
              
              <div className="flex justify-between items-start mb-12 relative z-10">
                <div>
                  <h3 className="text-4xl font-black text-white mb-4 italic uppercase tracking-tighter">{site.trade} Network</h3>
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest bg-white/5 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-xl">
                      <MapPin size={14} className="text-brand-blue" /> {site.location}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest bg-brand-blue/10 px-5 py-2.5 rounded-full border border-brand-blue/20 text-brand-blue italic">
                      <Clock size={14} /> LIVE MONITORING
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-brand-blue font-mono font-black text-3xl italic leading-none mb-2 tracking-tighter">{site.wage}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-[0.3em] font-black opacity-60">{site.payoutProtocol}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12 relative z-10">
                <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 shadow-inner">
                  <p className="text-[9px] text-text-muted uppercase tracking-[0.3em] font-black mb-4">Protocol Status</p>
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                     <p className="text-md font-black text-white uppercase italic tracking-tighter">{site.status}</p>
                  </div>
                </div>
                <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 shadow-inner">
                  <p className="text-[9px] text-text-muted uppercase tracking-[0.3em] font-black mb-4">Placement Delta</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-mono font-black text-white leading-none">{site.workersPlaced}/{site.workersNeeded}</span>
                    <Users size={18} className="text-text-muted opacity-40 shrink-0" />
                  </div>
                </div>
                <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 shadow-inner relative overflow-hidden group/mini">
                  <div className="absolute inset-0 bg-brand-blue opacity-0 group-hover/mini:opacity-5 transition-opacity duration-1000" />
                  <p className="text-[9px] text-text-muted uppercase tracking-[0.3em] font-black mb-4">Verified Pipeline</p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-mono font-black text-brand-blue tracking-tighter leading-none italic animate-pulse">4 Nodes</span>
                    <ChevronRight size={18} className="text-brand-blue opacity-40" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-8 pt-12 border-t border-white/5 relative z-10">
                <div className="flex-1 w-full p-8 rounded-[2.5rem] bg-brand-blue/5 border border-brand-blue/10 flex items-center justify-between backdrop-blur-3xl shadow-xl">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-brand-blue rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-brand-blue/40 rotate-3">
                      <PhoneCall size={32} />
                    </div>
                    <div>
                      <p className="text-[10px] text-brand-blue uppercase tracking-[0.35em] font-black mb-1">AI Match Inbound</p>
                      <p className="text-md text-white font-bold tracking-tight italic opacity-90">Sahay calling 4 fitter graduates...</p>
                    </div>
                  </div>
                  <ExternalLink size={20} className="text-brand-blue opacity-50 hidden sm:block" />
                </div>
                <button 
                   onClick={handleManageRoster} 
                   className="h-20 px-12 bg-white text-black text-[11px] font-black uppercase tracking-[0.3em] rounded-3xl hover:bg-brand-blue hover:text-white transition-all w-full sm:w-auto shadow-2xl active:scale-[0.95] shrink-0"
                >
                  Manage Roster Node
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Reports & Actions */}
        <div className="lg:col-span-1 space-y-8">
          <div className="flex items-center gap-4 px-2">
            <h2 className="text-xs uppercase tracking-[0.4em] font-black text-text-muted italic">Compliance Matrix</h2>
          </div>
          
          <div className="glass-card p-10 bg-gradient-to-br from-brand-blue/5 to-transparent border-white/5 shadow-2xl">
            <div className="w-16 h-16 bg-white/[0.03] border border-white/10 rounded-3xl flex items-center justify-center text-brand-blue mb-10 shadow-inner">
              <FileText size={32} />
            </div>
            <h3 className="text-2xl font-black text-white mb-3 italic uppercase tracking-tighterLeading-none">Site Attendance Code</h3>
            <p className="text-xs text-text-muted mb-12 leading-relaxed font-medium">Broadcast a formal industrial summary including payout thresholds and safety audit alignment.</p>
            
            <button 
              onClick={handleGenerateReport}
              disabled={loadingReport}
              className="w-full bg-white text-black rounded-2xl py-5 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl hover:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loadingReport ? (
                <div className="flex items-center gap-3">
                   <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-black" />
                   Processing Roster...
                </div>
              ) : (
                <>
                  <Download size={20} /> Generate Site Summary
                </>
              )}
            </button>

            {report && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-10 p-8 rounded-[2rem] bg-black/50 border border-white/10 text-[10px] font-mono leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto text-white/80 shadow-inner italic"
              >
                <div className="flex items-center gap-2 mb-4 text-brand-blue/60 border-b border-white/5 pb-2">
                   <Sparkles size={12} />
                   <span>AI GENERATED AUDIT CODE</span>
                </div>
                {report}
              </motion.div>
            )}
          </div>

          <div className="glass-card p-10 border-green-500/10 bg-green-500/[0.02] shadow-2xl group overflow-hidden">
            <div className="absolute -right-5 -bottom-5 w-24 h-24 bg-green-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
                <CheckCircle2 size={20} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white italic">Trust Consensus</h3>
            </div>
            <p className="text-[12px] text-text-muted leading-relaxed font-medium">This site node adheres to <strong>Sahay Institutional Welfare Standards</strong>. All placements require OTP attendance verification for direct bank transfer protocol.</p>
          </div>
        </div>
      </div>

      {showRoster && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-2xl p-6 flex items-center justify-center"
        >
          <div className="glass-card w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-12 shadow-[0_100px_200px_rgba(0,0,0,1)] border-white/10 relative">
             <button 
                onClick={() => setShowRoster(false)}
                className="absolute top-10 right-10 w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors border border-white/10"
             >
                <Plus className="rotate-45" size={24} />
             </button>

             <div className="mb-12">
                <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4Leading-none">Personnel Pipeline</h3>
                <p className="text-text-muted text-lg font-medium">Verify and deploy matched industrial graduates.</p>
             </div>

             <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                {applications.length > 0 ? (
                  applications.map((app) => (
                    <motion.div 
                      key={app.id} 
                      whileHover={{ x: 10 }}
                      className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-8 group/item hover:bg-brand-blue/[0.03] hover:border-brand-blue/20 transition-all duration-500"
                    >
                      <div className="flex items-center gap-8">
                         <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-text-muted group-hover/item:text-brand-blue group-hover/item:border-brand-blue/20 transition-all">
                            <Users size={28} />
                         </div>
                         <div>
                            <div className="flex items-center gap-3">
                               <p className="text-xl font-black text-white uppercase italic tracking-tight">{app.workerId.slice(0, 8)}</p>
                               <span className="px-3 py-1 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-[8px] font-black text-brand-blue uppercase tracking-widest leading-none">Scored: {app.matchScore}%</span>
                            </div>
                            <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-black mt-2">Node Application Ref: {app.id}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                         <div className="flex-1 sm:flex-none text-right mr-4 hidden sm:block">
                            <p className="text-[9px] text-text-muted uppercase tracking-[0.3em] font-black mb-1">Current Protocol</p>
                            <span className="text-[10px] font-black text-brand-blue uppercase tracking-[0.2em] italic">{app.status}</span>
                         </div>
                         <button className="flex-1 sm:flex-none h-16 px-10 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-brand-blue hover:text-white transition-all active:scale-[0.9] shadow-xl">
                            Deploy Worker
                         </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 opacity-20">
                     <Users size={64} className="mb-6" />
                     <p className="text-xl font-bold uppercase tracking-[0.3em] italic">Pipeline Clear</p>
                  </div>
                )}
             </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
