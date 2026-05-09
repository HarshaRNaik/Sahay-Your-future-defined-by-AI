import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { 
  GoogleAuthProvider, 
  GithubAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  LogIn, 
  AlertCircle, 
  ShieldCheck, 
  Github, 
  Mail, 
  Phone, 
  ArrowLeft,
  ChevronRight,
  Eye,
  EyeOff,
  UserPlus
} from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';

type AuthMode = 'CHOICE' | 'EMAIL_LOGIN' | 'EMAIL_SIGNUP' | 'PHONE' | 'FORGOT_PASSWORD';

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('CHOICE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    setError(null);
  }, [mode]);

  const syncUserToFirestore = async (user: any, provider: string) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || displayName || 'Anonymous Worker',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        photoURL: user.photoURL || '',
        provider: provider,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        skills: [],
        experience: '',
        jobType: '',
        summary: '',
      });
    } else {
      await updateDoc(userRef, {
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
    }
  };

  const handleSocialSignIn = async (type: 'google' | 'github') => {
    setLoading(true);
    setError(null);
    try {
      const provider = type === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider();
      if (type === 'google') (provider as GoogleAuthProvider).setCustomParameters({ prompt: 'select_account' });
      
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, provider);
      await syncUserToFirestore(result.user, type);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || `${type} sign-in failed.`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'EMAIL_LOGIN') {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await syncUserToFirestore(result.user, 'email');
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await syncUserToFirestore(result.user, 'email');
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset link sent to your email.');
      setMode('EMAIL_LOGIN');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if ((window as any).recaptchaVerifier) return;
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {}
    });
  };

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(result);
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message);
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setLoading(true);
    setError(null);
    try {
      const result = await confirmationResult.confirm(otp);
      await syncUserToFirestore(result.user, 'phone');
      navigate('/dashboard');
    } catch (err: any) {
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#0a0c10] relative overflow-hidden font-outfit">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 -left-1/4 w-full h-full bg-brand-blue/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 -right-1/4 w-full h-full bg-purple-500/10 blur-[120px] animate-pulse delay-1000" />
      </div>

      <div id="recaptcha-container" />

      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full relative z-10"
      >
        <div className="glass-card p-10 md:p-14 border-white/5 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
          <div className="text-center mb-12">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-brand-blue rounded-[2rem] shadow-2xl shadow-brand-blue/20 rotate-3 border border-brand-blue/30 mb-8"
            >
              <span className="font-black text-white text-4xl">S</span>
            </motion.div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase italic leading-none">SAHAY</h1>
            <p className="text-brand-blue text-[10px] font-black uppercase tracking-[0.4em] mb-4">
              Your future, defined by AI.
            </p>
            <p className="text-text-muted text-[11px] font-medium leading-relaxed max-w-xs mx-auto">
              Find jobs, apprenticeships, and build your professional identity using AI.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'CHOICE' && (
              <motion.div 
                key="choice"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <button
                  onClick={() => handleSocialSignIn('google')}
                  disabled={loading}
                  className="w-full bg-white text-black rounded-2xl py-5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-gray-100 transition-all active:scale-[0.98]"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                  Continue with Google
                </button>
                <button
                  onClick={() => handleSocialSignIn('github')}
                  disabled={loading}
                  className="w-full bg-[#24292e] text-white rounded-2xl py-5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-[#2f363d] transition-all active:scale-[0.98] border border-white/5"
                >
                  <Github size={20} />
                  Continue with GitHub
                </button>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setMode('PHONE')}
                    className="bg-white/5 border border-white/10 text-white rounded-2xl py-5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
                  >
                    <Phone size={18} />
                    Phone
                  </button>
                  <button
                    onClick={() => setMode('EMAIL_LOGIN')}
                    className="bg-white/5 border border-white/10 text-white rounded-2xl py-5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
                  >
                    <Mail size={18} />
                    Email
                  </button>
                </div>
              </motion.div>
            )}

            {(mode === 'EMAIL_LOGIN' || mode === 'EMAIL_SIGNUP') && (
              <motion.form 
                key="email"
                onSubmit={handleEmailAuth}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <button 
                  type="button"
                  onClick={() => setMode('CHOICE')}
                  className="text-text-muted hover:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-6"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-4">
                  {mode === 'EMAIL_LOGIN' ? 'Welcome Back' : 'Join the Network'}
                </h3>

                {mode === 'EMAIL_SIGNUP' && (
                  <div className="space-y-2">
                    <label className="text-[10px] text-brand-blue uppercase font-black tracking-widest ml-1">Legal Name</label>
                    <input 
                      required
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-brand-blue/50 text-sm"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] text-brand-blue uppercase font-black tracking-widest ml-1">Email Address</label>
                  <input 
                    required
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-brand-blue/50 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] text-brand-blue uppercase font-black tracking-widest">Password</label>
                    {mode === 'EMAIL_LOGIN' && (
                      <button 
                        type="button" 
                        onClick={() => setMode('FORGOT_PASSWORD')}
                        className="text-[9px] text-text-muted hover:text-white uppercase font-black"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input 
                      required
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-brand-blue/50 text-sm"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  disabled={loading}
                  className="w-full py-5 bg-brand-blue text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-brand-blue/90 transition-all shadow-xl shadow-brand-blue/20 flex items-center justify-center gap-3 mt-4"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" />
                  ) : (
                    mode === 'EMAIL_LOGIN' ? <LogIn size={18} /> : <UserPlus size={18} />
                  )}
                  {mode === 'EMAIL_LOGIN' ? 'Initialize Login' : 'Create Protocol Account'}
                </button>

                <div className="text-center mt-6">
                  <button 
                    type="button"
                    onClick={() => setMode(mode === 'EMAIL_LOGIN' ? 'EMAIL_SIGNUP' : 'EMAIL_LOGIN')}
                    className="text-[10px] text-text-muted font-black uppercase tracking-widest hover:text-white"
                  >
                    {mode === 'EMAIL_LOGIN' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                  </button>
                </div>
              </motion.form>
            )}

            {mode === 'PHONE' && (
              <motion.div 
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <button 
                  onClick={() => setMode('CHOICE')}
                  className="text-text-muted hover:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-6"
                >
                  <ArrowLeft size={14} /> Back
                </button>

                {!otpSent ? (
                  <form onSubmit={handlePhoneSignIn} className="space-y-4">
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2">Phone Authentication</h3>
                    <p className="text-[11px] text-text-muted mb-6">Enter your mobile number with country code (e.g. +91)</p>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] text-brand-blue uppercase font-black tracking-widest ml-1">Mobile Number</label>
                        <input 
                          required
                          type="tel"
                          placeholder="+91 9876543210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-brand-blue/50 text-sm"
                        />
                    </div>
                    
                    <button
                      disabled={loading}
                      className="w-full py-5 bg-brand-blue text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-brand-blue/90 transition-all shadow-xl shadow-brand-blue/20 flex items-center justify-center gap-3"
                    >
                      {loading ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" /> : <ChevronRight size={18} />}
                      Send OTP Code
                    </button>
                  </form>
                ) : (
                  <form onSubmit={verifyOtp} className="space-y-6">
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2">Verify Protocol</h3>
                    <p className="text-[11px] text-text-muted mb-6 tracking-wide">Enter the 6-digit code sent to <span className="text-white font-black">{phone}</span></p>
                    
                    <div className="flex justify-center gap-3">
                         <input 
                            required
                            type="text"
                            maxLength={6}
                            placeholder="000000"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-6 text-2xl text-center text-white outline-none focus:border-brand-blue/50 font-black tracking-[0.5em]"
                          />
                    </div>

                    <button
                      disabled={loading}
                      className="w-full py-5 bg-green-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-green-600 transition-all shadow-xl shadow-green-500/20 flex items-center justify-center gap-3"
                    >
                      {loading ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" /> : <ShieldCheck size={18} />}
                      Verify & Continue
                    </button>

                    <button 
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="w-full text-[10px] text-text-muted font-black uppercase tracking-widest hover:text-white"
                    >
                      Wrong number? Edit
                    </button>
                  </form>
                )}
              </motion.div>
            )}

            {mode === 'FORGOT_PASSWORD' && (
              <motion.form 
                key="forgot"
                onSubmit={handlePasswordReset}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                 <button 
                  type="button"
                  onClick={() => setMode('EMAIL_LOGIN')}
                  className="text-text-muted hover:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-6"
                >
                  <ArrowLeft size={14} /> Back to Login
                </button>

                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2">Reset Identity</h3>
                <p className="text-[11px] text-text-muted mb-6">Enter your registered email to receive a recovery link.</p>

                <div className="space-y-2">
                  <label className="text-[10px] text-brand-blue uppercase font-black tracking-widest ml-1">Email Address</label>
                  <input 
                    required
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-brand-blue/50 text-sm"
                  />
                </div>

                <button
                  disabled={loading}
                  className="w-full py-5 bg-brand-blue text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-brand-blue/90 transition-all shadow-xl shadow-brand-blue/20"
                >
                   Send Recovery Link
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-4 text-left"
            >
              <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
              <p className="text-red-500 text-[10px] uppercase font-black tracking-widest leading-tight">
                {error}
              </p>
            </motion.div>
          )}

          <div className="mt-12 pt-10 border-t border-white/5 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] text-brand-blue font-black tracking-[0.2em] uppercase">
              <ShieldCheck size={14} />
              Secured by Sahay Protocol
            </div>
            <p className="text-[10px] text-text-muted tracking-[0.2em] uppercase font-black leading-relaxed opacity-40 text-center">
              By connecting, you agree to the<br />
              <span className="text-white underline cursor-pointer hover:text-brand-blue transition-colors">Worker Data Privacy Standard</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
