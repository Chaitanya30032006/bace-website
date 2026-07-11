import React from 'react';
const { useState, useEffect } = React;
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, Sun, Moon, LogOut, Menu, X, User, Image, ShieldAlert, Heart } from 'lucide-react';
import Logo from './Logo';
import { apiUrl } from '../config/api';
import { clearAuthSession, getAuthSession } from '../lib/auth';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { token, user } = getAuthSession();

  // Dark Mode Toggle — apply on mount and on change
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Fetch Notifications if logged in
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(apiUrl('/api/notifications'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.status === 'success') {
        setNotifications(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 20000); // refresh notifications every 20s
    return () => clearInterval(timer);
  }, [token]);

  const handleNotificationRead = async (id) => {
    try {
      await fetch(apiUrl(`/api/notifications/${id}/read`), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-orange-100/50 dark:border-slate-800 shadow-sm transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/" 
              className={`text-sm font-semibold transition-colors hover:text-saffron-600 ${location.pathname === '/' ? 'text-saffron-600' : 'text-slate-600 dark:text-slate-300'}`}
            >
              Home
            </Link>

            {user && (
              <>
                {user.role === 'Admin' ? (
                  <Link 
                    to="/admin" 
                    className={`flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-saffron-600 ${location.pathname === '/admin' ? 'text-saffron-600' : 'text-slate-600 dark:text-slate-300'}`}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Admin Panel
                  </Link>
                ) : (
                  <Link 
                    to="/dashboard" 
                    className={`flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-saffron-600 ${location.pathname === '/dashboard' ? 'text-saffron-600' : 'text-slate-600 dark:text-slate-300'}`}
                  >
                    <User className="h-4 w-4" />
                    My Profile
                  </Link>
                )}
                
                <Link 
                  to="/memories" 
                  className={`flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-saffron-600 ${location.pathname === '/memories' ? 'text-saffron-600' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  <Image className="h-4 w-4" />
                  Memories
                </Link>
              </>
            )}

            <Link 
              to="/donate" 
              className={`flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-saffron-600 ${location.pathname === '/donate' ? 'text-saffron-600' : 'text-slate-600 dark:text-slate-300'}`}
            >
              <Heart className="h-4 w-4" />
              Donate
            </Link>

            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-slate-500 hover:bg-orange-50 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-saffron-800" />}
            </button>

            {/* Notifications Bell */}
            {user && (
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg text-slate-500 hover:bg-orange-50 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 py-2 max-h-96 overflow-y-auto">
                    <div className="px-4 py-1.5 border-b border-slate-100 dark:border-slate-800 font-bold text-sm text-slate-700 dark:text-slate-200">
                      Notifications
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-slate-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id}
                          onClick={() => handleNotificationRead(n.id)}
                          className={`px-4 py-2.5 hover:bg-orange-50/40 dark:hover:bg-slate-800/40 cursor-pointer border-b border-slate-50 dark:border-slate-800/50 flex flex-col gap-0.5 ${!n.isRead ? 'bg-saffron-50/30 dark:bg-saffron-950/10' : ''}`}
                        >
                          <span className="text-xs text-slate-700 dark:text-slate-200 leading-tight">
                            {n.message}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Hare Krishna, <span className="text-saffron-700 dark:text-saffron-400">{user.name}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-orange-100/60 text-saffron-800 hover:bg-saffron-700 hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-saffron-700 transition-all font-semibold text-sm"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-saffron-600">
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-saffron-600 to-gold-500 text-white font-bold text-sm shadow-md shadow-saffron-500/10 hover:shadow-lg hover:shadow-saffron-500/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-4 md:hidden">
            {/* Dark Mode Toggle for Mobile */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400"
            >
              {darkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-saffron-800" />}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-slate-800"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden glass-panel border-b border-orange-100/50 dark:border-slate-800 py-4 px-4 flex flex-col gap-3 transition-all">
          <Link to="/" onClick={() => setIsOpen(false)} className="text-sm font-bold p-2 rounded-lg hover:bg-orange-50/50 dark:hover:bg-slate-800">
            Home
          </Link>
          
          {user && (
            <>
              {user.role === 'Admin' ? (
                <Link to="/admin" onClick={() => setIsOpen(false)} className="text-sm font-bold p-2 rounded-lg hover:bg-orange-50/50 dark:hover:bg-slate-800">
                  Admin Panel
                </Link>
              ) : (
                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="text-sm font-bold p-2 rounded-lg hover:bg-orange-50/50 dark:hover:bg-slate-800">
                  My Profile
                </Link>
              )}
              <Link to="/memories" onClick={() => setIsOpen(false)} className="text-sm font-bold p-2 rounded-lg hover:bg-orange-50/50 dark:hover:bg-slate-800">
                Memories
              </Link>
            </>
          )}

          <Link to="/donate" onClick={() => setIsOpen(false)} className="text-sm font-bold p-2 rounded-lg hover:bg-orange-50/50 dark:hover:bg-slate-800">
            Donate
          </Link>

          {user ? (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <span className="text-xs font-semibold px-2 text-slate-500">
                Logged in as: {user.name} ({user.role})
              </span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors text-sm"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <Link 
                to="/login" 
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-bold"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-2 rounded-lg bg-gradient-to-r from-saffron-600 to-gold-500 text-white text-sm font-bold shadow-md"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
