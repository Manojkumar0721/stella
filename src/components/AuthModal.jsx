import React, { useState, useRef, useEffect } from 'react';
import { useAuth, DEFAULT_ADMIN } from '../context/AuthContext';
import { Sparkles, User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Shield } from 'lucide-react';

export default function AuthModal({ onLoginSuccess }) {
  const { signUp, signIn } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const containerRef = useRef(null);

  // Smooth scroll buffer to top on error or mode change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [mode, error, successMsg]);

  const handleFillAdminCredentials = () => {
    setMode('login');
    setEmail(DEFAULT_ADMIN.email);
    setPassword(DEFAULT_ADMIN.password);
    setError('');
    setSuccessMsg('Filled default admin credentials. Click Sign In to access Admin Panel.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    // Smooth scroll buffer to top when starting submit
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }

    try {
      if (mode === 'register') {
        const cleanName = displayName.trim();
        if (!cleanName) throw new Error('Full Name is required for registration.');
        if (!email.trim()) throw new Error('Gmail / Email address is required.');
        if (!password) throw new Error('Password is required.');

        // Add visual loading transition buffer
        await new Promise(resolve => setTimeout(resolve, 500));
        await signUp(email, password, cleanName, false);
        
        // After registration -> redirect to Sign In page so user logs in properly with credentials
        setMode('login');
        setPassword('');
        setSuccessMsg('Registration successful! Please sign in with your registered Gmail and password to log in.');
      } else {
        if (!email.trim()) throw new Error('Gmail / Email address is required.');
        if (!password) throw new Error('Password is required.');

        // Add visual loading transition buffer
        await new Promise(resolve => setTimeout(resolve, 500));
        await signIn(email, password);
        if (onLoginSuccess) onLoginSuccess();
      }
    } catch (err) {
      if (err.code === 'USER_NOT_REGISTERED' || err.message === 'USER_NOT_REGISTERED') {
        setMode('register');
        setError('No registered account found with this Gmail. Please complete registration first before logging in.');
      } else if (err.code === 'ALREADY_REGISTERED' || err.message === 'ALREADY_REGISTERED') {
        setMode('login');
        setError('An account with this Gmail already exists. Please sign in with your password instead.');
      } else if (err.code === 'WRONG_PASSWORD' || err.message === 'WRONG_PASSWORD') {
        setError('Incorrect password. Gmail and password must match. Access denied.');
      } else if (err.code === 'USER_RESTRICTED' || err.message?.includes('restricted')) {
        setError('Your account has been restricted by an administrator. Access denied.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Domain Not Authorized: Please add your production web URL to Firebase Console > Authentication > Settings > Authorized Domains.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password Sign-In Disabled: Please enable Email/Password in Firebase Console > Authentication > Sign-in method.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in font-sans">
      <div 
        ref={containerRef}
        className="relative w-full max-w-md bg-[#1e1f20] border border-neutral-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar scroll-smooth"
      >
        {/* Animated Progress Buffer Track */}
        {isSubmitting && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#131314] overflow-hidden z-20 rounded-t-3xl">
            <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 animate-pulse w-full"></div>
          </div>
        )}

        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 shadow-md shadow-blue-500/20 mb-1">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-serif font-extrabold text-white tracking-wider">
            Stella
          </h1>
          <p className="text-xs text-gray-400">
            {mode === 'login' 
              ? 'Sign in with your Gmail & password to access your dashboard' 
              : 'Register your Stella account with your Full Name, Gmail & password'}
          </p>
        </div>

        {/* Mode Tab Switcher */}
        <div className="flex bg-[#131314] p-1 rounded-full border border-neutral-800/60 text-xs font-medium">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 rounded-full transition-all duration-200 ${
              mode === 'login'
                ? 'bg-[#282a2c] text-white font-semibold shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 rounded-full transition-all duration-200 ${
              mode === 'register'
                ? 'bg-[#282a2c] text-white font-semibold shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-2xl text-xs flex items-center gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="leading-snug">{successMsg}</span>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3.5 rounded-2xl text-xs flex items-center gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            /* Full Name Input */
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-300 ml-1">Full Name <span className="text-rose-400">*</span></label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  placeholder="Alex Rivera"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#131314] border border-neutral-800 rounded-full pl-10 pr-4 py-2.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
              </div>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-300 ml-1">Gmail / Email Address <span className="text-rose-400">*</span></label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
              <input
                type="email"
                required
                placeholder="alex@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#131314] border border-neutral-800 rounded-full pl-10 pr-4 py-2.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />
            </div>
          </div>

          {/* Password Input with Eye Toggle */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-300 ml-1">Password <span className="text-rose-400">*</span></label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#131314] border border-neutral-800 rounded-full pl-10 pr-10 py-2.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3.5 top-2.5 text-gray-500 hover:text-gray-300 transition-colors p-0.5 rounded-full"
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Pill Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-full transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group text-xs active:scale-[0.99]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{mode === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
              </>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to Stella' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Admin Demo Login Quick Fill Box */}
        <div className="pt-2 border-t border-neutral-800/60">
          <div className="bg-[#131314] p-3 rounded-2xl border border-neutral-800 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-gray-200 text-[11px] truncate">Admin Login</p>
                <p className="text-[10px] text-gray-400 truncate font-mono">admin@stella.com / admin123</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleFillAdminCredentials}
              className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-[10px] font-bold transition-all shrink-0 active:scale-95"
            >
              Fill Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
