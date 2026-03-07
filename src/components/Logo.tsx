import React from 'react';
import { Target } from 'lucide-react';
import { cn } from '../App'; // Assuming cn is exported or I'll just use a local version

export const Logo = ({ className, size = "md" }: { className?: string, size?: "sm" | "md" | "lg" }) => {
  const sizes = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16"
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10"
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Outer Hexagon/Shield Shape */}
      <div className={cn(
        "bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-500",
        sizes[size]
      )}>
        <Target className={cn("text-[#052e1a] -rotate-3 group-hover:rotate-0 transition-transform duration-500", iconSizes[size])} />
      </div>
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
