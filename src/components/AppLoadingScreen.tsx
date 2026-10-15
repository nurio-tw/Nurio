/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import NurioMotionMark from './NurioMotionMark';
import { ShieldCheck } from 'lucide-react';

interface AppLoadingScreenProps {
  /**
   * Whether backend/firebase initialization is finished
   */
  isReady: boolean;
  /**
   * Called once the loading screen has completely faded out
   */
  onFinished?: () => void;
  /**
   * Minimum display time in ms to give users time to enjoy the light animation
   */
  minDuration?: number;
}

export default function AppLoadingScreen({
  isReady,
  onFinished,
  minDuration = 1200
}: AppLoadingScreenProps) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isDestroyed, setIsDestroyed] = useState(false);

  // 1. Minimum display timer to allow users to watch the traveling light source cycle
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, minDuration);
    return () => clearTimeout(timer);
  }, [minDuration]);

  // 2. Trigger graceful fade-out when both backend is ready & minimum time has elapsed
  useEffect(() => {
    if (isReady && minTimeElapsed) {
      const fadeTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 150);

      const destroyTimer = setTimeout(() => {
        setIsDestroyed(true);
        if (onFinished) onFinished();
      }, 750); // matches transition duration

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(destroyTimer);
      };
    }
  }, [isReady, minTimeElapsed, onFinished]);

  if (isDestroyed) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-white text-slate-800 transition-all duration-700 ease-out select-none ${
        isFadingOut
          ? 'opacity-0 scale-[1.02] pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      aria-label="應用程式啟動中"
      role="status"
    >
      {/* Top subtle decorative ambient glow */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-rose-50/60 via-rose-50/15 to-transparent pointer-events-none" />

      {/* Top spacer */}
      <div className="w-full h-12" />

      {/* Center Brand & Light Vessel Container */}
      <div className="flex flex-col items-center justify-center -mt-6 px-6 text-center max-w-sm w-full">
        {/* Dynamic Animated Logo Mark with Traveling Light Source */}
        <div className="mb-7 flex justify-center">
          <NurioMotionMark className="w-28 h-28 sm:w-36 sm:h-36" />
        </div>

        {/* Brand Wordmark with Dropping Coral Dot */}
        <div className="flex items-baseline tracking-tight font-black text-slate-900 text-3xl sm:text-4xl">
          <span className="tracking-tight">NURIO</span>
          <span className="text-rose-500 inline-block animate-nurio-dot-drop origin-bottom">.</span>
        </div>

        {/* Subtitle */}
        <p className="mt-2.5 text-xs sm:text-sm font-medium text-slate-500 tracking-wide">
          全臺灣護理學生的實習交流平台
        </p>

        {/* Soft, Minimalist Ambient Loading Status (No progress bar / barcode) */}
        <div className="mt-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50/70 border border-rose-100/80 text-[11px] text-rose-600 font-medium animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
          <span>臨床實習經驗資料同步中...</span>
        </div>
      </div>

      {/* Bottom Secure & Badge Bar */}
      <div className="pb-8 px-6 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/70 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
          <span>專為護生打造的安心交流空間 • 匿名加密保護</span>
        </div>
      </div>
    </div>
  );
}
