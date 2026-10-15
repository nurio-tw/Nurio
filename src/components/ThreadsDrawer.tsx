/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { X, ArrowLeft, MessageSquare, Sparkles } from 'lucide-react';
import { User } from '../types';
import ThreadsFeed from './ThreadsFeed';

interface ThreadsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onRequireLogin: () => void;
  onSwitchToFullView?: () => void;
}

export default function ThreadsDrawer({
  isOpen,
  onClose,
  currentUser,
  onRequireLogin,
  onSwitchToFullView
}: ThreadsDrawerProps) {
  // Lock body scroll when overlay is open to give a native mainstream community app feel
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 lg:p-6 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fadeIn"
      onClick={(e) => {
        // Close when clicking directly on the backdrop (on desktop/tablet)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="護生交流看板"
    >
      {/* Centered Overlay Window - Direct coverage without clipping or side drawer fragmentation */}
      <div 
        className="w-full max-w-3xl h-full md:h-[94vh] bg-[#FAFAFA] md:rounded-2xl shadow-2xl flex flex-col border-0 md:border md:border-slate-200/90 overflow-hidden relative animate-overlayUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky App Header */}
        <div className="px-3 sm:px-6 py-3 bg-white border-b border-slate-200/90 flex items-center justify-between shrink-0 shadow-xs z-10">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {/* Primary Return to Directory Button */}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors cursor-pointer group shrink-0"
              title="返回實習目錄"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform text-slate-600" />
              <span className="hidden xs:inline">返回實習目錄</span>
              <span className="xs:hidden">返回</span>
            </button>

            <div className="h-5 w-px bg-slate-200 hidden sm:block shrink-0" />

            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs sm:text-sm shrink-0 shadow-xs">
                💬
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs sm:text-sm md:text-base font-bold text-slate-900 truncate">
                    護生交流看板
                  </h2>
                  <span className="h-2 w-2 rounded-full bg-rose-500 inline-block animate-pulse shrink-0" />
                </div>
                <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                  全臺護理學生臨床經驗與即時討論 · 互相打氣交流
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="關閉交流看板"
              title="關閉交流看板 (ESC)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Feed Container - symmetric padding, no left cutoff */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 scrollbar-thin">
          <ThreadsFeed 
            currentUser={currentUser} 
            onRequireLogin={onRequireLogin} 
            onBackToDirectory={onClose}
          />
        </div>
      </div>
    </div>
  );
}
