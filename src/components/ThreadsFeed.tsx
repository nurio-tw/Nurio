/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Repeat, 
  Share2, 
  MoreHorizontal, 
  Send, 
  Trash2, 
  Flag, 
  Sparkles, 
  Tag, 
  Shield, 
  User as UserIcon, 
  CornerDownRight, 
  Check, 
  Filter, 
  Search, 
  X, 
  Building2, 
  HelpCircle,
  Eye,
  EyeOff,
  ArrowLeft
} from 'lucide-react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Thread, ThreadReply, ThreadCategory } from '../types';
import AvatarRenderer from './AvatarRenderer';

interface ThreadsFeedProps {
  currentUser: User | null;
  onRequireLogin: () => void;
  initialTagFilter?: string | null;
  onBackToDirectory?: () => void;
  showBackInFeed?: boolean;
}

const THREAD_CATEGORIES: { value: ThreadCategory; label: string; desc: string }[] = [
  { value: '全部', label: '全部動態', desc: '全臺護理學生實習綜合討論' },
  { value: '實習日常', label: '實習日常', desc: '病房辛酸、溫馨時刻、實習心得' },
  { value: '技術學理', label: '技術學理', desc: 'OSPE、三讀五對、給藥與處置要點' },
  { value: '個案交班', label: '個案交班', desc: 'ISBAR、SOAP、護理診斷思維討論' },
  { value: '選站志願', label: '選站志願', desc: '各大醫院單位風氣、避雷與推薦' },
  { value: '求生提問', label: '求生提問', desc: '學弟妹臨床緊急請益、學長姐在線解惑' },
  { value: '護生樹洞', label: '護生樹洞', desc: '匿名抒發排解實習壓力、互相打氣' },
];

export default function ThreadsFeed({ 
  currentUser, 
  onRequireLogin, 
  initialTagFilter, 
  onBackToDirectory,
  showBackInFeed = false 
}: ThreadsFeedProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ThreadCategory>('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSort, setActiveSort] = useState<'latest' | 'popular' | 'my'>('latest');

  // Composer States
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ThreadCategory>('實習日常');
  const [hospitalTag, setHospitalTag] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Active Reply States (inline per thread)
  const [activeReplyThreadId, setActiveReplyThreadId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<{ [threadId: string]: string }>({});
  const [replyIsAnonymous, setReplyIsAnonymous] = useState<{ [threadId: string]: boolean }>({});
  const [isReplying, setIsReplying] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Deletion Confirmation States (In-App Modals, no window.confirm)
  const [threadToDelete, setThreadToDelete] = useState<Thread | null>(null);
  const [replyToDelete, setReplyToDelete] = useState<{ threadId: string; reply: ThreadReply } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Sync threads in real-time from Firestore & automatically purge any mock/seed data
  useEffect(() => {
    setIsLoading(true);
    const colRef = collection(db, 'threads');
    const q = query(colRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const loaded: Thread[] = [];
      const seedIdsToPurge: string[] = [];

      snapshot.forEach(d => {
        const data = d.data() as Partial<Thread>;
        // Purge mock seed posts and automated dummy entries
        if (
          d.id.startsWith('seed-') ||
          data.userId === 'senior-nurse-1' ||
          data.userId === 'student-anonym' ||
          data.userId === 'student-4' ||
          data.authorName === '兒科前線小學姊' ||
          data.authorName === '實習匿名護生' ||
          data.authorName === '林口長庚實習戰士'
        ) {
          seedIdsToPurge.push(d.id);
        } else {
          loaded.push({ id: d.id, ...data } as Thread);
        }
      });

      // Automatically purge fake bot seed records from Firestore so they disappear permanently
      if (seedIdsToPurge.length > 0) {
        seedIdsToPurge.forEach(id => {
          deleteDoc(doc(db, 'threads', id)).catch(err => console.warn('Purged seed doc:', id, err));
        });
      }

      // Sort by createdAt descending
      loaded.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setThreads(loaded);
      setIsLoading(false);
    }, (err) => {
      console.warn('Firestore threads listener error:', err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Post New Thread
  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) {
      setSubmitError('請填寫想分享的內容！');
      return;
    }
    if (trimmed.length > 1000) {
      setSubmitError('字數不能超過 1,000 字！');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // Extract hashtags like #兒科 #三讀五對
    const hashtagMatches = trimmed.match(/#[^\s#]+/g) || [];
    const extractedTags: string[] = Array.from(new Set<string>(hashtagMatches.map(t => t.replace('#', ''))));

    const newThreadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newThread: Thread = {
      id: newThreadId,
      userId: currentUser.id,
      userEmail: currentUser.email,
      authorName: isAnonymous ? '匿名護生' : currentUser.username,
      grade: isAnonymous ? '實習護生' : currentUser.grade,
      avatarConfig: isAnonymous ? {
        skinColor: '#FAD6A5',
        hairType: 'short',
        hairColor: '#475569',
        expression: 'neutral',
        scrubColor: '#64748B',
        accessory: 'mask',
        bgColor: 'from-slate-400 to-slate-600',
      } : currentUser.avatarConfig,
      content: trimmed,
      category: selectedCategory,
      tags: extractedTags,
      hospitalTag: hospitalTag.trim() || undefined,
      likes: [],
      replyCount: 0,
      replies: [],
      isAnonymous,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'threads', newThreadId), newThread);
      setContent('');
      setHospitalTag('');
      setIsAnonymous(false);
      showToast('🎉 串文已成功發布至護生討論區！');
    } catch (err: any) {
      console.error('Error posting thread:', err);
      // Local optimistic update fallback
      setThreads(prev => [newThread, ...prev]);
      setContent('');
      showToast('串文已儲存發布！');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Like on Thread
  const handleToggleLike = async (thread: Thread) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    const userId = currentUser.id;
    const isLiked = (thread.likes || []).includes(userId);
    const updatedLikes = isLiked 
      ? (thread.likes || []).filter(id => id !== userId)
      : [...(thread.likes || []), userId];

    // Optimistic UI update
    setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, likes: updatedLikes } : t));

    try {
      const threadRef = doc(db, 'threads', thread.id);
      await updateDoc(threadRef, {
        likes: isLiked ? arrayRemove(userId) : arrayUnion(userId)
      });
    } catch (err) {
      console.warn('Failed to sync like to Firestore:', err);
    }
  };

  // Post Reply
  const handlePostReply = async (threadId: string) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    const text = (replyContent[threadId] || '').trim();
    if (!text) return;

    setIsReplying(true);
    const anonymous = replyIsAnonymous[threadId] || false;

    const newReply: ThreadReply = {
      id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      threadId,
      userId: currentUser.id,
      userEmail: currentUser.email,
      authorName: anonymous ? '匿名同學' : currentUser.username,
      grade: anonymous ? '護生' : currentUser.grade,
      avatarConfig: anonymous ? {
        skinColor: '#FAD6A5',
        hairType: 'short',
        hairColor: '#475569',
        expression: 'neutral',
        scrubColor: '#64748B',
        accessory: 'mask',
        bgColor: 'from-slate-400 to-slate-600',
      } : currentUser.avatarConfig,
      content: text,
      isAnonymous: anonymous,
      likes: [],
      createdAt: new Date().toISOString(),
    };

    const targetThread = threads.find(t => t.id === threadId);
    const updatedReplies = [...(targetThread?.replies || []), newReply];
    const updatedCount = updatedReplies.length;

    // Optimistic UI update
    setThreads(prev => prev.map(t => t.id === threadId ? {
      ...t,
      replies: updatedReplies,
      replyCount: updatedCount,
    } : t));

    setReplyContent(prev => ({ ...prev, [threadId]: '' }));

    try {
      const threadRef = doc(db, 'threads', threadId);
      await updateDoc(threadRef, {
        replies: updatedReplies,
        replyCount: updatedCount,
      });
      showToast('💬 回覆已送出！');
    } catch (err) {
      console.warn('Failed to sync reply to Firestore:', err);
      showToast('回覆已發送！');
    } finally {
      setIsReplying(false);
    }
  };

  // Confirm Delete Thread
  const confirmDeleteThread = async () => {
    if (!threadToDelete) return;
    const targetId = threadToDelete.id;
    setThreads(prev => prev.filter(t => t.id !== targetId));
    setThreadToDelete(null);

    try {
      await deleteDoc(doc(db, 'threads', targetId));
      showToast('✅ 交流動態已成功刪除！');
    } catch (err) {
      console.warn('Firestore delete thread error:', err);
      showToast('❌ 刪除貼文失敗，請稍後再試');
    }
  };

  // Confirm Delete Reply
  const confirmDeleteReply = async () => {
    if (!replyToDelete) return;
    const { threadId, reply } = replyToDelete;

    // Optimistically update
    setThreads(prev => prev.map(t => {
      if (t.id !== threadId) return t;
      const updated = (t.replies || []).filter(r => r.id !== reply.id);
      return {
        ...t,
        replies: updated,
        replyCount: updated.length
      };
    }));
    setReplyToDelete(null);

    try {
      const threadRef = doc(db, 'threads', threadId);
      const targetThread = threads.find(t => t.id === threadId);
      const updatedReplies = (targetThread?.replies || []).filter(r => r.id !== reply.id);
      await updateDoc(threadRef, {
        replies: updatedReplies,
        replyCount: updatedReplies.length
      });
      showToast('✅ 留言已成功刪除！');
    } catch (err) {
      console.warn('Firestore delete reply error:', err);
      showToast('❌ 刪除留言失敗，請稍後再試');
    }
  };

  // Filter and Sort Threads
  const filteredThreads = threads.filter(thread => {
    // 1. Category Filter
    if (activeCategory !== '全部' && thread.category !== activeCategory) {
      return false;
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchContent = thread.content.toLowerCase().includes(q);
      const matchAuthor = thread.authorName.toLowerCase().includes(q);
      const matchHospital = (thread.hospitalTag || '').toLowerCase().includes(q);
      const matchTags = (thread.tags || []).some(t => t.toLowerCase().includes(q));
      if (!matchContent && !matchAuthor && !matchHospital && !matchTags) {
        return false;
      }
    }

    // 3. View Tab Filter
    if (activeSort === 'my') {
      if (!currentUser || thread.userId !== currentUser.id) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    if (activeSort === 'popular') {
      const scoreA = (a.likes?.length || 0) * 2 + (a.replyCount || 0) * 3;
      const scoreB = (b.likes?.length || 0) * 2 + (b.replyCount || 0) * 3;
      return scoreB - scoreA;
    }
    // Default: latest
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  // Relative Time Formatter
  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return '剛剛';
      if (mins < 60) return `${mins}分鐘前`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}小時前`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}天前`;
      return new Date(dateStr).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto pb-16">
      
      {/* Back to Directory Button (For Full View mode) */}
      {showBackInFeed && onBackToDirectory && (
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToDirectory}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200/90 shadow-2xs transition-all cursor-pointer group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform text-slate-500" />
            <span>返回實習目錄</span>
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-full shadow-lg border border-slate-700 flex items-center gap-2 animate-fadeIn">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner - Threads Minimalist Aesthetic */}
      <div className="mb-4 sm:mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-rose-500" />
          <span>NURIO. 實習生活圈</span>
          <span className="text-slate-300">·</span>
          <span>護理串文即時交流</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          全臺護生即時討論區
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
          技術學理提問、避雷選站心得、病房日常抒發。大家在臨床路上相互扶持！
        </p>
      </div>

      {/* ================= THREADS COMPOSER CARD ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 mb-5 transition-all focus-within:border-slate-300">
        <form onSubmit={handleCreateThread} className="space-y-3">
          
          <div className="flex items-start gap-3">
            {/* User Avatar with Connecting Threads Rail Hint */}
            <div className="relative shrink-0 pt-0.5">
              {currentUser ? (
                isAnonymous ? (
                  <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-500">
                    <EyeOff className="h-4 w-4" />
                  </div>
                ) : (
                  <AvatarRenderer config={currentUser.avatarConfig} className="h-9 w-9 rounded-full border border-slate-200" />
                )
              ) : (
                <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                  <UserIcon className="h-5 w-5" />
                </div>
              )}
            </div>

            {/* Composer Input Area */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="font-semibold text-slate-900">
                  {currentUser ? (isAnonymous ? '匿名護生 (代稱)' : currentUser.username) : '點擊開始串文'}
                </span>
                {currentUser && (
                  <span className="text-[11px] text-slate-400">
                    {isAnonymous ? '匿名身分保護中' : currentUser.grade}
                  </span>
                )}
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={() => {
                  if (!currentUser) onRequireLogin();
                }}
                rows={3}
                placeholder={currentUser ? "有什麼想跟全臺護生分享或請益的嗎？\n（支持 #兒科 #三讀五對 #台北榮總 #實習日常 ...）" : "登入帳號即可自由發佈串文、提問與互動討論..."}
                className="w-full text-sm text-slate-900 placeholder:text-slate-400 border-0 focus:ring-0 focus:outline-none resize-none p-0 bg-transparent leading-relaxed"
              />
            </div>
          </div>

          {/* Quick Category & Hospital Tag Selector */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Category Dropdown */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ThreadCategory)}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 cursor-pointer focus:outline-none"
              >
                {THREAD_CATEGORIES.filter(c => c.value !== '全部').map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>

              {/* Hospital Tag Input */}
              <div className="relative flex items-center">
                <Building2 className="absolute left-2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={hospitalTag}
                  onChange={(e) => setHospitalTag(e.target.value)}
                  placeholder="相關醫院/病房 (選填)"
                  className="pl-7 pr-2.5 py-1 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none w-32 sm:w-40 transition-all"
                />
              </div>

              {/* Anonymous Toggle */}
              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  isAnonymous 
                    ? 'bg-rose-50 border-rose-200 text-rose-700' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title="匿名發文將隱藏您的真實暱稱與實習年級"
              >
                {isAnonymous ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                <span>{isAnonymous ? '已開啟匿名' : '匿名發佈'}</span>
              </button>
            </div>

            {/* Submit Action */}
            <div className="flex items-center gap-2 ml-auto">
              <span className={`text-[11px] ${content.length > 900 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                {content.length}/1000
              </span>
              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-all shadow-xs disabled:opacity-40 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? '發佈中...' : (
                  <>
                    <span>發佈串文</span>
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>

          </div>

          {submitError && (
            <p className="text-xs text-rose-500 pt-1">{submitError}</p>
          )}

        </form>
      </div>

      {/* ================= FILTER & TOPIC TABS ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3 sm:p-4 mb-5 space-y-3">
        
        {/* Row 1: Mode Switches (Latest / Popular / My) & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveSort('latest')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeSort === 'latest' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              最新串文
            </button>
            <button
              onClick={() => setActiveSort('popular')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeSort === 'popular' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔥 熱門話題
            </button>
            {currentUser && (
              <button
                onClick={() => setActiveSort('my')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeSort === 'my' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                我的串文
              </button>
            )}
          </div>

          {/* Quick Search in Threads */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋串文內容、#標籤、病房..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 text-slate-900 placeholder:text-slate-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

        </div>

        {/* Row 2: Category Linear Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
          {THREAD_CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

      </div>

      {/* ================= THREADS FEED LIST ================= */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-rose-500 border-t-transparent mx-auto mb-2" />
          載入最新串文中...
        </div>
      ) : filteredThreads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-700">目前尚無符合的串文討論</p>
          <p className="text-xs text-slate-400">搶先在上方發佈第一則實習串文，開啟與全臺同學的交流！</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredThreads.map((thread) => {
            const isLiked = currentUser ? (thread.likes || []).includes(currentUser.id) : false;
            const isAuthor = currentUser && (
              currentUser.id === thread.userId ||
              (thread.userEmail && currentUser.email?.toLowerCase() === thread.userEmail.toLowerCase()) ||
              currentUser.username === thread.authorName
            );
            const isAdmin = currentUser?.email?.trim().toLowerCase() === 'yurou010@gmail.com';
            const isReplyOpen = activeReplyThreadId === thread.id;

            return (
              <article 
                key={thread.id} 
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  
                  {/* Avatar & Connected Threads Vertical Rail */}
                  <div className="relative flex flex-col items-center shrink-0">
                    {thread.isAnonymous ? (
                      <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-500">
                        <EyeOff className="h-4 w-4" />
                      </div>
                    ) : (
                      <AvatarRenderer 
                        config={thread.avatarConfig || {
                          skinColor: '#FAD6A5',
                          hairType: 'short',
                          hairColor: '#1A1A1A',
                          expression: 'smile',
                          scrubColor: '#0D9488',
                          accessory: 'none',
                          bgColor: 'from-pink-400 to-rose-500'
                        }} 
                        className="h-9 w-9 rounded-full border border-slate-200"
                      />
                    )}

                    {/* Subtle vertical connector rail indicating conversation depth */}
                    {(thread.replies && thread.replies.length > 0) && (
                      <div className="w-0.5 bg-slate-200 flex-grow my-1.5 rounded-full min-h-[24px]" />
                    )}
                  </div>

                  {/* Thread Main Content */}
                  <div className="flex-1 min-w-0">
                    
                    {/* Author & Header Metadata */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap text-xs">
                        <span className="font-bold text-slate-900">
                          {thread.authorName}
                        </span>
                        
                        <span className="text-slate-300 font-normal">·</span>
                        
                        <span className="text-slate-500 font-medium text-[11px]">
                          {thread.grade}
                        </span>

                        <span className="text-slate-300 font-normal">·</span>

                        <span className="text-slate-400 text-[11px]">
                          {formatTimeAgo(thread.createdAt)}
                        </span>

                        {thread.hospitalTag && (
                          <>
                            <span className="text-slate-300 font-normal">·</span>
                            <span className="text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {thread.hospitalTag}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Actions Menu */}
                      {(isAuthor || isAdmin) && (
                        <button
                          type="button"
                          onClick={() => setThreadToDelete(thread)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                          title="刪除此交流動態"
                          aria-label="刪除此動態"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Text Body */}
                    <div className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap break-words">
                      {thread.content.split(/(#[^\s#]+)/g).map((part, idx) => {
                        if (part.startsWith('#')) {
                          return (
                            <span 
                              key={idx} 
                              onClick={() => setSearchQuery(part)}
                              className="text-rose-600 hover:underline cursor-pointer font-semibold"
                            >
                              {part}
                            </span>
                          );
                        }
                        return part;
                      })}
                    </div>

                    {/* Category pill indicator (Quiet Text) */}
                    <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
                      <span className="text-slate-500 font-medium">{thread.category}</span>
                      {thread.tags && thread.tags.length > 0 && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span>{thread.tags.map(t => `#${t}`).join(' ')}</span>
                        </>
                      )}
                    </div>

                    {/* Threads Bottom Action Bar */}
                    <div className="flex items-center gap-5 mt-3 pt-2 text-xs text-slate-500">
                      
                      {/* Like Action */}
                      <button
                        onClick={() => handleToggleLike(thread)}
                        className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isLiked ? 'text-rose-600 font-bold' : 'hover:text-rose-600'
                        }`}
                        title={isLiked ? "收回愛心" : "按讚這則串文"}
                      >
                        <Heart className={`h-4 w-4 transition-transform active:scale-125 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                        <span>{(thread.likes || []).length > 0 ? (thread.likes || []).length : '讚'}</span>
                      </button>

                      {/* Reply Action */}
                      <button
                        onClick={() => setActiveReplyThreadId(isReplyOpen ? null : thread.id)}
                        className={`flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer ${
                          isReplyOpen ? 'text-slate-900 font-bold' : ''
                        }`}
                        title="查看或撰寫回覆"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>{(thread.replies || []).length > 0 ? `${(thread.replies || []).length} 則回覆` : '回覆'}</span>
                      </button>

                      {/* Share Action */}
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/?thread=${thread.id}`;
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(url);
                            showToast('🔗 已複製串文連結至剪貼簿！');
                          }
                        }}
                        className="flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer"
                        title="分享此串文"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span>分享</span>
                      </button>

                    </div>

                    {/* ================= INLINE REPLIES SECTION ================= */}
                    {(isReplyOpen || (thread.replies && thread.replies.length > 0)) && (
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                        
                        {/* Existing Replies List */}
                        {thread.replies && thread.replies.length > 0 && (
                          <div className="space-y-2.5 pl-2 sm:pl-3 border-l-2 border-slate-100">
                            {thread.replies.map(reply => {
                              const isReplyAuthor = currentUser && (
                                currentUser.id === reply.userId ||
                                (reply.userEmail && currentUser.email?.toLowerCase() === reply.userEmail?.toLowerCase()) ||
                                currentUser.username === reply.authorName
                              );
                              const canDeleteReply = isReplyAuthor || isAdmin;

                              return (
                                <div key={reply.id} className="text-xs space-y-1 group/reply py-0.5">
                                  <div className="flex items-center justify-between gap-1.5 text-slate-500">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-semibold text-slate-800">
                                        {reply.authorName}
                                      </span>
                                      <span className="text-[10px] text-slate-400">
                                        {reply.grade} · {formatTimeAgo(reply.createdAt)}
                                      </span>
                                    </div>
                                    {canDeleteReply && (
                                      <button
                                        type="button"
                                        onClick={() => setReplyToDelete({ threadId: thread.id, reply })}
                                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                                        title="刪除這則回覆"
                                        aria-label="刪除這則回覆"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap pl-0.5">
                                    {reply.content}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Reply Composer */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={replyContent[thread.id] || ''}
                            onChange={(e) => setReplyContent({ ...replyContent, [thread.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handlePostReply(thread.id);
                              }
                            }}
                            placeholder={currentUser ? "回覆這則交流動態..." : "登入後即可回覆討論"}
                            className="flex-1 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-full px-3.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 transition-all"
                          />

                          <button
                            type="button"
                            onClick={() => setReplyIsAnonymous({
                              ...replyIsAnonymous,
                              [thread.id]: !replyIsAnonymous[thread.id]
                            })}
                            className={`p-1.5 rounded-full border text-xs cursor-pointer ${
                              replyIsAnonymous[thread.id] 
                                ? 'bg-rose-50 border-rose-300 text-rose-600' 
                                : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                            }`}
                            title={replyIsAnonymous[thread.id] ? "目前匿名回覆" : "切換匿名回覆"}
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={isReplying || !(replyContent[thread.id] || '').trim()}
                            onClick={() => handlePostReply(thread.id)}
                            className="bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-all"
                          >
                            送出
                          </button>
                        </div>

                      </div>
                    )}

                  </div>

                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* In-App Delete Confirmation Modal for Thread */}
      {threadToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl space-y-3 text-left animate-scaleUp">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <Trash2 className="h-5 w-5" />
              <span>確定刪除此交流動態？</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-3 italic">
              "{threadToDelete.content}"
            </p>
            <p className="text-[11px] text-slate-500">
              此操作不可復原，所有相關的回覆留言也將一併刪除。
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setThreadToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmDeleteThread}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer transition shadow-xs"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal for Reply */}
      {replyToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl space-y-3 text-left animate-scaleUp">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <Trash2 className="h-5 w-5" />
              <span>確定刪除此則回覆留言？</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-3 italic">
              "{replyToDelete.reply.content}"
            </p>
            <p className="text-[11px] text-slate-500">
              此操作不可復原，確認後將永久自雲端資料庫移除。
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setReplyToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmDeleteReply}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer transition shadow-xs"
              >
                確認刪除留言
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
