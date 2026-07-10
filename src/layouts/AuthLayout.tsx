import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';

export default function AuthLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-surface gap-4">
        <Logo size={64} className="animate-pulse shadow-xl shadow-primary/10 border border-primary/20" id="auth-loading-logo" />
        <span className="text-sm font-semibold text-text-secondary animate-pulse">Loading Scooter...</span>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Logo size={64} className="mb-4 shadow-lg shadow-primary/10 border border-border/20" id="auth-layout-logo" />
          <h1 className="text-3xl font-bold text-text-primary">Scooter</h1>
          <p className="text-text-secondary mt-2">Purpose in Every Ride</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

