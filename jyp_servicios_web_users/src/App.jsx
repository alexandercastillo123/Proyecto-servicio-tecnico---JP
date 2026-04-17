import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import VerifyCode from './components/VerifyCode';
import ResetPassword from './components/ResetPassword';
import Layout from './components/Layout';
import ClientDashboard from './components/ClientDashboard';
import TechDashboard from './components/TechDashboard';
import StoreDashboard from './components/StoreDashboard';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-[#05060A] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#3B28FF] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[#3B28FF] font-black text-xs uppercase tracking-widest">Cargando Sistema...</p>
      </div>
    );
  }

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register onLogin={handleLogin} /> : <Navigate to="/" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected Routes */}
        <Route path="/" element={user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}>
          <Route index element={
            user?.role === 'client' ? <ClientDashboard /> : 
            user?.role === 'tech' ? <TechDashboard /> : 
            user?.role === 'store' ? <StoreDashboard /> :
            <Navigate to="/login" />
          } />
          
          {/* Add more role-specific nested routes here as needed */}
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
