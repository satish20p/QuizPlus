import React, { useState } from 'react';
import { User, Quiz, SessionReport, AuditLog } from '../../types/quiz';
import { storageService } from '../../services/storage';
import { 
  Users, 
  GraduationCap, 
  HelpCircle, 
  Activity, 
  UserPlus, 
  ShieldAlert, 
  CheckCircle2, 
  Ban, 
  Trash2, 
  Search, 
  FileSpreadsheet, 
  Eye, 
  Clock, 
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  Database,
  Download,
  Upload,
  RotateCcw
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  users: User[];
  onUsersUpdate: (users: User[]) => void;
  quizzes: Quiz[];
  onQuizzesUpdate: (quizzes: Quiz[]) => void;
  reports: SessionReport[];
  auditLogs: AuditLog[];
  onViewReport: (report: SessionReport) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  users,
  onUsersUpdate,
  quizzes,
  onQuizzesUpdate,
  reports,
  auditLogs,
  onViewReport
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'quizzes' | 'reports' | 'audit'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'coadmin' | 'trainer' | 'learner'>('all');
  
  // New User Form Modal
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'coadmin' | 'trainer' | 'learner'>('trainer');

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredQuizzes = quizzes.filter(q => 
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    q.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      status: 'active',
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 10000)}?auto=format&fit=crop&w=150&q=80`,
      createdAt: new Date().toISOString()
    };

    const updated = storageService.addUser(newUser);
    onUsersUpdate(updated);
    setIsAddingUser(false);
    setNewUserName('');
    setNewUserEmail('');
  };

  const handleToggleStatus = (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const updated = storageService.updateUserStatus(userId, nextStatus, currentUser);
    onUsersUpdate(updated);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to permanently delete this user account?')) {
      const updated = storageService.deleteUser(userId, currentUser);
      onUsersUpdate(updated);
    }
  };

  const handleDeleteQuiz = (quizId: string) => {
    if (confirm('Admin Content Moderation: Are you sure you want to remove this quiz from the system?')) {
      const updated = storageService.deleteQuiz(quizId, currentUser);
      onQuizzesUpdate(updated);
    }
  };

  const handleExportDatabase = () => {
    storageService.exportDatabase();
  };

  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const success = storageService.importDatabase(json);
        if (success) {
          alert('Database successfully restored from backup! Refreshing data...');
          onUsersUpdate(storageService.getUsers());
          onQuizzesUpdate(storageService.getQuizzes());
        } else {
          alert('Invalid database backup file.');
        }
      } catch {
        alert('Failed to parse database JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDatabase = () => {
    if (confirm('Are you sure you want to reset the built-in database to default initial state? All custom edits will be reverted.')) {
      storageService.resetDatabaseToDefault();
      onUsersUpdate(storageService.getUsers());
      onQuizzesUpdate(storageService.getQuizzes());
      alert('Database restored to factory defaults.');
    }
  };

  const totalAdmins = users.filter(u => u.role === 'admin').length;
  const totalCoadmins = users.filter(u => u.role === 'coadmin').length;
  const totalTrainers = users.filter(u => u.role === 'trainer').length;
  const totalLearners = users.filter(u => u.role === 'learner').length;
  const activeSessionsCount = Object.keys(storageService.getActiveSessions()).length;

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold mb-3">
            <ShieldAlert className="w-3.5 h-3.5" />
            Platform Administration Control Panel
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">System Overview & Management</h1>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            Monitor active sessions, control user accounts, audit generated quizzes, and moderate live platform performance.
          </p>
        </div>
      </div>

      {/* KPI Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Accounts</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{users.length}</p>
            <p className="text-xs text-indigo-600 font-medium mt-1">
              {totalAdmins} Admin • {totalCoadmins} Coadmin • {totalTrainers} Trainer • {totalLearners} Learner
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Created Quizzes</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{quizzes.length}</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">Available for hosting</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Active Sessions</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{activeSessionsCount}</p>
            <p className="text-xs text-slate-500 mt-1">Real-time room channels</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 animate-pulse">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Reports</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{reports.length}</p>
            <p className="text-xs text-amber-600 font-medium mt-1">Audited performance logs</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            User Management ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('quizzes')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'quizzes'
                ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Quiz Moderation ({quizzes.length})
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Session Reports ({reports.length})
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            System Audit Log
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportDatabase}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="Export full built-in database to JSON file"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            Export DB Backup
          </button>

          <label
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="Restore database from JSON file"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            Import DB Restore
            <input type="file" accept=".json" onChange={handleImportDatabase} className="hidden" />
          </label>

          <button
            type="button"
            onClick={handleResetDatabase}
            className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="Reset database to default initial state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            Reset Factory DB
          </button>

          {activeTab === 'users' && (
            <button
              onClick={() => setIsAddingUser(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md flex items-center gap-2 transition cursor-pointer ml-auto"
            >
              <UserPlus className="w-4 h-4" />
              Create User Account
            </button>
          )}
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, email, title, or author..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-300 text-slate-900 pl-11 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 placeholder:text-slate-400 shadow-sm"
        />
      </div>

      {/* TAB 1: USER MANAGEMENT TABLE */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Filter Role:</span>
              <select
                value={roleFilter}
                onChange={(e: any) => setRoleFilter(e.target.value)}
                className="bg-white border border-slate-300 text-xs text-slate-800 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins Only</option>
                <option value="coadmin">Coadmins Only</option>
                <option value="trainer">Trainers Only</option>
                <option value="learner">Learners Only</option>
              </select>
            </div>
            <span className="text-xs text-slate-500 font-medium">Showing {filteredUsers.length} accounts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Joined Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover border border-slate-300" />
                      <div>
                        <p className="font-bold text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                        u.role === 'admin' 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : u.role === 'coadmin'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : u.role === 'trainer'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {u.role === 'admin' ? (
                          <ShieldAlert className="w-3 h-3" />
                        ) : u.role === 'coadmin' ? (
                          <ShieldAlert className="w-3 h-3 text-purple-600" />
                        ) : u.role === 'trainer' ? (
                          <GraduationCap className="w-3 h-3" />
                        ) : (
                          <Users className="w-3 h-3" />
                        )}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        u.status === 'active' 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-600' : 'bg-red-600'}`}></span>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.id !== currentUser.id && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(u.id, u.status)}
                              className={`p-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                                u.status === 'active'
                                  ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              }`}
                              title={u.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                            >
                              {u.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition cursor-pointer"
                              title="Delete Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: QUIZ MODERATION TABLE */}
      {activeTab === 'quizzes' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Quiz Details</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Author</th>
                  <th className="px-6 py-3.5">Questions</th>
                  <th className="px-6 py-3.5">Times Hosted</th>
                  <th className="px-6 py-3.5 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredQuizzes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 text-base">{q.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{q.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-semibold">
                        {q.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-indigo-700">
                      {q.authorName}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-800">
                      {q.questions.length} MCQs
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                      {q.timesHosted || 0} sessions
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteQuiz(q.id)}
                        className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REPORTS AUDIT */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((rep) => (
            <div key={rep.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    PIN: {rep.sessionPin}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-lg mt-1">{rep.quizTitle}</h3>
                  <p className="text-xs text-slate-500">Host: {rep.trainerName} • {new Date(rep.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-600">{rep.averageAccuracy}%</span>
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Avg Accuracy</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <p className="text-slate-500 font-medium">Participants:</p>
                  <p className="font-bold text-slate-900">{rep.totalParticipants} Learners</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Avg Score:</p>
                  <p className="font-bold text-amber-600">{rep.averageScore} pts</p>
                </div>
              </div>

              <button
                onClick={() => onViewReport(rep)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 rounded-xl text-xs font-bold border border-slate-300 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Eye className="w-4 h-4 text-indigo-600" />
                Audit Full Grade Report
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            System Action Audit Log
          </h3>
          <div className="space-y-3 font-mono text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-bold text-indigo-700">{log.action}</span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-800 font-medium mt-1">{log.details}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">By: {log.userName} ({log.userRole}) • IP: {log.ipAddress || '127.0.0.1'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {isAddingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              Create New User Account
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Santos"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. maria@corp.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assign User Role *</label>
                <select
                  value={newUserRole}
                  onChange={(e: any) => setNewUserRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
                >
                  <option value="admin">Admin (System Administrator)</option>
                  <option value="coadmin">Coadmin (Co-Administrator & Management)</option>
                  <option value="trainer">Trainer (Quiz Author & Host)</option>
                  <option value="learner">Learner (Participant)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer shadow-md"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
