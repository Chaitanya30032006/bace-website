import React from 'react';
const { useState } = React;
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';
import { apiUrl } from '../config/api';
import { saveAuthSession } from '../lib/auth';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.message || 'Login failed');
      }

      saveAuthSession({ token: json.token, user: json.data.user });

      // Redirect depending on user role
      if (json.data.user.role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-orange-50/10 dark:bg-slate-950 transition-colors">
      <div className="w-full max-w-md p-8 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-xl flex flex-col gap-6">
        <div className="text-center flex flex-col items-center gap-2">
          <Logo className="h-16 w-16" showText={false} />
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Devotee Portal Sign In
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none font-bold mt-1">
            BACE Member Gateway
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs flex gap-2 items-start leading-relaxed font-semibold border border-red-100 dark:border-red-950/50">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-saffron-500 transition-all dark:text-white"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-saffron-500 transition-all dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 mt-2 py-3 rounded-xl bg-gradient-to-r from-saffron-600 to-gold-500 hover:from-saffron-700 hover:to-gold-600 text-white font-extrabold text-sm shadow-md shadow-saffron-500/10 hover:shadow-lg disabled:opacity-50 transition-all"
          >
            {loading ? 'Signing In...' : 'Sign In'}
            <LogIn className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-2">
          <Link to="/forgot-password" className="font-bold text-saffron-600 hover:text-saffron-700">
            Forgot Password?
          </Link>
          <span>
            Not a member yet?{' '}
            <Link to="/register" className="font-bold text-saffron-600 hover:text-saffron-700">
              Request Membership Approval
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
