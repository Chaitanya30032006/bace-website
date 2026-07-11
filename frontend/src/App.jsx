import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { getAuthSession } from './lib/auth';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Memories from './pages/Memories';
import Donate from './pages/Donate';

export default function App() {
  const { token, user } = getAuthSession();

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-orange-50/10 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
        <Navbar />
        
        <main className="flex-grow">
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

            {/* Protected Devotee Portal */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['Devotee']}>
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
        </main>

        <Footer />
      </div>
    </Router>
  );
}
