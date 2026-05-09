import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Download, 
  Map as MapIcon, 
  Briefcase, 
  Award, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  RefreshCw,
  Send,
  Copy,
  Check,
  Zap,
  Sparkles,
  UserRound,
  Mic
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { generateResume, getJobMatches, notifyTelegram, submitApplication, getJobs } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import JobMap from '../components/JobMap';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const mockJobs = [
  {
    id: "1",
    title: "Industrial Welder Apprentice",
    category: "Apprenticeship",
    company: "Tata Motors MSME",
    location: "Peenya Industrial Area",
    salary: "₹12,000/stipend",
    description: "TIG/MIG welding for ITI Fitter graduates. NAPS certificate provided."
  },
  {
    id: "2",
    title: "Maintenance Electrician",
    category: "Full-Time",
    company: "Bosch Ltd",
    location: "Anekal, KA",
    salary: "₹22,000/mo",
    description: "Fault diagnosis and machine maintenance."
  },
  {
    id: "3",
    title: "Machinist Trainee",
    category: "ITI-Targeted",
    company: "BEML MSME",
    location: "Belagavi, KA",
    salary: "₹15,000/mo",
    description: "CNC operation and lathe work for ITI Machinist passouts."
  }
];

export default function DashboardPage() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [resume, setResume] = useState<string | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingResume, setGeneratingResume] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProfileAndData();
    }
  }, [user]);

  const loadProfileAndData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [docSnap, jobsData] = await Promise.all([
        getDoc(doc(db, 'users', user.uid)),
        getJobs()
      ]);
      
      setAllJobs(jobsData);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        if (data.skills && data.skills.length > 0) {
          const matchData = await getJobMatches(data.skills);
          setMatches(matchData);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResume = async () => {
    if (!profile) return;
    setGeneratingResume(true);
    try {
      const text = await generateResume(profile);
      setResume(text);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingResume(false);
    }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('resume-content');
    if (!element) return;
    const canvas = await html2canvas(element, { backgroundColor: '#ffffff', scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Sahay_Resume_${profile?.displayName || 'Worker'}.pdf`);
  };

  const handleCopyText = async () => {
    if (!resume) return;
    try {
      await navigator.clipboard.writeText(resume);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const handleApply = async (job: any, match: any) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setNotificationStatus(`Applying to ${job.title}...`);
    try {
      await submitApplication({
        jobId: job.id,
        matchScore: match?.matchScore || 0,
        matchingReason: match?.matchingReason || 'Direct interest.',
      });
      if (profile?.telegramHandle) {
        await notifyTelegram({
          telegramHandle: profile.telegramHandle,
          jobTitle: job.title,
          company: job.company,
          matchScore: match?.matchScore,
          reason: match?.matchingReason
        });
      }
      setNotificationStatus("Application Sent Successfully!");
      setTimeout(() => setNotificationStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setNotificationStatus("Application Submission Error.");
      setTimeout(() => setNotificationStatus(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-main text-white">
        <RefreshCw size={48} className="text-brand-blue animate-spin" />
      </div>
    );
  }

  if (!profile || (!profile.jobType && !profile.skills?.length)) {
    return (
      <div className="flex flex-col h-screen items-center justify-center px-6 text-center font-outfit bg-bg-main">
        <div className="glow-bg opacity-20" />
        <div className="w-24 h-24 bg-brand-blue/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-brand-blue/20 shadow-2xl rotate-3">
          <Zap size={48} className="text-brand-blue" />
        </div>
        <h1 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase italic">HUB CALIBRATION REQ.</h1>
        <p className="text-text-muted mb-10 max-w-sm text-lg font-medium leading-relaxed">
          The node is empty. You must speak to Sahay AI to calibrate your trade profile.
        </p>
        <button 
          onClick={() => navigate('/chat')}
          className="btn-primary px-12 py-5"
        >
          Initialize AI Session
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 px-8 py-10 max-w-[1600px] mx-auto min-h-screen pb-32">
      <div className="glow-bg right-0 top-0 opacity-10" />

      {/* Left Sidebar: Voice & AI Profile */}
      <section className="w-full lg:w-[360px] flex flex-col gap-8 shrink-0">
        {/* Voice Matcher / AI Status Panel */}
        <div className="glass rounded-[2rem] p-8 flex flex-col gap-6 border-brand-blue/30 pulse glow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-blue mono">Voice Matcher Active</span>
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          </div>
          <div className="bg-black/40 rounded-2xl p-6 min-h-[100px] border border-white/5 shadow-inner">
            <p className="text-sm italic text-gray-300 leading-relaxed font-medium">
              "{profile.jobType ? `I have ${profile.experience || 'some'} experience in ${profile.jobType}, and I'm looking for ${profile.skills?.[0] || 'work'} near ${profile.location || 'here'}...` : "Waiting for calibration input... Speak to Sahay AI to begin."}"
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(profile.skills || []).slice(0, 3).map((skill: string) => (
              <span key={skill} className="px-3 py-1 bg-brand-blue/10 text-brand-blue text-[10px] rounded-lg border border-brand-blue/20 mono font-bold uppercase">
                #{skill.replace(/\s+/g, '_')}
              </span>
            ))}
          </div>
          <button 
            onClick={() => navigate('/chat')}
            className="w-full py-4 btn-primary text-sm glow flex items-center justify-center gap-3"
          >
            <Mic className="animate-pulse" size={18} />
            Continue Calibration
          </button>
        </div>

        {/* Digital Profile Status */}
        <div className="glass rounded-[2rem] p-8 flex flex-col gap-8">
          <h3 className="text-sm font-black uppercase tracking-[0.2em]">Profile Architecture</h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                <span className="text-text-muted">Verification Strength</span>
                <span className="text-brand-blue">85%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "85%" }}
                  className="h-full accent-gradient" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
                <p className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-2">Trade</p>
                <p className="text-xs font-black text-white italic truncate">{profile.jobType || 'Pending'}</p>
              </div>
              <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
                <p className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-2">Node Rating</p>
                <p className="text-xs font-black text-brand-blue italic">4.9 ★</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resume Generation */}
        <div className="glass rounded-[2rem] p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-[0.2em]">Professional Document</h3>
            {resume && (
              <button onClick={handleExportPDF} className="p-2 hover:bg-white/10 rounded-full transition-colors text-brand-blue" title="Export PDF">
                <Download size={16} />
              </button>
            )}
          </div>
          
          {!resume ? (
            <button 
              onClick={handleCreateResume}
              disabled={generatingResume}
              className="w-full py-4 glass border border-brand-blue/30 text-brand-blue text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-brand-blue/10 transition-all flex justify-center items-center gap-2"
            >
              {generatingResume ? <RefreshCw className="animate-spin" size={16} /> : <FileText size={16} />}
              {generatingResume ? "Synthesizing Document..." : "Generate Neural Resume"}
            </button>
          ) : (
            <div className="relative group">
              <div 
                id="resume-content"
                className="bg-white/5 border border-white/10 p-6 rounded-2xl max-h-[300px] overflow-y-auto text-xs text-gray-300 font-sans whitespace-pre-wrap leading-relaxed shadow-inner"
              >
                <ReactMarkdown>{resume}</ReactMarkdown>
              </div>
              <button 
                onClick={handleCopyText}
                className="absolute top-4 right-8 p-2 bg-black/40 hover:bg-brand-blue/20 rounded-lg text-white transition-colors opacity-0 group-hover:opacity-100 backdrop-blur-md border border-white/10"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Right Content Area: Map & Job Listings */}
      <section className="flex-1 flex flex-col gap-10">
        {notificationStatus && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass fixed top-8 right-8 z-[100] px-8 py-4 rounded-full border-brand-blue/40 text-[10px] font-black uppercase tracking-[0.3em] glow flex items-center gap-4"
          >
            <Sparkles size={16} className="text-brand-blue animate-pulse" />
            {notificationStatus}
          </motion.div>
        )}

        {/* Map Area */}
        <div className="h-[320px] rounded-[2.5rem] overflow-hidden glass relative border-white/5 group shadow-2xl">
          <div className="absolute inset-0 bg-brand-blue/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" />
          <div className="absolute top-6 left-6 z-20 glass px-4 py-2 rounded-full text-[10px] font-black text-brand-blue flex items-center gap-3 border-brand-blue/30 glow">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {matches.length || 14} Jobs Detected In Your Cluster
          </div>
          <JobMap jobs={allJobs.length > 0 ? allJobs : mockJobs} />
        </div>

        {/* Job Listings Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Main Matches Column */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black uppercase tracking-[0.4em] italic">Recommended Nodes</h3>
              <span className="text-[10px] text-brand-blue font-black uppercase tracking-[0.2em] cursor-pointer hover:underline">View Local Grid</span>
            </div>

            {matches.length > 0 ? (
              matches.map((match: any) => {
                const job = allJobs.find(j => j.id === match.jobId);
                if (!job) return null;
                return (
                  <motion.div 
                    key={job.id} 
                    whileHover={{ y: -4, x: 2 }}
                    className="glass p-8 rounded-[2rem] flex flex-col gap-6 hover:border-brand-blue/40 transition-all duration-500 group/card relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-blue/5 rounded-bl-[3rem] -z-10" />
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-xl font-black text-white italic uppercase tracking-tighter group-hover/card:text-brand-blue transition-colors line-clamp-1">{job.title}</h4>
                        <p className="text-[10px] text-text-muted font-bold tracking-[0.1em] mt-1">{job.company}</p>
                      </div>
                      <div className="bg-brand-blue/10 text-brand-blue text-[9px] px-3 py-1 rounded-lg border border-brand-blue/20 font-black uppercase tracking-widest">{match.matchScore}% Match</div>
                    </div>
                    
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                      <p className="text-[11px] text-white/70 italic leading-relaxed">"{match.matchingReason}"</p>
                    </div>

                    <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-text-muted">
                      <span className="flex items-center gap-2 text-brand-blue font-mono font-bold">{job.salary}</span>
                      <span className="flex items-center gap-2"><MapIcon size={14} /> {job.location.split(',')[0]}</span>
                    </div>

                    <button 
                      onClick={() => handleApply(job, match)}
                      className="w-full py-4 glass rounded-xl text-[10px] font-black uppercase tracking-[0.25em] text-brand-blue hover:bg-brand-blue hover:text-white border-brand-blue/30 transition-all shadow-lg active:scale-95"
                    >
                      Initialize Application
                    </button>
                  </motion.div>
                );
              })
            ) : (
                mockJobs.map((job) => (
                  <div key={job.id} className="glass p-8 rounded-[2rem] flex flex-col gap-4 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                    <div className="flex justify-between items-start">
                      <h4 className="text-lg font-black uppercase tracking-tight italic">{job.title}</h4>
                      <div className="bg-white/5 border border-white/10 px-2 py-1 rounded text-[8px] font-black uppercase font-mono">Historical Node</div>
                    </div>
                    <p className="text-[10px] text-text-muted font-bold italic">{job.company} · {job.location}</p>
                    <div className="mt-4 p-4 rounded-xl bg-white/[0.02] text-[10px] text-white/40 italic">Calibration required to unlock direct neural matching for this node.</div>
                  </div>
                ))
            )}
          </div>

          {/* Apprenticeships / NAPS Column */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black uppercase tracking-[0.4em] italic">Industrial NAPS</h3>
              <span className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em]">Filter Clusters</span>
            </div>
            
            <div className="glass p-8 rounded-[2rem] flex flex-col gap-6 border-l-4 border-brand-blue relative overflow-hidden group/naps">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-bl-full -z-10 group-hover/naps:bg-brand-blue/10 transition-all" />
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-black text-white italic uppercase tracking-tighter line-clamp-1">ITI Apprentice (Welder)</h4>
                  <p className="text-[10px] text-text-muted font-bold tracking-[0.1em] mt-1">Govt. Rail Workshop (NAPS)</p>
                </div>
                <div className="bg-white/10 glass px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white border-white/10">NAPS PRO</div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <span className="text-[9px] px-3 py-1 rounded-full bg-black/40 border border-white/5 text-text-muted font-bold uppercase tracking-widest">12 Months</span>
                <span className="text-[9px] px-3 py-1 rounded-full bg-black/40 border border-white/5 text-text-muted font-bold uppercase tracking-widest">Certification</span>
                <span className="text-[9px] px-3 py-1 rounded-full bg-black/40 border border-white/5 text-text-muted font-bold uppercase tracking-widest">Govt. Payout</span>
              </div>

              <div className="mt-2 p-6 accent-gradient/5 rounded-2xl border border-brand-blue/20 bg-brand-blue/5">
                <p className="text-[10px] text-brand-blue font-black uppercase tracking-[0.3em] mb-2 scale-90 origin-left">Monthly Stipend</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-black text-white italic tracking-tighter">₹ 12,500 <span className="text-xs text-text-muted font-bold not-italic font-mono">+ Lodging</span></p>
                  <ChevronRight size={24} className="text-brand-blue group-hover/naps:translate-x-2 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const Info = ({ size, className }: { size: number, className?: string }) => <div className={className}><Sparkles size={size} /></div>;
