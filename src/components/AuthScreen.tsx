/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, AvatarConfig } from '../types';
import AvatarEditor from './AvatarEditor';
import { Key, Mail, User as UserIcon, GraduationCap, ArrowRight, CheckCircle2, RefreshCw, AlertCircle, X, ShieldCheck, ArrowLeft, Send } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { NurioMark } from './NurioLogo';
import { PWAInstallButton } from './PWAInstallButton';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

const DEFAULT_AVATAR: AvatarConfig = {
  skinColor: '#FAD6A5',
  hairType: 'short',
  hairColor: '#1A1A1A',
  expression: 'smile',
  scrubColor: '#EC4899',
  accessory: 'none',
  bgColor: 'from-pink-400 to-rose-500',
};

const NURSING_GRADES = [
  '護四一', '護四二', '護四三', '護四四', '護二一', '護二二', '其他'
];

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Credentials State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [grade, setGrade] = useState('護四三');
  
  // Avatar Editor State
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(DEFAULT_AVATAR);
  
  // Notice & Errors
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Forgot Password States
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'verify' | 'reset'>('request');
  const [verificationCode, setVerificationCode] = useState('');
  const [smtpConfigured, setSmtpConfigured] = useState(true);
  const [forgotCodeInput, setForgotCodeInput] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  // Handler: Direct Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthLoading) return;
    setError(null);
    setSuccessMsg(null);

    if (!email || !password || !username.trim()) {
      setError('請填寫所有欄位！');
      return;
    }
    if (password.length < 6) {
      setError('密碼長度至少需要 6 個字元！');
      return;
    }

    setIsAuthLoading(true);

    try {
      const emailLower = email.trim().toLowerCase();

      // Check if user already exists
      let userExists = false;
      try {
        const userDoc = await getDoc(doc(db, 'users', emailLower));
        if (userDoc.exists()) {
          userExists = true;
        }
      } catch (err) {
        console.warn('Firestore query error, fallback to local storage:', err);
      }

      if (!userExists) {
        const storedUsers = JSON.parse(localStorage.getItem('ntunhs_users') || '[]');
        if (storedUsers.some((u: any) => u.email?.toLowerCase() === emailLower)) {
          userExists = true;
        }
      }

      if (userExists) {
        setError('此 Email 已經註冊過，請直接切換至登入！');
        setIsAuthLoading(false);
        return;
      }

      const newUser: any = {
        id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        email: email.trim(),
        username: username.trim(),
        password,
        grade,
        avatarConfig,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to Firestore
      try {
        await setDoc(doc(db, 'users', emailLower), newUser);
      } catch (err) {
        console.error('Failed to save user to Firestore:', err);
      }

      // Save to local storage for offline/fallback
      try {
        const storedUsers = JSON.parse(localStorage.getItem('ntunhs_users') || '[]');
        storedUsers.push(newUser);
        localStorage.setItem('ntunhs_users', JSON.stringify(storedUsers));
      } catch (err) {
        console.error('Failed to save user to localStorage:', err);
      }

      setSuccessMsg('🎉 註冊成功！歡迎加入 NURIO，正在為您登入...');
      setTimeout(() => {
        onLoginSuccess(newUser);
        setIsAuthLoading(false);
      }, 600);
    } catch (err: any) {
      setError('註冊時發生錯誤：' + err.message);
      setIsAuthLoading(false);
    }
  };

  // Handler for requesting forgot password code via real server API
  const handleSendForgotCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setIsForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);

    try {
      const response = await fetch('/api/forgot-password/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setForgotError(data.error || '發送驗證碼失敗，請稍後再試。');
        setIsForgotLoading(false);
        return;
      }

      setSmtpConfigured(data.smtpConfigured !== false);
      if (data.smtpConfigured === false && data.codePreview) {
        setVerificationCode(data.codePreview);
      } else {
        setVerificationCode('');
      }

      setForgotStep('verify');
      setForgotCodeInput('');
      setForgotSuccess(data.message || '驗證碼發送成功！請至信箱查收！');
    } catch (err: any) {
      setForgotError('與伺服器連線失敗：' + err.message);
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Handler for verifying the typed code via real server API
  const handleVerifyForgotCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);

    try {
      const response = await fetch('/api/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, code: forgotCodeInput })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setForgotError(data.error || '驗證失敗，請確認驗證碼正確無誤。');
        setIsForgotLoading(false);
        return;
      }

      setForgotStep('reset');
      setForgotNewPassword('');
      setForgotSuccess('身分驗證成功！請輸入新密碼。');
    } catch (err: any) {
      setForgotError('與伺服器連線失敗：' + err.message);
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Handler for resetting password via real server API
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotNewPassword.length < 6) {
      setForgotError('密碼長度至少需要 6 個字元！');
      return;
    }
    setIsForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);

    try {
      const response = await fetch('/api/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail,
          code: forgotCodeInput,
          newPassword: forgotNewPassword
        })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setForgotError(data.error || '重設密碼失敗，請確認資料填寫無誤。');
        setIsForgotLoading(false);
        return;
      }

      // Sync local fallback storage with new password
      const emailLower = forgotEmail.trim().toLowerCase();
      const storedUsers = JSON.parse(localStorage.getItem('ntunhs_users') || '[]');
      const localUserIndex = storedUsers.findIndex((u: any) => u.email.toLowerCase() === emailLower);
      if (localUserIndex !== -1) {
        storedUsers[localUserIndex].password = forgotNewPassword;
        localStorage.setItem('ntunhs_users', JSON.stringify(storedUsers));
      }

      setForgotSuccess(data.message || '密碼重設成功！請使用新密碼進行登入。');
      setTimeout(() => {
        setIsForgotPasswordOpen(false);
        setEmail(forgotEmail);
        setPassword(forgotNewPassword);
        setForgotSuccess(null);
      }, 1500);
    } catch (err: any) {
      setForgotError('密碼更新失敗：' + err.message);
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Handler: Standard Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthLoading) return;
    setError(null);
    setSuccessMsg(null);
    setIsAuthLoading(true);

    try {
      if (!email || !password) {
        setError('請填寫所有欄位！');
        setIsAuthLoading(false);
        return;
      }

      let foundUser: any = null;
      try {
        const userDoc = await getDoc(doc(db, 'users', email.trim().toLowerCase()));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.password === password) {
            foundUser = data;
          } else {
            setError('密碼不正確，請重新確認！');
            setIsAuthLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Cloud login fetch error, falling back to local:', err);
      }

      if (!foundUser) {
        const storedUsers = JSON.parse(localStorage.getItem('ntunhs_users') || '[]');
        const localUser = storedUsers.find(
          (u: any) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
        );

        if (localUser) {
          foundUser = localUser;
          try {
            await setDoc(doc(db, 'users', email.trim().toLowerCase()), localUser);
          } catch (err) {
            console.error('Failed to auto-sync local user to cloud:', err);
          }
        }
      }

      if (foundUser) {
        setSuccessMsg('登入成功！正在由雲端同步資料庫...');
        setTimeout(() => {
          onLoginSuccess({
            id: foundUser.id,
            email: foundUser.email,
            username: foundUser.username,
            grade: foundUser.grade,
            avatarConfig: foundUser.avatarConfig,
          });
          setIsAuthLoading(false);
        }, 500);
      } else {
        setError('找不到該帳號或密碼錯誤，請確認輸入無誤，或切換至註冊！');
        setIsAuthLoading(false);
      }
    } catch (err: any) {
      setError('登入時發生錯誤：' + err.message);
      setIsAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-5 sm:py-12 px-3 sm:px-6 overflow-x-hidden">
      <div className="w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 animate-fadeIn">
        
        {/* Left Side: Editorial Brand Panel (Clean White Background & Black Text) */}
        <div className="lg:col-span-5 bg-white text-slate-900 p-5 sm:p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200">
          <div>
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <NurioMark className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" />
                <div className="flex items-baseline tracking-tight font-black text-slate-900 text-xl sm:text-2xl leading-none">
                  <span className="font-black tracking-tight">NURIO</span>
                  <span className="text-rose-500 font-black text-xl sm:text-2xl -ml-0.5 leading-none">.</span>
                </div>
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium tracking-wide mt-1.5 sm:mt-2">
                全臺灣護理學生的實習交流平台
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
              臨床實習經驗<br />評鑑與交流平台
            </h1>
            <p className="mt-2.5 sm:mt-3 text-xs text-slate-600 leading-relaxed">
              專為全臺灣護理學生打造。匯集各科別臨床教師帶教風格、學理考題重點與常態給分心得，協助您從容掌握各實習梯次節奏。
            </p>

            <div className="mt-4 sm:mt-5">
              <PWAInstallButton />
            </div>
          </div>

          <div className="mt-6 sm:mt-auto pt-5 sm:pt-8 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>護理實習經驗資料庫</span>
            <span>NTUNHS & 全臺院校交流</span>
          </div>
        </div>

        {/* Right Side: Tabbed Form */}
        <div className="lg:col-span-7 p-5 sm:p-8 lg:p-10 flex flex-col justify-center">
          
          {/* Header tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => { 
                setActiveTab('login'); 
                setError(null); 
                setSuccessMsg(null); 
              }}
              className={`flex-1 pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'login'
                  ? 'border-black text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              登入帳號
            </button>
            <button
              onClick={() => { 
                setActiveTab('register'); 
                setError(null); 
                setSuccessMsg(null); 
              }}
              className={`flex-1 pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'register'
                  ? 'border-black text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              註冊新帳號
            </button>
          </div>

          {/* Error / Success Notifications */}
          {error && (
            <div className="mb-4 bg-rose-50 text-rose-700 text-xs font-medium p-3 rounded-xl border border-rose-200 flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 bg-emerald-50 text-emerald-800 text-xs font-medium p-3 rounded-xl border border-emerald-200 flex items-start gap-2 animate-fadeIn">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* ================= LOGIN FORM ================= */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
              {/* Email field */}
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">
                  學校或個人 Email 信箱
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.edu.tw"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/15 transition-all text-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    登入密碼
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordOpen(true);
                      setForgotEmail(email);
                      setForgotStep('request');
                      setForgotCodeInput('');
                      setVerificationCode('');
                      setForgotError(null);
                      setForgotSuccess(null);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                  >
                    忘記密碼？
                  </button>
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/15 transition-all text-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-2.5 bg-black hover:bg-neutral-850 active:bg-neutral-900 text-white font-medium rounded-lg text-sm transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isAuthLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>正在驗證登入...</span>
                    </>
                  ) : (
                    <>
                      <span>登入系統</span>
                      <ArrowRight className="h-4 w-4 text-white" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ================= REGISTER FORM (DIRECT REGISTRATION) ================= */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-left animate-fadeIn">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">
                  學校或個人 Email 信箱
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.edu.tw"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/15 transition-all text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">
                  設定登入密碼 <span className="text-slate-400 font-normal">(至少 6 碼)</span>
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/15 transition-all text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1.5">
                    實習暱稱 / 姓名
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="例如：護理小花"
                      className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/15 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1.5">
                    實習年級與班別
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/15 bg-white transition cursor-pointer text-slate-800"
                    >
                      {NURSING_GRADES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Avatar Editor Section */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-800 mb-2">
                  個人實習頭像風格
                </div>
                <AvatarEditor value={avatarConfig} onChange={setAvatarConfig} />
              </div>

              {/* Direct Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-medium rounded-lg text-sm transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isAuthLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-white" />
                      <span>正在建立帳號...</span>
                    </>
                  ) : (
                    <>
                      <span>註冊並開始使用</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>

      {/* Forgot Password Modal Dialog */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 p-2 sm:p-4 overflow-y-auto flex items-start sm:items-center justify-center animate-fadeIn">
          <div className="my-auto bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl p-5 sm:p-6 border border-slate-200 space-y-4 animate-scaleUp text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="h-4.5 w-4.5 text-rose-500" />
                <span>密碼重設與帳號安全驗證</span>
              </h3>
              <button
                onClick={() => setIsForgotPasswordOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
                aria-label="關閉"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {forgotError && (
              <div className="bg-rose-50 text-rose-700 text-xs font-medium p-3 rounded-lg border border-rose-200 flex items-start gap-2 whitespace-pre-line">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="bg-emerald-50 text-emerald-800 text-xs font-medium p-3 rounded-lg border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {/* Step 1: Request code (Email input) */}
            {forgotStep === 'request' && (
              <form onSubmit={handleSendForgotCode} className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  請輸入您註冊時填寫的 Email 信箱，系統將發送 6 位數安全驗證碼至該信箱。
                </p>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">註冊的 Email：</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="student@example.edu.tw"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full text-xs pl-9 pr-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/15 focus:border-rose-500 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="px-4 py-2 text-xs font-medium text-white bg-black hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isForgotLoading ? '發送中...' : '發送驗證碼'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Input Verification Code */}
            {forgotStep === 'verify' && (
              <form onSubmit={handleVerifyForgotCode} className="space-y-4">
                {smtpConfigured ? (
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg text-xs text-slate-600 space-y-1">
                    <div className="font-semibold text-slate-900">驗證碼已送出</div>
                    <p className="leading-relaxed">
                      已寄送 6 位數安全驗證碼至：<strong>{forgotEmail}</strong>
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-lg text-xs text-amber-900 space-y-1.5">
                    <div className="font-semibold text-amber-800">測試環境安全驗證碼</div>
                    <div className="text-center py-2">
                      <span className="font-mono text-base font-bold bg-white px-3 py-1 rounded border border-amber-300 tracking-wider text-amber-800 select-all">
                        {verificationCode}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">輸入 6 位數安全驗證碼：</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    pattern="\d{6}"
                    placeholder="請輸入 6 位數字"
                    value={forgotCodeInput}
                    onChange={(e) => setForgotCodeInput(e.target.value)}
                    className="w-full text-center font-mono text-base font-bold border border-slate-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black bg-white tracking-widest"
                  />
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsForgotLoading(true);
                      setForgotError(null);
                      setForgotSuccess(null);
                      try {
                        const response = await fetch('/api/forgot-password/send', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: forgotEmail })
                        });
                        const data = await response.json();
                        if (data.success) {
                          setSmtpConfigured(data.smtpConfigured !== false);
                          if (data.smtpConfigured === false && data.codePreview) {
                            setVerificationCode(data.codePreview);
                          }
                          setForgotSuccess('已重新發送驗證碼！');
                        } else {
                          setForgotError(data.error || '重發失敗');
                        }
                      } catch (err: any) {
                        setForgotError('重發失敗：' + err.message);
                      } finally {
                        setIsForgotLoading(false);
                      }
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer underline"
                  >
                    沒收到？重新發送
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep('request')}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg"
                    >
                      返回上一步
                    </button>
                    <button
                      type="submit"
                      disabled={isForgotLoading || forgotCodeInput.length !== 6}
                      className="px-4 py-1.5 text-xs font-medium text-white bg-black hover:bg-neutral-800 rounded-lg disabled:opacity-50"
                    >
                      {isForgotLoading ? '驗證中...' : '驗證代碼'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Step 3: Set New Password */}
            {forgotStep === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs text-slate-500">
                  安全驗證成功！請為您的帳號 <strong>{forgotEmail}</strong> 設定新密碼：
                </p>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">新密碼 (至少 6 個字元)：</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="請輸入至少 6 碼新密碼"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="w-full text-xs pl-9 pr-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/15 focus:border-rose-500 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isForgotLoading || forgotNewPassword.length < 6}
                    className="px-4 py-2 text-xs font-medium text-white bg-black hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isForgotLoading ? '儲存中...' : '儲存新密碼並登入'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
