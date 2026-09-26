import React from 'react';
const { useState } = React;
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, AlertCircle, Check, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';
import { apiUrl } from '../config/api';

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const [step, setStep] = useState(tokenFromUrl ? 'reset' : 'request');
  const [email, setEmail] = useState('');
  const [resetToken] = useState(tokenFromUrl || '');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Request failed');
      setMessage('A password reset link has been sent to your email. Please check your inbox (and spam folder).');
      setStep('sent');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Reset failed');
      setStep('done');
      setMessage(json.message);
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
            {step === 'done' ? 'Password Reset!' : step === 'sent' ? 'Check Your Email' : step === 'reset' ? 'Set New Password' : 'Forgot Password'}
          </h2>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs flex gap-2 items-start font-semibold border border-red-100 dark:border-red-950/50">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs flex gap-2 items-start font-semibold border border-emerald-100 dark:border-emerald-950/50">
            <Check className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {/* Step 1: Request reset email */}
        {step === 'request' && (
          <form onSubmit={handleRequestReset} className="flex flex-col gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Enter your registered email address and we'll send you a link to reset your password.</p>
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
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-saffron-600 to-gold-500 hover:from-saffron-700 hover:to-gold-600 text-white font-extrabold text-sm shadow-md disabled:opacity-50 transition-all">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {/* Step 1b: Email sent confirmation */}
        {step === 'sent' && (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              We've sent a password reset link to <span className="font-bold">{email}</span>
            </p>
            <p className="text-xs text-slate-400">Didn't receive it? Check your spam folder or try again in a few minutes.</p>
            <button onClick={() => { setStep('request'); setMessage(''); }} className="text-xs font-bold text-saffron-600 hover:text-saffron-700">
              Try again with a different email
            </button>
          </div>
        )}

        {/* Step 2: Reset password (arrived via email link) */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-saffron-500 transition-all dark:text-white"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-saffron-500 transition-all dark:text-white"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-saffron-600 to-gold-500 hover:from-saffron-700 hover:to-gold-600 text-white font-extrabold text-sm shadow-md disabled:opacity-50 transition-all">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* Step 3: Done */}
        {step === 'done' && (
          <Link to="/login" className="w-full py-3 rounded-xl bg-gradient-to-r from-saffron-600 to-gold-500 text-white font-extrabold text-sm shadow-md text-center block">
            Go to Login
          </Link>
        )}

        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          <Link to="/login" className="font-bold text-saffron-600 hover:text-saffron-700 flex items-center justify-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
