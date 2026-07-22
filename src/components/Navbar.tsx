import React, { useState } from 'react';
import { User, UserRole } from '../types/quiz';
import { 
  Radio, 
  ShieldCheck, 
  GraduationCap, 
  Smartphone, 
  Tv, 
  LogIn, 
  Sparkles,
  UserCheck
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  allUsers: User[];
  activeView: 'admin' | 'trainer' | 'learner' | 'presenter';
  onViewChange: (view: 'admin' | 'trainer' | 'learner' | 'presenter') => void;
  onJoinSession: (pin: string) => void;
  activeSessionPin?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onUserChange,
  allUsers,
  activeView,
  onViewChange,
  onJoinSession,
  activeSessionPin,
}) => {
  const [pinInput, setPinInput] = useState('');

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim()) {
      onJoinSession(pinInput.trim());
      onViewChange('learner');
      setPinInput('');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 text-slate-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  QuizPulse
                </span>
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block font-medium">Interactive Audience Engagement</p>
            </div>
          </div>

          {/* Quick PIN Join Bar */}
          <form onSubmit={handleQuickJoin} className="hidden md:flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
            <span className="text-xs text-slate-600 font-bold px-2.5">JOIN PIN:</span>
            <input
              type="text"
              placeholder="e.g. 829104"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="bg-white border border-slate-300 text-slate-900 px-3 py-1 rounded text-sm font-mono font-bold tracking-wider w-28 focus:outline-none focus:ring-1 focus:ring-indigo-600 uppercase placeholder:text-slate-400"
              maxLength={6}
            />
            <button
              type="submit"
              className="ml-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-semibold transition flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              Join
            </button>
          </form>

          {/* Role View Switcher Navigation */}
          <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => onViewChange('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeView === 'admin' 
                  ? 'bg-indigo-600 text-white shadow-sm font-bold' 
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
              }`}
              title="Admin Portal"
            >
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span className="hidden lg:inline">Admin</span>
            </button>

            <button
              onClick={() => onViewChange('trainer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeView === 'trainer' 
                  ? 'bg-indigo-600 text-white shadow-sm font-bold' 
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
              }`}
              title="Trainer Portal"
            >
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span className="hidden lg:inline">Trainer</span>
            </button>

            <button
              onClick={() => onViewChange('learner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer relative ${
                activeView === 'learner' 
                  ? 'bg-indigo-600 text-white shadow-sm font-bold' 
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
              }`}
              title="Learner Mobile Interface"
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span className="hidden lg:inline">Learner</span>
              {activeSessionPin && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute -top-0.5 -right-0.5"></span>
              )}
            </button>

            <button
              onClick={() => onViewChange('presenter')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeView === 'presenter' 
                  ? 'bg-indigo-600 text-white shadow-sm font-bold' 
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
              }`}
              title="Live Stage / Screen View"
            >
              <Tv className="w-4 h-4 text-purple-600" />
              <span className="hidden lg:inline">Live Stage</span>
            </button>
          </nav>

          {/* User Account Switcher */}
          <div className="flex items-center gap-2">
            <div className="relative group">
              <button className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 transition text-left cursor-pointer">
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover border border-slate-300"
                />
                <div className="hidden sm:block text-xs">
                  <p className="font-bold text-slate-900 leading-tight">{currentUser.name}</p>
                  <p className="text-[10px] text-indigo-700 font-semibold capitalize flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    {currentUser.role}
                  </p>
                </div>
              </button>

              {/* User Dropdown Selector */}
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-1 hidden group-hover:block z-50">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs text-slate-500 font-semibold">Switch Active Profile:</p>
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => onUserChange(u)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition cursor-pointer ${
                        u.id === currentUser.id 
                          ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200' 
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-semibold">{u.name}</p>
                        <p className="text-[10px] text-slate-500 capitalize">{u.role}</p>
                      </div>
                      {u.id === currentUser.id && <UserCheck className="w-4 h-4 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
