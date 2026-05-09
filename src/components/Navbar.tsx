import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  MessageSquare, 
  LayoutDashboard, 
  GraduationCap, 
  LogIn, 
  LogOut,
  HelpCircle,
  Users,
  UserRound
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuthState } from 'react-firebase-hooks/auth';

const navItems = [
  { label: 'Sahay AI', path: '/chat', icon: MessageSquare },
  { label: 'Sahay Hub', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Matches', path: '/apprenticeships', icon: Briefcase },
  { label: 'Contractor', path: '/contractor', icon: Users },
];

export default function Navbar() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="fixed left-0 top-0 h-screen w-20 glass border-r flex flex-col items-center py-8 z-50 hidden md:flex">
        <div className="mb-12">
          <div className="w-10 h-10 accent-gradient rounded-xl flex items-center justify-center glow rotate-3">
            <span className="font-bold text-white text-lg">S</span>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col gap-6">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                cn(
                  "p-3.5 rounded-xl transition-all duration-500 relative group",
                  isActive ? "text-brand-blue bg-brand-blue/10 glow" : "text-text-muted hover:text-white"
                )
              }
            >
              <item.icon size={22} className={cn("transition-transform duration-500", "group-hover:scale-110")} />
              <div className="absolute left-full ml-4 px-3 py-1.5 glass rounded-lg text-[10px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-50">
                {item.label}
              </div>
            </NavLink>
          ))}
        </div>

        <div className="mt-auto flex flex-col items-center gap-6">
          {user ? (
            <>
              <button
                onClick={() => navigate('/profile')}
                className="w-12 h-12 rounded-full border-2 border-brand-blue p-0.5 overflow-hidden group transition-all hover:scale-110"
                title="Profile"
              >
                <div className="w-full h-full rounded-full bg-bg-card flex items-center justify-center text-xs font-bold overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-white uppercase">{user.email?.charAt(0) || 'U'}</span>
                  )}
                </div>
              </button>
              <button
                onClick={handleSignOut}
                className="p-3 text-text-muted hover:text-red-500 transition-colors"
                title="Sign out"
              >
                <LogOut size={22} />
              </button>
            </>
          ) : (
            <NavLink
              to="/auth"
              className="p-3 text-text-muted hover:text-brand-blue transition-colors"
              title="Sign in"
            >
              <LogIn size={24} />
            </NavLink>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Bar */}
      <nav className="fixed bottom-0 left-0 w-full bg-bg-card/80 backdrop-blur-2xl border-t border-white/5 flex md:hidden justify-around items-center h-20 px-6 z-50 rounded-t-[2.5rem] shadow-2xl shadow-black">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              cn(
                "flex flex-col items-center gap-2 min-w-[70px] transition-all duration-500",
                isActive ? "text-brand-blue translate-y-[-4px]" : "text-text-muted"
              )
            }
          >
            <item.icon size={22} />
            <span className="text-[8px] uppercase font-black tracking-[0.2em]">{item.label}</span>
          </NavLink>
        ))}
        {user ? (
          <>
            <button
              onClick={() => navigate('/profile')}
              className="flex flex-col items-center gap-2 min-w-[70px] text-text-muted hover:text-brand-blue transition-all"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="h-6 w-6 rounded-lg object-cover" />
              ) : (
                <UserRound size={22} />
              )}
              <span className="text-[8px] uppercase font-black tracking-[0.2em]">Profile</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex flex-col items-center gap-2 min-w-[70px] text-text-muted hover:text-red-500 transition-all"
            >
              <LogOut size={22} />
              <span className="text-[8px] uppercase font-black tracking-[0.2em]">Logout</span>
            </button>
          </>
        ) : (
          <NavLink
            to="/auth"
            className="flex flex-col items-center gap-2 min-w-[70px] text-text-muted hover:text-brand-blue transition-all"
          >
            <LogIn size={22} />
            <span className="text-[8px] uppercase font-black tracking-[0.2em]">Login</span>
          </NavLink>
        )}
      </nav>
    </>
  );
}
