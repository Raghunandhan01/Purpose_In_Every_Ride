import React, { useState } from 'react';

import scooterIconUrl from '../../assets/images/scooter-icon.png';

interface LogoProps {
  className?: string;
  size?: number | string;
  id?: string;
}

export default function Logo({ className = '', size = 32, id = 'app-scooter-logo' }: LogoProps) {
  const [hasError, setHasError] = useState(false);

  // If size is a number, we add 'px', otherwise keep as is
  const dimension = typeof size === 'number' ? `${size}px` : size;

  return (
    <div 
      id={`${id}-container`}
      className={`relative overflow-hidden flex items-center justify-center select-none bg-zinc-950 rounded-xl ${className}`}
      style={{ width: dimension, height: dimension }}
    >
      {!hasError ? (
        <img
          id={id}
          src={scooterIconUrl}
          fetchPriority="high"
          alt="Scooter App Logo"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover transition-all duration-300 hover:scale-105"
          referrerPolicy="no-referrer"
          style={{ imageRendering: 'auto' }}
        />
      ) : (
        <div 
          id={`${id}-fallback`}
          className="w-full h-full bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center text-primary font-bold border border-primary/20"
        >
          {/* Fallback to custom beautiful SVG representing a sleek premium gold/black scooter */}
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            className="w-3/5 h-3/5 text-primary" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M5 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
            <path d="M19 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
            <path d="M5 16h14" />
            <path d="M12 16V9" />
            <path d="m15 12-3-3 3-3" />
            <path d="M17 14h2a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3" />
          </svg>
        </div>
      )}
    </div>
  );
}
