import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  ArrowRight, 
  Mic, 
  FileText, 
  Sparkles,
  Zap,
  Globe,
  Languages
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function LandingPage() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden bg-bg-main font-outfit">
      <div className="glow-bg left-1/2 -translate-x-1/2 -top-40 opacity-30" />
      
      {/* Hero Section */}
      <section className="px-6 pt-32 pb-24 max-w-7xl mx-auto text-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-white/10 glass text-[10px] uppercase font-bold text-brand-blue mb-12 glow tracking-widest"
        >
          <div className="w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
          Sahay — AI Deployment Protocol v3.1
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", damping: 20 }}
          className="text-6xl font-black tracking-tighter text-white sm:text-8xl lg:text-[7.5rem] mb-10 leading-[0.85] uppercase italic font-outfit"
        >
          Your Future,<br />
          <span className="text-brand-blue">Defined by AI.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-text-muted text-xl max-w-2xl mx-auto mb-16 font-medium leading-relaxed"
        >
          Describe your work in Hindi, Kannada, or English. Sahay helps you find jobs, apprenticeships, and build your professional profile — for free.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <button 
            onClick={() => navigate(user ? '/chat' : '/auth')}
            className="btn-primary flex items-center gap-4 w-full sm:w-auto text-sm group"
          >
            Start AI Session <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={() => navigate('/apprenticeships')}
            className="px-10 py-5 rounded-2xl border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5 transition-all w-full sm:w-auto backdrop-blur-xl"
          >
            Explore Vacancies
          </button>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="px-6 py-24 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
        {[
          {
            title: "Voice Intelligence",
            desc: "Speak naturally in your native dialect. AI extracts your trade skills instantly without manual typing.",
            icon: Mic,
            color: "text-brand-blue"
          },
          {
            title: "Resume Automation",
            desc: "Turn voice chats into professional Markdown resumes that highlight your vocational alignment.",
            icon: FileText,
            color: "text-purple-500"
          },
          {
            title: "Agentic Matching",
            desc: "Proprietary scoring connects you directly with verified MSMEs and NAPS industrial clusters.",
            icon: Briefcase,
            color: "text-green-500"
          }
        ].map((feature, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-12 group hover:scale-[1.02] transition-all duration-500 hover:border-brand-blue/30"
          >
            <div className={`w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center mb-10 border border-white/10 ${feature.color} group-hover:scale-110 transition-transform duration-500`}>
              <feature.icon size={32} />
            </div>
            <h3 className="text-2xl font-black text-white mb-5 uppercase italic tracking-tight">{feature.title}</h3>
            <p className="text-text-muted text-sm leading-relaxed font-medium">{feature.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Partner Logos */}
      <section className="px-6 py-32 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center items-center gap-16 lg:gap-24 opacity-20 grayscale hover:grayscale-0 transition-all duration-700">
          {['NAPS', 'MSME', 'NSDC', 'Skill India', 'ITI India'].map((logo, i) => (
            <div key={i} className="text-3xl lg:text-4xl font-black font-mono tracking-tighter text-white uppercase italic select-none">
              {logo}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-16 text-center text-text-muted text-[10px] uppercase font-black tracking-[0.4em] opacity-40">
        &copy; 2026 SAHAY SYSTEM · BUILT FOR THE INDIAN WORKFORCE
      </footer>
    </div>
  );
}
