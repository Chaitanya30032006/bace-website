import React, { lazy, Suspense, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { getAuthSession } from './lib/auth';

// Lazy-load pages for faster initial load
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Memories = lazy(() => import('./pages/Memories'));
const Donate = lazy(() => import('./pages/Donate'));

const PageLoader = () => (
  <div className="flex h-[60vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-saffron-600 border-t-transparent" />
  </div>
);

export default function App() {
  // Stable snapshot — avoids re-read on every render that causes Navigate loop warning
  const { token, user } = useMemo(() => getAuthSession(), []);

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-orange-50/10 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
        <Navbar />
        
        <main className="flex-grow">
          <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/donate" element={<Donate />} />
            
            <Route 
              path="/login" 
              element={
                token ? (
                  user?.role === 'Admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />
                ) : (
                  <Login />
                )
              } 
            />
            
            <Route 
              path="/register" 
              element={
                token ? (
                  user?.role === 'Admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />
                ) : (
                  <Register />
                )
              } 
            />

            <Route
              path="/forgot-password"
              element={
                token ? (
                  user?.role === 'Admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />
                ) : (
                  <ForgotPassword />
                )
              }
            />

            {/* Protected Devotee Portal */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['Devotee', 'Admin']}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />

            {/* Protected Admin Portal */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Protected Memories Gallery */}
            <Route 
              path="/memories" 
              element={
                <ProtectedRoute allowedRoles={['Devotee', 'Admin']}>
                  <Memories />
                </ProtectedRoute>
              } 
            />

            {/* Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>
    </Router>
  );
}
