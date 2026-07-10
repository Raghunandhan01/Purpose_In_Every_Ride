import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-surface flex flex-col selection:bg-primary/20 selection:text-primary">
      <nav className="fixed w-full z-50 bg-surface-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2.5">
              <Logo size={32} id="public-layout-logo" />
              <span className="text-xl font-bold text-primary tracking-tight">
                Scooter
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary hidden sm:block">
                Log in
              </Link>
              <Link to="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
    </div>
  );
}
