/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface NurioMotionMarkProps {
  className?: string;
  size?: number;
}

/**
 * Animated dynamic logo component for splash / loading screen.
 * Displays the NURIO signature logo mark:
 * - Pure, pristine folded ribbon 'N' with chat bubble
 * - Smooth floating squircle card with soft ambient aura
 * - Subtle typing dots inside the speech bubble
 * - Clean visual presentation without any intrusive traveling light points
 */
export default function NurioMotionMark({
  className = 'w-32 h-32 sm:w-36 sm:h-36',
}: NurioMotionMarkProps) {
  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* 1. Atmospheric Ambient Radial Glow */}
      <div className="absolute -inset-6 rounded-full bg-gradient-to-tr from-rose-500/15 via-pink-400/20 to-rose-300/10 blur-2xl animate-pulse pointer-events-none" />
      <div 
        className="absolute -inset-3 rounded-full bg-rose-400/15 blur-xl animate-nurio-ring pointer-events-none" 
        style={{ animationDuration: '3s' }} 
      />

      {/* 2. Floating Squircle Logo Card */}
      <div className="relative w-full h-full animate-nurio-float">
        <div className="relative w-full h-full rounded-3xl bg-white border border-rose-100 shadow-2xl shadow-rose-500/15 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          
          <svg 
            viewBox="0 0 100 100" 
            className="w-full h-full relative z-10" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Front Ribbon Gradient */}
              <linearGradient id={`motion-front-${uniqueId}`} x1="0.1" y1="0.1" x2="0.9" y2="0.9">
                <stop offset="0%" stopColor="#FF7A95" />
                <stop offset="45%" stopColor="#FF5277" />
                <stop offset="100%" stopColor="#EA335E" />
              </linearGradient>

              {/* Left Curve Gradient */}
              <linearGradient id={`motion-left-${uniqueId}`} x1="0" y1="0.2" x2="0.5" y2="1">
                <stop offset="0%" stopColor="#FF6B8B" />
                <stop offset="70%" stopColor="#F43F5E" />
                <stop offset="100%" stopColor="#E11D48" />
              </linearGradient>

              {/* Underside fold */}
              <linearGradient id={`motion-inner-${uniqueId}`} x1="0.2" y1="0" x2="0.8" y2="1">
                <stop offset="0%" stopColor="#FFE0E6" />
                <stop offset="100%" stopColor="#FFB3C2" />
              </linearGradient>

              {/* Right upright gradient */}
              <linearGradient id={`motion-right-${uniqueId}`} x1="0.5" y1="1" x2="0.5" y2="0">
                <stop offset="0%" stopColor="#EA335E" />
                <stop offset="100%" stopColor="#FF859F" />
              </linearGradient>

              {/* Chat bubble gradient */}
              <linearGradient id={`motion-bubble-${uniqueId}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FF5F80" />
                <stop offset="100%" stopColor="#E62E58" />
              </linearGradient>

              {/* Drop Shadow Filter */}
              <filter id={`motion-shadow-${uniqueId}`} x="-15%" y="-15%" width="130%" height="130%">
                <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#881337" floodOpacity="0.16" />
              </filter>
            </defs>

            {/* Base Logo Artwork */}
            {/* Layer 1: Right upright ribbon */}
            <path 
              d="M60 40 L70 34 C74 31 79 34 79 39 L79 78 C79 83 75 86 70 86 L60 81 Z" 
              fill={`url(#motion-right-${uniqueId})`} 
              opacity="0.94"
            />

            {/* Layer 2: Folded inner page / bottom-left loop reverse side */}
            <path 
              d="M24 64 C24 72 28 78 36 80 L52 83 C48 76 44 71 36 71 L26 71 Z" 
              fill={`url(#motion-inner-${uniqueId})`} 
            />

            {/* Layer 3: Left sweeping ribbon arm & bottom curled tail */}
            <path 
              d="M27 18 C20 18 14 24 14 32 L14 66 C14 77 20 83 30 83 L49 83 C52 83 54 80 52 77 C48 71 42 66 33 66 L25 66 C23 66 22 64 22 62 L22 32 C22 27 25 24 28 24 Z" 
              fill={`url(#motion-left-${uniqueId})`}
              filter={`url(#motion-shadow-${uniqueId})`}
            />

            {/* Layer 4: Main bold diagonal ribbon slashing across */}
            <path 
              d="M24 18 C20 18 16 22 17 27 L22 38 L63 83 C66 86 71 86 74 83 L77 80 C80 77 80 72 76 68 L29 19 C28 18 26 18 24 18 Z" 
              fill={`url(#motion-front-${uniqueId})`}
              filter={`url(#motion-shadow-${uniqueId})`}
            />

            {/* Layer 5: Top-right Speech Bubble with Gentle Wave Dots */}
            <g 
              className="animate-nurio-bubble origin-[70px_30px]" 
              filter={`url(#motion-shadow-${uniqueId})`}
            >
              {/* Rounded speech bubble body */}
              <rect 
                x="56" 
                y="15" 
                width="32" 
                height="23" 
                rx="7.5" 
                fill={`url(#motion-bubble-${uniqueId})`} 
              />
              {/* Pointer tip at bottom right */}
              <path 
                d="M74 37 L80 45 C80.8 45.8 82 45.2 82 44.2 L82 37 Z" 
                fill={`url(#motion-bubble-${uniqueId})`} 
              />

              {/* Three white circular dots doing lively chat wave */}
              <circle cx="65" cy="26.5" r="2.2" fill="white">
                <animate 
                  attributeName="cy" 
                  values="26.5;24;26.5" 
                  keyTimes="0;0.5;1" 
                  dur="1.2s" 
                  begin="0s" 
                  repeatCount="indefinite" 
                />
                <animate 
                  attributeName="opacity" 
                  values="0.7;1;0.7" 
                  keyTimes="0;0.5;1" 
                  dur="1.2s" 
                  begin="0s" 
                  repeatCount="indefinite" 
                />
              </circle>

              <circle cx="72" cy="26.5" r="2.2" fill="white">
                <animate 
                  attributeName="cy" 
                  values="26.5;24;26.5" 
                  keyTimes="0;0.5;1" 
                  dur="1.2s" 
                  begin="0.2s" 
                  repeatCount="indefinite" 
                />
                <animate 
                  attributeName="opacity" 
                  values="0.7;1;0.7" 
                  keyTimes="0;0.5;1" 
                  dur="1.2s" 
                  begin="0.2s" 
                  repeatCount="indefinite" 
                />
              </circle>

              <circle cx="79" cy="26.5" r="2.2" fill="white">
                <animate 
                  attributeName="cy" 
                  values="26.5;24;26.5" 
                  keyTimes="0;0.5;1" 
                  dur="1.2s" 
                  begin="0.4s" 
                  repeatCount="indefinite" 
                />
                <animate 
                  attributeName="opacity" 
                  values="0.7;1;0.7" 
                  keyTimes="0;0.5;1" 
                  dur="1.2s" 
                  begin="0.4s" 
                  repeatCount="indefinite" 
                />
              </circle>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
