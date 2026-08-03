import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  variant?: 'color' | 'light' | 'dark';
  showText?: boolean;
  showSubtitle?: boolean;
}

export function LogoIcon({ className = '', size = 48, variant = 'color' }: LogoProps) {
  // Use exact theme colors (navy and gold) matching the image
  const navy = variant === 'light' ? '#ffffff' : '#113a69'; // Navy: HSL(217, 70%, 24%)
  const gold = variant === 'light' ? '#fcd34d' : '#dca91e'; // Gold: HSL(47, 72%, 49%)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} transition-all duration-300`}
    >
      {/* 1. Left Vertical Stem of the "N" */}
      <rect 
        x="48" 
        y="42" 
        width="18" 
        height="106" 
        rx="3" 
        fill={navy} 
      />
      
      {/* 2. Diagonal of the "N" connecting the top-left to middle-right */}
      <path 
        d="M 48 44 
           L 108 128 
           C 112 134, 118 136, 124 133 
           L 108 120 
           L 66 44 
           Z" 
        fill={navy} 
      />

      {/* 3. Gold vertical middle section of "J" */}
      <rect 
        x="95" 
        y="42" 
        width="18" 
        height="72" 
        rx="3" 
        fill={gold} 
      />

      {/* 4. Navy J Loop curving under & going straight up to become the Arrow Stem */}
      <path 
        d="M 95 104 
           C 95 142, 142 142, 142 104 
           L 142 62" 
        stroke={navy} 
        strokeWidth="18" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none"
      />

      {/* 5. Custom stylized arrowhead at the top of the right stem */}
      <path 
        d="M 124 62 
           L 142 40 
           L 160 62 
           Z" 
        fill={navy} 
        stroke={navy}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Logo({ 
  className = '', 
  size = 64, 
  variant = 'color', 
  showText = true, 
  showSubtitle = true 
}: LogoProps) {
  const textColor = variant === 'light' ? 'text-white' : 'text-navy';
  const subtitleColor = variant === 'light' ? 'text-gold-light' : 'text-gold-dark';

  return (
    <div className={`flex flex-col items-center justify-center text-center font-sans ${className}`}>
      {/* Logo Monogram Mark */}
      <LogoIcon size={size} variant={variant} />

      {showText && (
        <div className="mt-2.5 flex flex-col items-center">
          {/* Main Title text: NAJI ACADEMY */}
          <h2 className={`${textColor} font-bold tracking-[0.16em] uppercase text-sm sm:text-base leading-none select-none font-sans`}>
            NAJI ACADEMY
          </h2>

          {/* Golden Separator Lines + central dot matching the physical logo */}
          <div className="flex items-center gap-2 my-2 w-28 opacity-90">
            <span className={`h-[1px] flex-1 bg-gradient-to-l from-transparent ${variant === 'light' ? 'to-white/60' : 'to-gold/60'}`}></span>
            <span className={`w-1.5 h-1.5 rounded-full ${variant === 'light' ? 'bg-amber-300' : 'bg-gold'}`}></span>
            <span className={`h-[1px] flex-1 bg-gradient-to-r from-transparent ${variant === 'light' ? 'to-white/60' : 'to-gold/60'}`}>
            </span>
          </div>

          {/* Subtitle slogan: THE NEW JOURNEY */}
          {showSubtitle && (
            <span className={`${subtitleColor} text-[9px] sm:text-[10px] tracking-[0.25em] font-extrabold uppercase leading-none select-none`}>
              THE NEW JOURNEY
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Horizontal variant for Navbar, badges, etc.
 */
export function LogoHorizontal({ 
  className = '', 
  size = 36, 
  variant = 'color',
  academyName = 'أكاديمية ناجي'
}: { 
  className?: string; 
  size?: number; 
  variant?: 'color' | 'light' | 'dark';
  academyName?: string;
}) {
  const isLight = variant === 'light';
  
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Compact Monogram */}
      <LogoIcon size={size} variant={variant} />

      {/* Left aligned brand text */}
      <div className="flex flex-col items-start text-right">
        <span className={`font-bold leading-tight font-sans text-sm sm:text-base ${isLight ? 'text-white' : 'text-navy'}`}>
          {academyName === 'NAJI ACADEMY' ? 'أكاديمية ناجي' : academyName}
        </span>
        <span className={`text-[8.5px] uppercase tracking-widest leading-none font-bold ${isLight ? 'text-amber-200/90' : 'text-slate-400'}`}>
          NAJI ACADEMY
        </span>
      </div>
    </div>
  );
}
