import React, { useEffect, useState } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useLocation
} from 'react-router-dom';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import ApprenticeshipPage from './pages/ApprenticeshipPage';
import ContractorPage from './pages/ContractorPage';
import VerificationPage from './pages/VerificationPage';
import ProfilePage from './pages/ProfilePage';
import Navbar from './components/Navbar';
import { motion, AnimatePresence } from 'motion/react';

import { cn } from './lib/utils';

function AnimatedRoutes() {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Safety timeout: forced loading to false if it takes more than 5 seconds
    const timeout = setTimeout(() => {
      if (isMounted) {
        console.warn("Auth initialization timed out. Proceeding with default state.");
        setLoading(false);
        setAuthInitialized(true);
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!isMounted) return;
      
      clearTimeout(timeout);
      setUser(u);
      setLoading(false);
      setAuthInitialized(true);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  if (!authInitialized || loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-bg-main">
        <div className="flex flex-col items-center gap-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-blue shadow-2xl shadow-brand-blue/20"></div>
          <p className="text-brand-blue text-[10px] font-black uppercase tracking-[0.5em] animate-pulse italic">Initializing Sahay Network...</p>
        </div>
      </div>
    );
  }

  const isLanding = location.pathname === '/';
  const isAuth = location.pathname === '/auth';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg-main overflow-x-hidden selection:bg-brand-blue/30">
      {!isLanding && !isAuth && <Navbar />}
      <main className={cn(
        "flex-1 relative pb-12",
        !isLanding && !isAuth ? "md:pl-20" : ""
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full"
          >
            <Routes location={location}>
              <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
              <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <AuthPage />} />
              <Route path="/verify" element={user ? <VerificationPage /> : <Navigate to="/auth" />} />
              <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/auth" />} />
              <Route path="/chat" element={user ? <ChatPage /> : <Navigate to="/auth" />} />
              <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/auth" />} />
              <Route path="/apprenticeships" element={user ? <ApprenticeshipPage /> : <Navigate to="/auth" />} />
              <Route path="/contractor" element={user ? <ContractorPage /> : <Navigate to="/auth" />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      
      {!isLanding && !isAuth && (
        <footer className="h-12 border-t border-white/5 glass fixed bottom-0 left-0 w-full flex items-center justify-between px-8 text-[10px] text-text-muted mono z-50 hidden md:flex">
          <div className="flex gap-8 uppercase tracking-widest">
            <span className="flex items-center gap-2">
              Status: <span className="text-green-500 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />Online</span>
            </span>
            <span>Backend: <span className="text-white">Gemini 2.0 Flash</span></span>
            <span>Locale: <span className="text-white">HI-IN / EN-US</span></span>
          </div>
          <div className="flex items-center gap-4">
            <span>V3.0.12-Sahay-Core</span>
            <div className="w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}
