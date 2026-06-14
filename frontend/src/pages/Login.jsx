import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, ArrowRight, BookOpen, GraduationCap, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [activeTab, setActiveTab] = useState('student'); // 'student', 'instructor', or 'admin'
  const [email, setEmail] = useState('');
  const [matricNo, setMatricNo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const credentials = activeTab === 'student'
      ? { matricNumber: matricNo.trim(), password }
      : { email: email.trim(), password };

    const result = await login(credentials);
    setIsLoading(false);

    if (result.success) {
      if (result.user.role === 'student') {
        navigate('/student-dashboard');
      } else if (result.user.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/instructor-dashboard');
      }
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Background Ornaments - pointer-events-none added to prevent blocking clicks */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 pointer-events-none animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 pointer-events-none animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 pointer-events-none animate-blob animation-delay-4000"></div>

      {/* Main Card - changed max-w-md to max-w-sm for a more compact design */}
      <div className="w-full max-w-sm z-10 animate-fade-in">
        <div className="glass-panel p-6 rounded-3xl shadow-xl relative">
          
          {/* Logo Section - centered & circular */}
          <div className="flex flex-col items-center mb-6">
            <div className="bg-white dark:bg-slate-800 p-1 rounded-full shadow-md border border-slate-200 dark:border-slate-700 mb-3">
              <img 
                src="/gvu_logo.png" 
                alt="GVU Logo" 
                className="w-16 h-16 rounded-full object-cover"
              />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-950 to-slate-700 dark:from-white dark:to-slate-400">
              GVU Attend
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Sign in to manage your session</p>
          </div>

          {/* Role Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-4 border border-slate-200/50 dark:border-slate-700/50">
            <button
              type="button"
              onClick={() => { setActiveTab('student'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all duration-300 ${
                activeTab === 'student'
                  ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <GraduationCap size={14} />
              Student
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('instructor'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all duration-300 ${
                activeTab === 'instructor'
                  ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BookOpen size={14} />
              Instructor
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('admin'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all duration-300 ${
                activeTab === 'admin'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck size={14} />
              Admin
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[11px] border border-red-200 dark:border-red-800/50">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {activeTab === 'student' ? (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 ml-1">Matric Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <GraduationCap className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={matricNo}
                    onChange={(e) => setMatricNo(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono"
                    placeholder="CSC/19/1001"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  {activeTab === 'admin' ? 'Admin Email Address' : 'School Email Address'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    {activeTab === 'admin'
                      ? <ShieldCheck className="h-4 w-4 text-rose-400" />
                      : <User className="h-4 w-4 text-slate-400" />
                    }
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 text-sm rounded-xl border bg-white/50 dark:bg-slate-800/50 text-slate-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                      activeTab === 'admin'
                        ? 'border-rose-200 dark:border-rose-800/50 focus:ring-rose-500'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-primary-500'
                    }`}
                    placeholder={activeTab === 'admin' ? 'admin@computing.edu.ng' : 'instructor@example.com'}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Password</label>
                <a href="#" className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 hover:underline">Forgot?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center py-2.5 px-4 mt-2 border border-transparent rounded-xl shadow-md text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300 ${
                isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-primary-500/25'
              }`}
            >
              {isLoading ? (
                <div className="spinner !w-5 !h-5 !border-white/30 !border-l-white"></div>
              ) : (
                <>
                  <span className="text-sm font-semibold tracking-wide">Sign In</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-5 text-center">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Don&apos;t have an account?{' '}
              <Link to="/" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
