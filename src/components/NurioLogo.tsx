/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface NurioLogoProps {
  variant?: 'horizontal' | 'horizontal-compact' | 'vertical' | 'mark' | 'app-icon' | 'app-icon-dark';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
}

/**
 * High-fidelity vector SVG mark for NURIO
 * Accurately reproducing the coral-pink folded ribbon 'N' with speech bubble
 */
export function NurioMark({ className = 'h-8 w-8', dark = false }: { className?: string; dark?: boolean }) {
  const uniqueId = React.useId().replace(/:/g, '');

  if (dark) {
    // Pure white silhouette on dark / saturated background
    return (
      <svg 
        viewBox="0 0 100 100" 
        className={className} 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Chat Bubble at top right */}
        <rect x="56" y="16" width="30" height="22" rx="7" fill="white" />
        <path d="M72 38 L80 46 L79 38 Z" fill="white" />
        {/* 3 Dots inside bubble (transparent/coral cutouts) */}
        <circle cx="64" cy="27" r="2.2" fill="#E11D48" />
        <circle cx="71" cy="27" r="2.2" fill="#E11D48" />
        <circle cx="78" cy="27" r="2.2" fill="#E11D48" />

        {/* N folded ribbon */}
        <path 
          d="M24 22 C18 22 14 26 14 32 L14 68 C14 76 18 80 25 80 L32 80 C32 72 36 67 44 67 L50 78 C52 82 50 85 45 85 L25 85 C14 85 14 74 14 68 L14 48 L46 80 C50 84 56 84 62 81 L70 76 L70 42 C70 38 66 35 62 38 L24 22 Z" 
          fill="white" 
        />
      </svg>
    );
  }

  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Coral pink ribbon gradient (front diagonal) */}
        <linearGradient id={`grad-front-${uniqueId}`} x1="0.1" y1="0.1" x2="0.9" y2="0.9">
          <stop offset="0%" stopColor="#FF7A95" />
          <stop offset="45%" stopColor="#FF5277" />
          <stop offset="100%" stopColor="#EA335E" />
        </linearGradient>

        {/* Left curve gradient */}
        <linearGradient id={`grad-left-${uniqueId}`} x1="0" y1="0.2" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#FF6B8B" />
          <stop offset="70%" stopColor="#F43F5E" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>

        {/* Inner fold underside (light soft pink) */}
        <linearGradient id={`grad-inner-${uniqueId}`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#FFE0E6" />
          <stop offset="100%" stopColor="#FFB3C2" />
        </linearGradient>

        {/* Right upright gradient */}
        <linearGradient id={`grad-right-${uniqueId}`} x1="0.5" y1="1" x2="0.5" y2="0">
          <stop offset="0%" stopColor="#EA335E" />
          <stop offset="100%" stopColor="#FF859F" />
        </linearGradient>

        {/* Chat bubble gradient */}
        <linearGradient id={`grad-bubble-${uniqueId}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF6584" />
          <stop offset="100%" stopColor="#ED3B64" />
        </linearGradient>

        {/* Soft shadow under folds */}
        <filter id={`shadow-${uniqueId}`} x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#9F1239" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Layer 1: Right upright ribbon (behind diagonal) */}
      <path 
        d="M60 40 L70 34 C74 31 79 34 79 39 L79 78 C79 83 75 86 70 86 L60 81 Z" 
        fill={`url(#grad-right-${uniqueId})`} 
        opacity="0.9"
      />

      {/* Layer 2: Folded inner page / bottom-left loop reverse side */}
      <path 
        d="M24 64 C24 72 28 78 36 80 L52 83 C48 76 44 71 36 71 L26 71 Z" 
        fill={`url(#grad-inner-${uniqueId})`} 
      />

      {/* Layer 3: Left sweeping ribbon arm & bottom curled tail */}
      <path 
        d="M27 18 C20 18 14 24 14 32 L14 66 C14 77 20 83 30 83 L49 83 C52 83 54 80 52 77 C48 71 42 66 33 66 L25 66 C23 66 22 64 22 62 L22 32 C22 27 25 24 28 24 Z" 
        fill={`url(#grad-left-${uniqueId})`}
        filter={`url(#shadow-${uniqueId})`}
      />

      {/* Layer 4: Main bold diagonal ribbon slashing across */}
      <path 
        d="M24 18 C20 18 16 22 17 27 L22 38 L63 83 C66 86 71 86 74 83 L77 80 C80 77 80 72 76 68 L29 19 C28 18 26 18 24 18 Z" 
        fill={`url(#grad-front-${uniqueId})`}
        filter={`url(#shadow-${uniqueId})`}
      />

      {/* Layer 5: Top-right speech bubble */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Rounded rectangle speech bubble */}
        <rect 
          x="56" 
          y="15" 
          width="32" 
          height="23" 
          rx="7.5" 
          fill={`url(#grad-bubble-${uniqueId})`} 
        />
        {/* Pointer tip at bottom right pointing down towards ribbon */}
        <path 
          d="M74 37 L80 45 C80.8 45.8 82 45.2 82 44.2 L82 37 Z" 
          fill={`url(#grad-bubble-${uniqueId})`} 
        />
        {/* Three white circular dots */}
        <circle cx="65" cy="26.5" r="2.2" fill="white" />
        <circle cx="72" cy="26.5" r="2.2" fill="white" />
        <circle cx="79" cy="26.5" r="2.2" fill="white" />
      </g>
    </svg>
  );
}

/**
 * App icon variant inside a squircle tile
 */
export function NurioAppIcon({ 
  className = 'h-12 w-12', 
  dark = false 
}: { 
  className?: string; 
  dark?: boolean 
}) {
  if (dark) {
    return (
      <div className={`relative rounded-2xl bg-gradient-to-br from-[#FF5277] to-[#E11D48] p-2 flex items-center justify-center shadow-md overflow-hidden ${className}`}>
        <NurioMark className="w-full h-full" dark />
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl bg-gradient-to-b from-white to-[#FFF3F5] p-2 flex items-center justify-center border border-rose-100 shadow-sm overflow-hidden ${className}`}>
      <NurioMark className="w-full h-full" />
    </div>
  );
}

export default function NurioLogo({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showSubtitle = true
}: NurioLogoProps) {
  // Size mappings
  const markSizeMap = {
    xs: 'h-6 w-6',
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const titleSizeMap = {
    xs: 'text-base',
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  };

  const subtitleSizeMap = {
    xs: 'text-[9px]',
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base'
  };

  if (variant === 'mark') {
    return <NurioMark className={`${markSizeMap[size]} ${className}`} />;
  }

  if (variant === 'app-icon') {
    return <NurioAppIcon className={`${markSizeMap[size]} ${className}`} />;
  }

  if (variant === 'app-icon-dark') {
    return <NurioAppIcon className={`${markSizeMap[size]} ${className}`} dark />;
  }

  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center group ${className}`}>
        <div className="mb-2 transition-transform duration-200 group-hover:scale-105">
          <NurioMark className={markSizeMap[size] || 'h-12 w-12'} />
        </div>
        <div className="flex items-baseline justify-center tracking-tight font-extrabold text-slate-900 leading-none">
          <span className={`${titleSizeMap[size]} font-black tracking-tight`}>NURIO</span>
          <span className="text-rose-500 font-black text-2xl -ml-0.5 leading-none">.</span>
        </div>
        {showSubtitle && (
          <span className={`${subtitleSizeMap[size]} text-slate-500 font-medium tracking-wider mt-1.5 whitespace-nowrap`}>
            全臺灣護理學生的實習交流平台
          </span>
        )}
      </div>
    );
  }

  if (variant === 'horizontal-compact') {
    return (
      <div className={`flex items-center gap-2 group ${className}`}>
        <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
          <NurioMark className={markSizeMap[size]} />
        </div>
        <div className="flex items-baseline tracking-tight font-black text-slate-900 leading-none">
          <span className={`${titleSizeMap[size]} font-black tracking-tight`}>NURIO</span>
          <span className="text-rose-500 font-black text-xl -ml-0.5 leading-none">.</span>
        </div>
      </div>
    );
  }

  // Default: 'horizontal' (Full horizontal layout as in user's image 1 and image 3)
  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 group ${className}`}>
      {/* Mark */}
      <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
        <NurioMark className={markSizeMap[size]} />
      </div>

      {/* Typography stack: NURIO. + subtitle */}
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline tracking-tight text-slate-900 leading-none">
          <span className={`${titleSizeMap[size]} font-black tracking-tight font-sans`}>NURIO</span>
          <span className="text-rose-500 font-black text-lg sm:text-xl -ml-0.5 leading-none">.</span>
        </div>
        {showSubtitle && (
          <span className={`${subtitleSizeMap[size]} text-slate-500 font-medium tracking-normal mt-1 sm:mt-1.5 whitespace-nowrap hidden sm:block`}>
            全臺灣護理學生的實習交流平台
          </span>
        )}
      </div>
    </div>
  );
}
