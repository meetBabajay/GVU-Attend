import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Lock, Mail, GraduationCap, BookOpen,
  ArrowRight, Hash, Building2, Layers, CheckCircle2,
  Eye, EyeOff
} from 'lucide-react';
import api from '../services/api';

const LEVELS = [100, 200, 300, 400, 500];

const InputField = ({ label, icon: Icon, error, ...props }) => (
  <div className="space-y-1">
    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 ml-1">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <input
        {...props}
        className={`block w-full pl-10 pr-3 py-2 text-sm rounded-xl border ${
          error
            ? 'border-red-400 dark:border-red-600 bg-red-50/50 dark:bg-red-900/20'
            : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50'
        } text-slate-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all`}
      />
    </div>
    {error && <p className="text-[10px] text-red-500 ml-1 mt-0.5">{error}</p>}
  </div>
);

const SelectField = ({ label, icon: Icon, children, error, ...props }) => (
  <div className="space-y-1">
    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 ml-1">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <select
        {...props}
        className={`block w-full pl-10 pr-3 py-2 text-sm rounded-xl border ${
          error
            ? 'border-red-400 dark:border-red-600 bg-red-50/50 dark:bg-red-900/20'
            : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50'
        } text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all appearance-none`}
      >
        {children}
      </select>
    </div>
    {error && <p className="text-[10px] text-red-500 ml-1 mt-0.5">{error}</p>}
  </div>
);

// ─── Student Registration Form ───────────────────────────────
const StudentForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    fullName: '', email: '', matricNumber: '', password: '', confirmPassword: '',
    departmentId: '', level: ''
  });
  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    api.get('/auth/departments')
      .then(r => setDepartments(r.data))
      .catch(() => setDepartments([]));
  }, []);

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.matricNumber.trim()) e.matricNumber = 'Matric number is required';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.departmentId) e.departmentId = 'Select a department';
    if (!form.level) e.level = 'Select your level';
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsLoading(true);
    setApiError('');
    try {
      await api.post('/auth/register-student', {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        matricNumber: form.matricNumber.trim(),
        password: form.password,
        departmentId: form.departmentId,
        level: parseInt(form.level, 10)
      });
      onSuccess('student');
    } catch (err) {
      setApiError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
      {apiError && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[11px] border border-red-200 dark:border-red-800/50">
          {apiError}
        </div>
      )}

      <InputField
        label="Full Name"
        icon={User}
        type="text"
        value={form.fullName}
        onChange={handleChange('fullName')}
        placeholder="e.g. Alice Johnson"
        error={errors.fullName}
        required
      />

      <InputField
        label="School Email Address"
        icon={Mail}
        type="email"
        value={form.email}
        onChange={handleChange('email')}
        placeholder="student@university.edu.ng"
        error={errors.email}
        required
      />

      <InputField
        label="Matric Number"
        icon={Hash}
        type="text"
        value={form.matricNumber}
        onChange={handleChange('matricNumber')}
        placeholder="CSC/19/1001"
        error={errors.matricNumber}
        className="font-mono"
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Department"
          icon={Building2}
          value={form.departmentId}
          onChange={handleChange('departmentId')}
          error={errors.departmentId}
        >
          <option value="">Select dept.</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </SelectField>

        <SelectField
          label="Level"
          icon={Layers}
          value={form.level}
          onChange={handleChange('level')}
          error={errors.level}
        >
          <option value="">Level</option>
          {LEVELS.map(l => (
            <option key={l} value={l}>{l}L</option>
          ))}
        </SelectField>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 ml-1">Password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Lock className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type={showPwd ? 'text' : 'password'}
            value={form.password}
            onChange={handleChange('password')}
            placeholder="Min. 6 characters"
            className={`block w-full pl-10 pr-10 py-2 text-sm rounded-xl border ${errors.password ? 'border-red-400 dark:border-red-600' : 'border-slate-200 dark:border-slate-700'} bg-white/50 dark:bg-slate-800/50 text-slate-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all`}
          />
          <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-[10px] text-red-500 ml-1">{errors.password}</p>}
      </div>

      <InputField
        label="Confirm Password"
        icon={Lock}
        type="password"
        value={form.confirmPassword}
        onChange={handleChange('confirmPassword')}
        placeholder="Repeat password"
        error={errors.confirmPassword}
        required
      />

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full flex items-center justify-center py-2.5 px-4 mt-1 border border-transparent rounded-xl shadow-md text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300 ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-primary-500/25'}`}
      >
        {isLoading ? (
          <div className="spinner !w-5 !h-5 !border-white/30 !border-l-white" />
        ) : (
          <>
            <span className="text-sm font-semibold tracking-wide">Register as Student</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
};

// ─── Instructor Registration Form ────────────────────────────
const InstructorForm = ({ onSuccess }) => {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsLoading(true);
    setApiError('');
    try {
      await api.post('/auth/register-lecturer', {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password
      });
      onSuccess('instructor');
    } catch (err) {
      setApiError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
      {apiError && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[11px] border border-red-200 dark:border-red-800/50">
          {apiError}
        </div>
      )}

      <InputField
        label="Full Name"
        icon={User}
        type="text"
        value={form.fullName}
        onChange={handleChange('fullName')}
        placeholder="e.g. Dr. Jane Doe"
        error={errors.fullName}
        required
      />

      <InputField
        label="School Email Address"
        icon={Mail}
        type="email"
        value={form.email}
        onChange={handleChange('email')}
        placeholder="instructor@university.edu.ng"
        error={errors.email}
        required
      />

      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 ml-1">Password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Lock className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type={showPwd ? 'text' : 'password'}
            value={form.password}
            onChange={handleChange('password')}
            placeholder="Min. 6 characters"
            className={`block w-full pl-10 pr-10 py-2 text-sm rounded-xl border ${errors.password ? 'border-red-400 dark:border-red-600' : 'border-slate-200 dark:border-slate-700'} bg-white/50 dark:bg-slate-800/50 text-slate-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all`}
          />
          <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-[10px] text-red-500 ml-1">{errors.password}</p>}
      </div>

      <InputField
        label="Confirm Password"
        icon={Lock}
        type="password"
        value={form.confirmPassword}
        onChange={handleChange('confirmPassword')}
        placeholder="Repeat password"
        error={errors.confirmPassword}
        required
      />

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full flex items-center justify-center py-2.5 px-4 mt-1 border border-transparent rounded-xl shadow-md text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300 ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-primary-500/25'}`}
      >
        {isLoading ? (
          <div className="spinner !w-5 !h-5 !border-white/30 !border-l-white" />
        ) : (
          <>
            <span className="text-sm font-semibold tracking-wide">Register as Instructor</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
};

// ─── Success State ───────────────────────────────────────────
const SuccessView = ({ role }) => (
  <div className="flex flex-col items-center text-center py-4 space-y-4">
    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
      <CheckCircle2 className="w-9 h-9 text-green-600 dark:text-green-400" />
    </div>
    <div>
      <h2 className="text-lg font-bold text-slate-800 dark:text-white">Registration Submitted!</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
        Your {role} account is <strong>pending administrator approval</strong>. You will be able to sign in once your account has been reviewed.
      </p>
    </div>
    <Link
      to="/login"
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold shadow-md hover:from-primary-700 hover:to-primary-600 transition-all duration-300"
    >
      Back to Sign In
      <ArrowRight className="h-4 w-4" />
    </Link>
  </div>
);

// ─── Main Register Page ──────────────────────────────────────
const Register = () => {
  const [activeTab, setActiveTab] = useState('student');
  const [submitted, setSubmitted] = useState(false);
  const [submittedRole, setSubmittedRole] = useState('');

  const handleSuccess = (role) => {
    setSubmittedRole(role);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Background orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 pointer-events-none animate-blob" />
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 pointer-events-none animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 pointer-events-none animate-blob animation-delay-4000" />

      <div className="w-full max-w-sm z-10 animate-fade-in">
        <div className="glass-panel p-6 rounded-3xl shadow-xl relative">

          {/* Logo */}
          <div className="flex flex-col items-center mb-5">
            <div className="bg-white dark:bg-slate-800 p-1 rounded-full shadow-md border border-slate-200 dark:border-slate-700 mb-3">
              <img src="/gvu_logo.png" alt="GVU Logo" className="w-16 h-16 rounded-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-950 to-slate-700 dark:from-white dark:to-slate-400">
              Create Account
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              Register to join the GVU Attend portal
            </p>
          </div>

          {submitted ? (
            <SuccessView role={submittedRole} />
          ) : (
            <>
              {/* Role Tabs */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-4 border border-slate-200/50 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setActiveTab('student')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all duration-300 ${
                    activeTab === 'student'
                      ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <GraduationCap size={16} />
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('instructor')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all duration-300 ${
                    activeTab === 'instructor'
                      ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <BookOpen size={16} />
                  Instructor
                </button>
              </div>

              {activeTab === 'student'
                ? <StudentForm key="student" onSuccess={handleSuccess} />
                : <InstructorForm key="instructor" onSuccess={handleSuccess} />
              }

              <div className="mt-4 text-center">
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
