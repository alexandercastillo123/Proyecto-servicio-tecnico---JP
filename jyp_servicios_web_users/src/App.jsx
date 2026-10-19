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
import TechnicianList from './components/TechnicianList';
import TechnicianProfile from './components/TechnicianProfile';
import AppointmentScheduling from './components/AppointmentScheduling';
import AppointmentList from './components/AppointmentList';
import AppointmentDetails from './components/AppointmentDetails';
import Chat from './components/Chat';
import ProfileEdit from './components/ProfileEdit';
import StoreCreate from './components/StoreCreate';
import StoreList from './components/StoreList';
import StoreProfile from './components/StoreProfile';
import OrderList from './components/OrderList';
import OrderFlowWizard from './components/OrderFlowWizard';
import StoreMarketplace from './components/StoreMarketplace';
import Notifications from './components/Notifications';
import ScheduleManagement from './components/ScheduleManagement';
import ChangePassword from './components/ChangePassword';
import Legal from './components/Legal';
import { Toaster } from 'react-hot-toast';
import { authService } from './services/api';
import { SocketProvider } from './context/SocketContext';
import { TechLoader } from './components/common/TechLoader';

// Admin
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminAppointments from './components/admin/AdminAppointments';
import AdminUsers from './components/admin/AdminUsers';
import AdminOrders from './components/admin/AdminOrders';
import AdminStores from './components/admin/AdminStores';

import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed) {
          parsed.id = parsed.id || parsed.userId;
          parsed.userId = parsed.userId || parsed.id;
          setUser(parsed);
        }
      } catch (_) {}
    }
    setLoading(false);
  }, []);

  /* Si el usuario guardado no trae nombres (no vienen del login), se consulta
     el perfil para que el saludo y el header usen el nombre real. */
  useEffect(() => {
    if (!user || user.names) return;
    let cancelled = false;
    authService.getProfile()
      .then((res) => {
        if (cancelled) return;
        const profile = res.data?.resultado;
        if (!profile) return;
        const merged = { ...user, ...profile };
        localStorage.setItem('user', JSON.stringify(merged));
        setUser(merged);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id]);

  /* Sincroniza los cambios de perfil (foto, nombre, rol) con el header */
  useEffect(() => {
    const onUserUpdated = (e) => {
      if (e?.detail) {
        setUser(prev => ({ ...prev, ...e.detail }));
      }
    };
    window.addEventListener('jyp:user-updated', onUserUpdated);
    return () => window.removeEventListener('jyp:user-updated', onUserUpdated);
  }, []);

  if (loading) {
    return (
      <TechLoader 
        fullscreen 
        title="Inicializando Plataforma JyP" 
        subtitle="Conectando al centro de servicios técnicos..." 
      />
    );
  }

  const handleLogin = (userData) => {
    if (userData) {
      userData.id = userData.id || userData.userId;
      userData.userId = userData.userId || userData.id;
    }
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <Router>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: 'var(--bg-elevated, #131A26)',
          color: 'var(--text-primary, #F0F4FF)',
          border: '1px solid var(--border, rgba(255,255,255,0.07))',
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
          fontWeight: '600',
          borderRadius: '12px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
        }
      }} />

      <Routes>
        {/* ── Public Auth Routes ─────────────────────────── */}
        <Route path="/login"           element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
        <Route path="/register"        element={!user ? <Register onLogin={handleLogin} /> : <Navigate to="/" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-code"     element={<VerifyCode />} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        {/* ── Admin Routes ───────────────────────────────── */}
        <Route
          path="/admin"
          element={
            user && isAdmin
              ? <AdminLayout user={user} onLogout={handleLogout} />
              : <Navigate to={user ? '/' : '/login'} />
          }
        >
          <Route index                element={<AdminDashboard />} />
          <Route path="citas"         element={<AdminAppointments />} />
          <Route path="usuarios"      element={<AdminUsers />} />
          <Route path="pedidos"       element={<AdminOrders />} />
          <Route path="sucursales"    element={<AdminStores />} />
          <Route path="sucursales/:id" element={<AdminStores />} />
        </Route>

        {/* ── Regular User Routes ────────────────────────── */}
        <Route
          path="/"
          element={
            user
              ? isAdmin
                ? <Navigate to="/admin" />
                : (
                  <SocketProvider user={user}>
                    <Layout user={user} onLogout={handleLogout} />
                  </SocketProvider>
                )
              : <Navigate to="/login" />
          }
        >
          <Route index element={
            user?.role === 'client' ? <ClientDashboard /> :
            user?.role === 'tech'   ? <TechDashboard />   :
            user?.role === 'store'  ? <StoreDashboard />  :
            <Navigate to="/login" />
          } />

          {/* General Features */}
          <Route path="technicians"           element={<TechnicianList />} />
          <Route path="technician/:id"        element={<TechnicianProfile />} />
          <Route path="appointments"          element={<AppointmentList />} />
          <Route path="appointments/schedule" element={<AppointmentScheduling />} />
          <Route path="appointments/:id"      element={<AppointmentDetails />} />
          <Route path="chat"                  element={<Chat />} />
          <Route path="profile"               element={<ProfileEdit />} />
          <Route path="orders"                element={<OrderList />} />
          <Route path="order/new"             element={<OrderFlowWizard />} />
          <Route path="notifications"         element={<Notifications />} />
          <Route path="schedule"              element={<ScheduleManagement />} />
          <Route path="change-password"       element={<ChangePassword />} />
          <Route path="legal"                 element={<Legal />} />

          {/* Store Specific */}
          <Route path="shop"                  element={<StoreMarketplace />} />
          <Route path="stores"                element={<StoreList />} />
          <Route path="stores/create"         element={<StoreCreate />} />
          <Route path="store/:id"             element={<StoreProfile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
