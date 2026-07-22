import React, { useState } from 'react';
import { User } from '../../types/quiz';
import { GraduationCap, Lock, Mail, ShieldCheck, ArrowRight, KeyRound, AlertCircle } from 'lucide-react';

interface TrainerLoginProps {
  allUsers: User[];
  onLoginSuccess: (user: User) => void;
  onCancelToLearner: () => void;
}

export const TrainerLogin: React.FC<TrainerLoginProps> = ({
  allUsers,
  onLoginSuccess,
  onCancelToLearner,
}) => {
  const trainers = allUsers.filter(u => u.role === 'trainer' || u.role === 'admin');
  const [selectedUser, setSelectedUser] = useState<User>(trainers[0] || allUsers[0]);
  const [email, setEmail] = useState(trainers[0]?.email || 'trainer@quizpulse.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setEmail(user.email);
    setPassword('password123'); // auto-fill demo password for quick testing
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Password is required to log in as Trainer.');
      return;
    }

    // Verify password (demo check: minimum 4 chars)
    if (password.length < 4) {
      setError('Invalid password. Please enter a valid password.');
      return;
    }

    onLoginSuccess(selectedUser);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white text-center relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center shadow-inner mb-3">
            <GraduationCap className="w-7 h-7 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Trainer Authentication</h2>
          <p className="text-xs text-indigo-200 mt-1">
            Mandatory trainer login required to access authoring suite & launch live sessions.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          
          {/* Preset Trainer Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Select Authorized Trainer Profile:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {trainers.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleUserSelect(t)}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                    selectedUser.id === t.id
                      ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 text-indigo-950 font-bold'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-full object-cover border border-slate-300" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{t.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium truncate">{t.email}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase">
                    {t.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-100">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Trainer Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
                  placeholder="trainer@quizpulse.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
                  placeholder="••••••••"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-amber-500" />
                Demo password auto-filled or enter <code className="font-bold text-slate-700">password123</code>
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Authenticate & Enter Trainer Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Learner Jump button */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onCancelToLearner}
              className="text-xs font-bold text-slate-600 hover:text-indigo-600 transition cursor-pointer underline"
            >
              Are you a Learner? Join Live Quiz without login →
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
