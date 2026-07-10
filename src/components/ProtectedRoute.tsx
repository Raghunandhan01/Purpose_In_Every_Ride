import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './ui/Logo';

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-surface gap-4">
        <Logo size={64} className="animate-pulse shadow-xl shadow-primary/10 border border-primary/20" id="protected-loading-logo" />
        <span className="text-sm font-semibold text-text-secondary animate-pulse">Verifying session...</span>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
