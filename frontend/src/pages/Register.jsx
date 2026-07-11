import React from 'react';
const { useState } = React;
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Phone, Lock, User, CheckCircle2, AlertCircle } from 'lucide-react';
import Logo from '../components/Logo';
import { apiUrl } from '../config/api';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, mobile, password })
      });
      
      const json = await res.json();
      
      if (!res.ok) {
        const errorMsg = json.errors
          ? json.errors.map(e => e.message).join('. ')
          : (json.message || 'Registration failed');
        throw new Error(errorMsg);
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-orange-50/10 dark:bg-slate-950 transition-colors">
        <div className="w-full max-w-md p-8 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-xl flex flex-col items-center gap-6 text-center">
          <div className="p-4 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-950/50 shadow-sm animate-pulse">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Application Submitted!
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed px-2">
              Hare Krishna! Your registration request has been successfully created.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-orange-50/60 dark:bg-slate-800/50 border border-orange-100/50 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            <p className="font-bold text-saffron-700 dark:text-saffron-400 mb-1">Status: Pending Approval</p>
            An administrator has been notified. You will be able to log in once your membership request is approved.
          </div>

          <Link 
            to="/login" 
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-saffron-600 to-gold-500 hover:from-saffron-700 hover:to-gold-600 text-white font-bold text-sm shadow-md"
          >
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-orange-50/10 dark:bg-slate-950 transition-colors">
      <div className="w-full max-w-md p-8 rounded-3xl glass-panel border border-orange-100/40 dark:border-slate-800 shadow-xl flex flex-col gap-6">
        <div className="text-center flex flex-col items-center gap-2">
          <Logo className="h-16 w-16" showText={false} />
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Register Membership
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none font-bold mt-1">
            BACE Devotee Management Portal
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs flex gap-2 items-start leading-relaxed font-semibold border border-red-100 dark:border-red-950/50">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Devotee Name"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-saffron-500 transition-all dark:text-white"
              />
            </div>
          </div>

          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Email Address (Login Username)</label>
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

          {/* Mobile field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
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
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-saffron-500 transition-all dark:text-white"
              />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
              Min 8 characters with uppercase, lowercase, number, and special character.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 mt-2 py-3 rounded-xl bg-gradient-to-r from-saffron-600 to-gold-500 hover:from-saffron-700 hover:to-gold-600 text-white font-extrabold text-sm shadow-md shadow-saffron-500/10 hover:shadow-lg disabled:opacity-50 transition-all"
          >
            {loading ? 'Submitting Application...' : 'Request Membership'}
            <UserPlus className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-saffron-600 hover:text-saffron-700">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
