/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { LanguageThemeProvider } from './context/LanguageThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './layouts/PublicLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

import Dashboard from './pages/Dashboard';
import Earnings from './pages/Earnings';
import Expenses from './pages/Expenses';
import EmergencyFund from './pages/EmergencyFund';
import Analytics from './pages/Analytics';
import AiPredictor from './pages/AiPredictor';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Platforms from './pages/Platforms';
import Transactions from './pages/Transactions';
import Apps from './pages/Apps';
import PlatformDashboard from './pages/PlatformDashboard';

export default function App() {
  return (
    <AuthProvider>
      <LanguageThemeProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
            </Route>

            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* Protected Dashboard Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="earnings" element={<Earnings />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="emergency-fund" element={<EmergencyFund />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="predictor" element={<AiPredictor />} />
                <Route path="reports" element={<Reports />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="platforms" element={<Platforms />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="apps" element={<Apps />} />
                <Route path="apps/:platformId" element={<PlatformDashboard />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </LanguageThemeProvider>
    </AuthProvider>
  );
}
