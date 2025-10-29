import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import WarmNavbar from '../components/layout/WarmNavbar';
import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import Jobs from './pages/Jobs';
import Sessions from './pages/Sessions';
import Reports from './pages/Reports';
import Invites from './pages/Invites';

const AdminApp: React.FC = () => {
  return (
    <WarmNavbar>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/candidates" element={<Candidates />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/invites" element={<Invites />} />
      </Routes>
    </WarmNavbar>
  );
};

export default AdminApp;