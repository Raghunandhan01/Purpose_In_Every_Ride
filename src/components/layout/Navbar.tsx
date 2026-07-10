import React, { useState } from 'react';
import { Bell, Search, Menu, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import EditProfileModal from '../profile/EditProfileModal';

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Generate initials fallback
  const fullName = user?.fullName || 'Rider';
  const nameParts = fullName.split(' ') || ['User'];
  const initials = nameParts.length > 1 
    ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase() 
    : (nameParts[0]?.[0] || 'R').toUpperCase();

  return (
    <header className="h-16 bg-surface-card/80 backdrop-blur-md border-b border-border sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-text-secondary hover:bg-surface rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="hidden md:flex items-center relative">
          <Search className="w-4 h-4 text-text-secondary absolute left-3" />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            className="pl-9 pr-4 py-2 bg-surface border border-border rounded-full text-sm focus:ring-2 focus:ring-primary/20 w-64 outline-none transition-all focus:bg-surface-card"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-text-secondary hover:bg-surface rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-surface-card"></span>
        </button>
        
        {/* Interactive User Profile area */}
        <button 
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center gap-3 pl-4 border-l border-border hover:opacity-90 group transition-all text-left outline-none cursor-pointer"
          title="Edit Profile"
        >
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">{fullName}</span>
            <span className="text-xs text-text-secondary capitalize">
              {user?.vehicleType || user?.preferredPlatform || 'Delivery Rider'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-slate-950 font-semibold shadow-sm border border-border/10">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
        </button>
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
      />
    </header>
  );
}
