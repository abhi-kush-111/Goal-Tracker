import React from 'react';
import { cn } from '../App';

export const Logo = ({ className, size = "md" }: { className?: string, size?: "sm" | "md" | "lg" }) => {
  const sizes = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16"
  };

  return (
    <div className={cn("relative flex items-center justify-center group", className)}>
      <svg 
        viewBox="0 0 100 100" 
        className={cn("transition-transform duration-500 group-hover:scale-110", sizes[size])}
      >
        {/* Background Shield */}
        <rect x="5" y="5" width="90" height="90" rx="24" fill="#10b981" />
        
        {/* Target Rings */}
        <circle cx="50" cy="50" r="28" fill="none" stroke="#052e1a" strokeWidth="6" />
        <circle cx="50" cy="50" r="16" fill="none" stroke="#052e1a" strokeWidth="6" />
        <circle cx="50" cy="50" r="6" fill="#052e1a" />
        
        {/* Decorative Spark/Flame */}
        <path 
          d="M78 12 Q88 12 88 22 Q88 32 78 32 Q68 32 68 22 Q68 12 78 12" 
          fill="#f59e0b" 
          className="animate-pulse"
        />
        <path 
          d="M78 17 Q83 17 83 22 Q83 27 78 27 Q73 27 73 22 Q73 17 78 17" 
          fill="#451a03" 
        />
      </svg>
    </div>
  );
};

export const LogoFull = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center gap-3 group cursor-pointer", className)}>
      <Logo />
      <h1 className="text-2xl font-black tracking-tighter text-white">
        Goal<span className="text-emerald-500">Forge</span>
      </h1>
    </div>
  );
};
