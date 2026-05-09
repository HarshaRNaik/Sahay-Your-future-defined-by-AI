import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Send, User as UserIcon, CheckCircle2, ChevronRight, Map as MapIcon, Zap, Languages, Info, FileText, Briefcase } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { processChatMessage, generateResume, getJobMatches } from '../services/geminiService';

interface Message {
  id: string;
  role: 'bot' | 'user';
  text: string;
}

const languageOptions = [
  { code: 'auto', label: 'Detect Language', speechLocale: 'en-IN' },
  { code: 'hi', label: 'Hindi / हिन्दी', speechLocale: 'hi-IN' },
  { code: 'kn', label: 'Kannada / ಕನ್ನಡ', speechLocale: 'kn-IN' },
  { code: 'ta', label: 'Tamil / தமிழ்', speechLocale: 'ta-IN' },
  { code: 'te', label: 'Telugu / తెలుగు', speechLocale: 'te-IN' },
  { code: 'en', label: 'English', speechLocale: 'en-IN' },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      text: "Namaste! I am your Sahay AI agent. Tell me about your work experience in your own words? (e.g. Masonry, Welding, ITI Electrician, Plumbing)"
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(() => localStorage.getItem('sahay-language') || 'auto');
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const activeLanguage = languageOptions.find((language) => language.code === selectedLanguage) || languageOptions[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const geminiHistory = messages.map(m => ({
        role: m.role === 'bot' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));
      const data = await processChatMessage(text, selectedLanguage, geminiHistory);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: data.text
      }]);

      if (data.action === 'UPDATE_PROFILE' && data.data) {
        setExtractedData(data.data);
        if (auth.currentUser) {
          // Billing Workaround: Mocked frontend database call
          // const userRef = doc(db, 'users', auth.currentUser.uid);
          // await setDoc(userRef, {
          //   jobType: data.data.trade,
          //   skills: data.data.skills,
          //   experience: data.data.experience,
          //   location_mention: data.data.location,
          //   updatedAt: serverTimestamp(),
          // }, { merge: true });
          console.log("Mock saved user profile:", data.data);
        }
      }

      if (data.action === 'REDIRECT_MATCHES') {
        setTimeout(() => navigate('/apprenticeships'), 2500);
      }

    } catch (err) {
      console.error('Chat Error:', err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'bot',
        text: "The line is fuzzy. Please try saying that again?"
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGenerateResume = async () => {
    if (!extractedData) return;
    setIsTyping(true);
    try {
      const markdown = await generateResume({
        skills: extractedData.skills,
        experience: extractedData.experience,
        jobType: extractedData.trade,
        location: extractedData.location
      });
      localStorage.setItem('sahay-resume', markdown); // Sync to Dashboard
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'bot',
        text: "Here is your professional resume draft:\n\n" + markdown
      }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFindJobs = async () => {
    if (!extractedData) return;
    setIsTyping(true);
    try {
      // Create a mock job description based on the extracted trade
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'bot',
        text: `Based on your experience in ${extractedData.trade}, here is a typical job description and requirements for roles in your area:\n\n**Role: Senior ${extractedData.trade}**\n\n**Requirements:**\n- Experience: ${extractedData.experience}\n- Key Skills: ${(extractedData.skills || []).join(', ')}\n- Location: ${extractedData.location}\n\n**Description:**\nWe are looking for an experienced ${extractedData.trade} to join our industrial workforce. You will be responsible for executing high-quality work according to safety standards. Immediate joining preferred.\n\n*Click "Review Profile" to see actual live job matches on your map!*`
      }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser node. Use Chrome or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = activeLanguage.speechLocale;
    recognition.interimResults = true;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      if (e.results[0].isFinal) {
        handleSend(transcript);
      }
    };

    recognition.start();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen max-w-5xl mx-auto px-4 py-8 font-outfit relative">
      <div className="glow-bg top-0 right-0 opacity-10" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-10 px-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue border border-brand-blue/20 rotate-3 shadow-xl">
            <Zap size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">SAHAY AI</h1>
            <p className="text-brand-blue text-[10px] uppercase tracking-[0.3em] font-black mt-1">Multi-Dialect Recruitment</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-white shadow-xl backdrop-blur-xl">
            <Languages size={14} className="text-brand-blue" />
            <select
              value={selectedLanguage}
              onChange={(e) => {
                setSelectedLanguage(e.target.value);
                localStorage.setItem('sahay-language', e.target.value);
              }}
              className="bg-transparent text-[10px] font-black uppercase tracking-[0.2em] outline-none"
            >
              {languageOptions.map((l) => (
                <option key={l.code} value={l.code} className="bg-bg-main text-white">
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mb-10 px-4 space-y-10 scrollbar-hide" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: m.role === 'bot' ? -20 : 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              className={cn(
                "flex gap-5 max-w-[85%]",
                m.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-14 h-14 rounded-[1.5rem] flex items-center justify-center shrink-0 border shadow-2xl",
                m.role === 'bot' ? "bg-bg-card border-white/5 rotate-3" : "bg-brand-blue text-white border-brand-blue/30 -rotate-3"
              )}>
                {m.role === 'bot' ? <Zap size={24} className="text-brand-blue" /> : <UserIcon size={24} />}
              </div>
              <div className={cn(
                "p-8 glass-card rounded-[2.5rem] shadow-2xl transition-all",
                m.role === 'bot' ? "bg-bg-card/80 backdrop-blur-3xl border-white/5" : "bg-brand-blue text-white border-transparent"
              )}>
                <p className="text-lg leading-relaxed font-bold tracking-tight italic whitespace-pre-wrap">{m.text}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-5">
            <div className="w-14 h-14 rounded-[1.5rem] bg-bg-card flex items-center justify-center shrink-0 border border-white/5 rotate-3 animate-pulse">
              <Zap size={24} className="text-brand-blue" />
            </div>
            <div className="p-6 glass-card rounded-[2rem] bg-bg-card/50 flex items-center gap-4 text-text-muted italic text-xs font-black uppercase tracking-widest">
              Sahay Agent Processing...
            </div>
          </motion.div>
        )}
      </div>

      {extractedData && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-3 mb-10 px-4"
        >
          <div className="px-6 py-3 rounded-2xl bg-brand-blue/10 border border-brand-blue/20 text-[10px] text-white uppercase tracking-[0.2em] font-black flex items-center gap-3 shadow-lg shadow-brand-blue/5">
            <CheckCircle2 size={16} className="text-brand-blue" />
            Extracted Trade: {extractedData.trade}
          </div>
          <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] text-white uppercase tracking-[0.2em] font-black flex items-center gap-3 shadow-lg">
            <MapIcon size={16} className="text-brand-blue" />
            Region: {extractedData.location_context || extractedData.location}
          </div>
          <div className="w-full flex gap-3 mt-4">
            <button 
              onClick={handleGenerateResume}
              className="flex-1 px-6 py-3 rounded-2xl bg-brand-blue/20 text-brand-blue border border-brand-blue/30 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl hover:bg-brand-blue/30 transition-all"
            >
              <FileText size={14} /> Build Resume
            </button>
            <button 
              onClick={handleFindJobs}
              className="flex-1 px-6 py-3 rounded-2xl bg-brand-blue/20 text-brand-blue border border-brand-blue/30 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl hover:bg-brand-blue/30 transition-all"
            >
              <Briefcase size={14} /> Job Description
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex-1 px-6 py-3 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl hover:bg-gray-100 transition-all"
            >
              Review Profile <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Input Module */}
      <div className="relative group p-6 glass-card border-white/10 bg-bg-card/50 rounded-[3.5rem] backdrop-blur-3xl shadow-2xl">
        <div className="flex flex-col items-center gap-10">
          <div className="w-full flex items-center gap-6">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? "Listening..." : "Tell AI about your work experience..."}
              className="flex-1 bg-white/5 rounded-3xl text-white text-lg py-7 px-10 outline-none border border-white/5 focus:border-brand-blue/40 transition-all font-bold placeholder:text-text-muted/40 shadow-inner"
            />
            <button 
              onClick={() => handleSend()}
              className="w-20 h-20 bg-white text-black rounded-3xl flex items-center justify-center hover:bg-gray-200 active:scale-[0.9] transition-all shadow-2xl"
            >
              <Send size={28} />
            </button>
          </div>
          
          <div className="flex flex-col items-center gap-5">
            <button 
              onClick={toggleVoice}
              className={cn(
                "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-700 shadow-2xl relative",
                isListening ? "bg-red-500 scale-110 shadow-red-500/50" : "bg-brand-blue shadow-brand-blue/50"
              )}
            >
              <div className={cn(
                "absolute inset-0 rounded-full bg-inherit opacity-30",
                isListening ? "animate-ping" : "animate-pulse"
              )} />
              <Mic size={56} className="text-white relative z-10" />
            </button>
            <div className="flex flex-col items-center">
              <p className="text-[11px] text-white uppercase tracking-[0.5em] font-black italic mb-1">
                {isListening ? "RECORDING VOCAL PROTOCOL" : "HOLD TO INITIALIZE VOICE"}
              </p>
              <div className="flex items-center gap-2 opacity-40">
                <Info size={10} className="text-brand-blue" />
                <span className="text-[8px] font-black uppercase tracking-widest text-text-muted">Dialect engine: {activeLanguage.label}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
