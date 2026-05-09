import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Sparkles, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { authFetch } from '../services/backendApi';

const SUGGESTED_SKILLS = [
  "TIG Welding", "ARC Welding", "MIG Welding", "CNC Programming", "Lathe Operation",
  "Electrical Maintenance", "Plumbing", "HVAC Repair", "Forklift Driving", "Inventory Management",
  "Blueprint Reading", "Site Supervision", "Masonry", "Carpentry", "Electronic Assembly",
  "Automotive Repair", "Quality Inspection", "Hydraulic Systems", "Pneumatic Systems", "Scaffolding"
];

interface SkillManagerProps {
  initialSkills: string[];
  onUpdate: (newSkills: string[]) => void;
}

export default function SkillManager({ initialSkills, onUpdate }: SkillManagerProps) {
  const [skills, setSkills] = useState<string[]>(initialSkills || []);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (input.trim()) {
      const filtered = SUGGESTED_SKILLS.filter(s => 
        s.toLowerCase().includes(input.toLowerCase()) && !skills.includes(s)
      ).slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
    if (error) setError(null);
  }, [input, skills]);

  const saveSkills = async (newSkills: string[]) => {
    setUpdating(true);
    try {
      await authFetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: newSkills })
      });
      onUpdate(newSkills);
    } catch (err) {
      console.error("Failed to update skills", err);
    } finally {
      setUpdating(false);
    }
  };

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    
    if (trimmed === "") {
      setError("Please enter a valid skill");
      setTimeout(() => setError(null), 2000);
      return;
    }

    if (skills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setError("Skill already indexed in profile");
      setTimeout(() => setError(null), 2000);
      return;
    }

    const updated = [...skills, trimmed];
    setSkills(updated);
    saveSkills(updated);
    setInput("");
    setSuggestions([]);
    setError(null);
  };

  const removeSkill = (skillToRemove: string) => {
    const updated = skills.filter(s => s !== skillToRemove);
    setSkills(updated);
    saveSkills(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {skills.map((skill) => (
            <motion.div
              key={skill}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-blue/10 border border-brand-blue/30 rounded-xl text-brand-blue text-[10px] font-black uppercase tracking-wider group hover:bg-brand-blue/20 transition-all cursor-default"
            >
              {skill}
              <button 
                onClick={() => removeSkill(skill)}
                className="p-0.5 hover:bg-brand-blue/20 rounded-full transition-colors"
              >
                <X size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {skills.length === 0 && !isFocused && (
          <p className="text-xs text-text-muted italic opacity-50">No technical skills indexed yet...</p>
        )}
      </div>

      <div className="relative">
        <div className={cn(
          "flex items-center gap-3 px-6 py-4 bg-black/40 border transition-all rounded-[1.8rem]",
          error ? "border-red-500/50 ring-1 ring-red-500/20" : isFocused ? "border-brand-blue/50 ring-1 ring-brand-blue/20" : "border-white/5"
        )}>
          <Search size={16} className={cn("transition-colors", error ? "text-red-500" : isFocused ? "text-brand-blue" : "text-text-muted")} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search or add a technical skill..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill(input);
              }
            }}
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-text-muted/50"
          />
          {updating && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Sparkles size={16} className="text-brand-blue" /></motion.div>}
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute left-6 mt-2 text-[10px] font-black uppercase tracking-wider text-red-500 italic"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isFocused && suggestions.length > 0 && !error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-3 p-3 bg-bg-main border border-white/10 rounded-[1.8rem] shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
            >
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted px-4 mb-3">Recommended for your trade</p>
              <div className="space-y-1">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => addSkill(s)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-brand-blue/10 text-white text-xs transition-all group text-left"
                  >
                    <span className="font-bold">{s}</span>
                    <Plus size={14} className="text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3 px-4 py-3 bg-brand-blue/5 border border-brand-blue/10 rounded-2xl">
         <Sparkles size={14} className="text-brand-blue flex-shrink-0" />
         <p className="text-[10px] text-text-muted leading-relaxed italic">
           <span className="text-brand-blue font-bold">AI Tip:</span> Adding more specific skills like "TIG Welding" instead of just "Welding" increases your match accuracy by up to 40%.
         </p>
      </div>
    </div>
  );
}
