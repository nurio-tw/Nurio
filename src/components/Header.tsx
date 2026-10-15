/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, Instructor } from '../types';
import AvatarRenderer from './AvatarRenderer';
import { LogOut, Sparkles, User as UserIcon } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import NurioLogo from './NurioLogo';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  onEditProfile: () => void;
  instructors: Instructor[];
  onSelectInstructor: (instructor: Instructor) => void;
  onRequireLogin?: () => void;
  activeView?: 'instructors' | 'threads';
  onSelectView?: (view: 'instructors' | 'threads') => void;
  onOpenThreadsDrawer?: () => void;
}

export default function Header({ 
  currentUser, 
  onLogout, 
  onEditProfile,
  instructors,
  onSelectInstructor,
  onRequireLogin,
  activeView = 'instructors',
  onSelectView,
  onOpenThreadsDrawer
}: HeaderProps) {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 transition-colors w-full">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-1.5 sm:gap-4">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button 
              onClick={() => onSelectView && onSelectView('instructors')} 
              className="flex items-center group py-1 cursor-pointer bg-transparent border-0 p-0"
            >
              <NurioLogo variant="horizontal" size="sm" />
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <button 
              onClick={() => onSelectView && onSelectView('instructors')}
              className={`transition-colors whitespace-nowrap py-1 cursor-pointer ${
                activeView === 'instructors' 
                  ? 'text-slate-900 border-b-2 border-slate-900 pb-0.5' 
                  : 'hover:text-slate-900'
              }`}
            >
              實習目錄
            </button>
            <button 
              onClick={() => onSelectView && onSelectView('threads')}
              className={`flex items-center gap-1.5 transition-colors whitespace-nowrap py-1 cursor-pointer ${
                activeView === 'threads' 
                  ? 'text-slate-900 border-b-2 border-slate-900 pb-0.5' 
                  : 'hover:text-slate-900 text-slate-600'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-rose-500 inline-block animate-pulse" />
              <span className="hidden sm:inline">護生交流看板</span>
            </button>
            {activeView === 'instructors' && (
              <>
                <a 
                  href="#hot-section" 
                  className="hover:text-slate-900 transition-colors whitespace-nowrap py-1"
                >
                  熱門討論
                </a>
                <a 
                  href="#radar-section" 
                  className="hover:text-slate-900 transition-colors whitespace-nowrap py-1"
                >
                  特色總覽
                </a>
              </>
            )}
          </nav>

          {/* Zone 3: User Actions & Notification */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            {/* Quick Discussion Direct Overlay Trigger */}
            <button
              type="button"
              onClick={onOpenThreadsDrawer}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-all border cursor-pointer shrink-0 ${
                activeView === 'threads'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border-slate-200/90'
              }`}
              title="開啟護生交流看板"
            >
              <span className="text-xs">💬</span>
              <span className="hidden sm:inline text-xs font-bold">交流看板</span>
            </button>

            <PWAInstallButton />

            {currentUser && (
              <NotificationCenter
                currentUser={currentUser}
                instructors={instructors}
                onSelectInstructor={onSelectInstructor}
                onRequireLogin={onRequireLogin}
              />
            )}

            {currentUser ? (
              <div className="flex items-center gap-1 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-200">
                {/* User Info trigger to edit profile */}
                <button
                  type="button"
                  onClick={onEditProfile}
                  title="點擊編輯個人資料與頭像"
                  className="flex items-center gap-1.5 p-1 sm:pl-1.5 sm:pr-2 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer group text-left"
                >
                  <AvatarRenderer
                    config={currentUser.avatarConfig}
                    className="h-7 w-7 rounded-full border border-slate-200 group-hover:border-rose-300 transition-colors shrink-0"
                  />
                  <div className="hidden sm:flex flex-col">
                    <span className="text-xs font-semibold text-slate-900 leading-tight">
                      {currentUser.username}
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight">
                      {currentUser.grade}
                    </span>
                  </div>
                </button>

                {/* Logout Action */}
                <button
                  onClick={onLogout}
                  className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="登出帳號"
                  aria-label="登出帳號"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                臨床實習登入
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
