/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, setDoc, doc, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import Header from './components/Header';
import Footer from './components/Footer';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import InstructorCard from './components/InstructorCard';
import InstructorDetail from './components/InstructorDetail';
import AddInstructorModal from './components/AddInstructorModal';
import AuthScreen from './components/AuthScreen';
import EditProfileModal from './components/EditProfileModal';
import AppLoadingScreen from './components/AppLoadingScreen';
import ThreadsFeed from './components/ThreadsFeed';
import ThreadsDrawer from './components/ThreadsDrawer';
import { INITIAL_INSTRUCTORS } from './data';
import { Instructor, Review, User } from './types';
import { 
  Search, SlidersHorizontal, Plus, BookOpen, AlertCircle, Sparkles, Filter, X,
  ChevronRight, ChevronLeft
} from 'lucide-react';

const CATEGORY_TABS: { value: string; label: string }[] = [
  { value: '全部', label: '全部老師' },
  { value: '基護', label: '基護實習' },
  { value: '內外一', label: '內外一' },
  { value: '內外二', label: '內外二' },
  { value: '產科', label: '產科實習' },
  { value: '兒科', label: '兒科實習' },
  { value: '精神科', label: '精神科實習' },
  { value: '社區', label: '社區實習' },
];

export default function App() {
  // 0. User Session State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ntunhs_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load active user', e);
      }
    }
    return null;
  });

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Startup Loading Screen state
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [showLoadingPreview, setShowLoadingPreview] = useState(false);

  // Sync active user to local storage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ntunhs_active_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('ntunhs_active_user');
    }
  }, [currentUser]);

  // Background migration/sync: upload locally registered accounts to Firestore so they can log in from other devices
  useEffect(() => {
    const storedUsersStr = localStorage.getItem('ntunhs_users');
    if (storedUsersStr) {
      try {
        const storedUsers = JSON.parse(storedUsersStr);
        if (Array.isArray(storedUsers)) {
          storedUsers.forEach(async (u: any) => {
            if (u && u.email && u.password) {
              const emailLower = u.email.trim().toLowerCase();
              try {
                await setDoc(doc(db, 'users', emailLower), {
                  id: u.id || `user-${Date.now()}`,
                  email: u.email,
                  password: u.password,
                  username: u.username || '匿名學生',
                  grade: u.grade || '護理系',
                  avatarConfig: u.avatarConfig || {
                    gender: 'female',
                    style: 'short',
                    color: 'black',
                    skin: 'natural',
                    glass: 'none',
                    clotheColor: 'pink',
                    bgColor: 'pink'
                  }
                }, { merge: true });
              } catch (err) {
                console.error(`Background cloud migration failed for ${emailLower}:`, err);
              }
            }
          });
        }
      } catch (e) {
        console.error('Failed to parse local users for cloud sync:', e);
      }
    }
  }, []);

  // 1. Data State (Synced in real-time from Firestore)
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);

  useEffect(() => {
    const colRef = collection(db, 'instructors');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      if (snapshot.empty) {
        const batch = writeBatch(db);
        INITIAL_INSTRUCTORS.forEach(inst => {
          const docRef = doc(db, 'instructors', inst.id);
          batch.set(docRef, inst);
        });
        batch.commit()
          .then(() => {
            console.log('Seeded Firestore with INITIAL_INSTRUCTORS');
          })
          .catch(err => {
            console.error('Error seeding Firestore:', err);
          });
      } else {
        const loaded: Instructor[] = [];
        snapshot.forEach(docSnap => {
          loaded.push(docSnap.data() as Instructor);
        });
        
        loaded.sort((a, b) => {
          const dateA = a.createdAt || '';
          const dateB = b.createdAt || '';
          return dateB.localeCompare(dateA);
        });

        setInstructors(loaded);
      }
      setIsFirebaseLoading(false);
    }, (error) => {
      console.error('Firestore listener error:', error);
      setIsFirebaseLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Query & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [sortBy, setSortBy] = useState<'rating' | 'reviewsCount' | 'name'>('rating');

  // 3. Modals & Detail States
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [mainView, setMainView] = useState<'instructors' | 'threads'>('instructors');
  const [isThreadsDrawerOpen, setIsThreadsDrawerOpen] = useState(false);

  // Floating community status bar collapse state (collapsed to right edge)
  const [isCommunityFabCollapsed, setIsCommunityFabCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('ntunhs_fab_collapsed') === 'true';
  });

  const toggleCommunityFabCollapse = (collapsed: boolean) => {
    setIsCommunityFabCollapsed(collapsed);
    localStorage.setItem('ntunhs_fab_collapsed', String(collapsed));
  };

  // Sync selectedInstructor details when reviews are updated
  useEffect(() => {
    if (selectedInstructor) {
      const updated = instructors.find(i => i.id === selectedInstructor.id);
      if (updated) {
        setSelectedInstructor(updated);
      }
    }
  }, [instructors]);

  // 4. Handlers
  const handleAddReview = (instructorId: string, newReview: Review) => {
    const inst = instructors.find(i => i.id === instructorId);
    if (!inst) return;

    const updatedReviews = [newReview, ...inst.reviews];
    const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
    const newAvgRating = totalRating / updatedReviews.length;

    const updatedInstructor = {
      ...inst,
      reviews: updatedReviews,
      rating: Number(newAvgRating.toFixed(2))
    };

    setDoc(doc(db, 'instructors', instructorId), updatedInstructor)
      .catch(err => alert('新增評價到雲端資料庫失敗：' + err.message));
  };

  const handleUpdateReview = (instructorId: string, reviewId: string, updatedReview: Review) => {
    const inst = instructors.find(i => i.id === instructorId);
    if (!inst) return;

    const updatedReviews = inst.reviews.map(r => r.id === reviewId ? updatedReview : r);
    const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
    const newAvgRating = updatedReviews.length > 0 ? totalRating / updatedReviews.length : 5.0;

    const updatedInstructor = {
      ...inst,
      reviews: updatedReviews,
      rating: Number(newAvgRating.toFixed(2))
    };

    setDoc(doc(db, 'instructors', instructorId), updatedInstructor)
      .catch(err => alert('更新評價到雲端資料庫失敗：' + err.message));
  };

  const handleDeleteReview = (instructorId: string, reviewId: string) => {
    const inst = instructors.find(i => i.id === instructorId);
    if (!inst) return;

    const updatedReviews = inst.reviews.filter(r => r.id !== reviewId);
    const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
    const newAvgRating = updatedReviews.length > 0 ? totalRating / updatedReviews.length : 5.0;

    const updatedInstructor = {
      ...inst,
      reviews: updatedReviews,
      rating: Number(newAvgRating.toFixed(2))
    };

    setDoc(doc(db, 'instructors', instructorId), updatedInstructor)
      .catch(err => alert('刪除評價失敗：' + err.message));
  };

  const handleAddInstructor = (
    newInstData: Omit<Instructor, 'id' | 'rating' | 'reviews' | 'createdAt'>,
    initialReview?: Omit<Review, 'id' | 'createdAt'>
  ) => {
    const instId = `inst-${Date.now()}`;
    const reviewsList: Review[] = [];
    
    if (initialReview) {
      reviewsList.push({
        ...initialReview,
        id: `rev-${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0]
      });
    }

    const avgRating = reviewsList.length > 0 ? reviewsList[0].rating : 5.0;

    const newInstructor: Instructor = {
      ...newInstData,
      id: instId,
      creatorId: currentUser?.id,
      rating: avgRating,
      reviews: reviewsList,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setDoc(doc(db, 'instructors', instId), newInstructor)
      .then(() => {
        try {
          const myCreated = JSON.parse(localStorage.getItem('my_created_instructors') || '[]');
          myCreated.push(instId);
          localStorage.setItem('my_created_instructors', JSON.stringify(myCreated));
        } catch (e) {
          console.error('Failed to save to my_created_instructors list', e);
        }
      })
      .catch(err => alert('新增老師到雲端資料庫失敗：' + err.message));
  };

  const handleDeleteInstructor = (instructorId: string) => {
    deleteDoc(doc(db, 'instructors', instructorId))
      .then(() => {
        if (selectedInstructor?.id === instructorId) {
          setSelectedInstructor(null);
        }
      })
      .catch(err => alert('刪除老師資料失敗：' + err.message));
  };

  // 5. Filtering and Sorting logic
  const filteredAndSortedInstructors = instructors
    .filter(inst => {
      const matchesCategory = selectedCategory === '全部' || inst.category === selectedCategory;
      const matchesSearch = 
        inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        inst.background.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'reviewsCount') {
        return b.reviews.length - a.reviews.length;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'zh-Hant');
      }
      return 0;
    });


  if (!currentUser) {
    return (
      <>
        {(!isInitialLoadDone || showLoadingPreview) && (
          <AppLoadingScreen 
            isReady={!isFirebaseLoading}
            onFinished={() => {
              setIsInitialLoadDone(true);
              setShowLoadingPreview(false);
            }}
          />
        )}
        <AuthScreen onLoginSuccess={setCurrentUser} />
      </>
    );
  }

  return (
    <>
      {(!isInitialLoadDone || showLoadingPreview) && (
        <AppLoadingScreen 
          isReady={!isFirebaseLoading}
          onFinished={() => {
            setIsInitialLoadDone(true);
            setShowLoadingPreview(false);
          }}
        />
      )}
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans text-slate-800 antialiased overflow-x-hidden w-full max-w-full">
      
      {/* App Header */}
      <Header 
        currentUser={currentUser} 
        onLogout={() => setCurrentUser(null)} 
        onEditProfile={() => setIsEditProfileOpen(true)} 
        instructors={instructors}
        onSelectInstructor={(inst) => {
          setSelectedInstructor(inst);
          setMainView('instructors');
        }}
        onRequireLogin={() => {
          setCurrentUser(null);
          setSelectedInstructor(null);
        }}
        activeView={isThreadsDrawerOpen ? 'threads' : mainView}
        onSelectView={(v) => {
          if (v === 'threads') {
            setIsThreadsDrawerOpen(true);
          } else {
            setIsThreadsDrawerOpen(false);
            setMainView('instructors');
          }
          setSelectedInstructor(null);
        }}
        onOpenThreadsDrawer={() => setIsThreadsDrawerOpen(true)}
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 overflow-x-hidden">
        {mainView === 'threads' ? (
          <ThreadsFeed 
            currentUser={currentUser} 
            onRequireLogin={() => {
              setCurrentUser(null);
            }} 
            onBackToDirectory={() => {
              setMainView('instructors');
              setIsThreadsDrawerOpen(false);
            }}
            showBackInFeed={true}
          />
        ) : (
          <>
        {/* Command & Exploration Control Center */}
        <section className="mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-7 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  全臺灣護理學生的實習交流平台
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                  快速查詢各專科實習指導風格、學理考核偏好、常態給分與學長姐心得回饋
                </p>
              </div>

              {/* Primary Action Button */}
              <div className="shrink-0 flex items-center gap-2.5 w-full sm:w-auto">
                <button 
                  onClick={() => {
                    if (currentUser?.email === 'guest@ntunhs.edu.tw' || currentUser?.id?.startsWith('guest-')) {
                      alert('請先登入！');
                      setCurrentUser(null);
                    } else {
                      setIsAddOpen(true);
                    }
                  }}
                  className="w-full sm:w-auto justify-center bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-medium text-xs sm:text-sm px-4 py-2.5 min-h-[42px] rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> 推薦 / 新增實習老師
                </button>
              </div>
            </div>

            {/* Integrated Search & Filter Controls */}
            <div className="pt-5 space-y-4">
              
              {/* Row 1: Search and Sort */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="搜尋老師姓名、實習醫院（例如：台北榮總、台大醫院、松德）或關鍵字標籤..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-sm text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-lg focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15 transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                      aria-label="清除搜尋"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-xs text-slate-500">排序：</span>
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="text-xs font-medium text-slate-800 bg-transparent focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="rating">綜合評分最高</option>
                      <option value="reviewsCount">評價數量最多</option>
                      <option value="name">姓名筆劃音序</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Row 2: Segmented Category Tabs (Linear style) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {CATEGORY_TABS.map((tab) => {
                  const isActive = selectedCategory === tab.value;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setSelectedCategory(tab.value)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-slate-900 text-white shadow-xs' 
                          : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>


            </div>
          </div>
        </section>

        {/* Dynamic Analytics Radar Dashboard */}
        <AnalyticsDashboard 
          instructors={instructors} 
          selectedCategory={selectedCategory}
          onSelectInstructor={(inst) => setSelectedInstructor(inst)} 
        />

        {/* Hot / Popular Instructors Section */}
        {(() => {
          const categoryPool = selectedCategory === '全部'
            ? instructors
            : instructors.filter(i => i.category === selectedCategory);
          const hotList = categoryPool
            .filter(i => i.reviews.length > 0)
            .sort((a, b) => b.reviews.length - a.reviews.length)
            .slice(0, 3);

          if (hotList.length === 0) return null;

          return (
            <section id="hot-section" className="mb-10">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    🔥 熱門討論老師 {selectedCategory !== '全部' && `(${selectedCategory})`}
                  </span>
                  <span className="text-xs text-slate-400 font-normal">學長姐近期討論度最高</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {hotList.map((instructor) => (
                  <InstructorCard 
                    key={`hot-${instructor.id}`}
                    instructor={instructor}
                    onSelect={() => setSelectedInstructor(instructor)}
                    isHot={true}
                  />
                ))}
              </div>
            </section>
          );
        })()}

        {/* Teachers Catalog Section */}
        <section id="instructors-grid" className="space-y-4">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">實習目錄</h2>
              <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full tabular-nums">
                {filteredAndSortedInstructors.length} 位
              </span>
            </div>
          </div>

          {/* Teachers Grid Output */}
          {isFirebaseLoading ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
              <div className="h-8 w-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <h3 className="text-sm font-semibold text-slate-700">正在同步雲端資料庫...</h3>
              <p className="text-xs text-slate-400 mt-1">
                即時讀取最新臨床教師評鑑與回饋
              </p>
            </div>
          ) : filteredAndSortedInstructors.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
              <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-700">查無符合條件的實習老師</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                建議嘗試縮減關鍵字，或切換其他實習科別。若老師尚未建檔，歡迎推薦加入。
              </p>
              <button 
                onClick={() => {
                  if (currentUser?.email === 'guest@ntunhs.edu.tw' || currentUser?.id?.startsWith('guest-')) {
                    alert('請先登入！');
                    setCurrentUser(null);
                  } else {
                    setIsAddOpen(true);
                  }
                }}
                className="mt-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> 推薦加入 {selectedCategory !== '全部' ? selectedCategory : ''} 老師
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAndSortedInstructors.map((instructor) => (
                <InstructorCard 
                  key={instructor.id}
                  instructor={instructor}
                  onSelect={() => setSelectedInstructor(instructor)}
                />
              ))}
            </div>
          )}

        </section>
        </>
        )}

      </main>

      {/* Right-Edge Docked Collapsible Community Status Tab (Non-intrusive, shrinks to the right) */}
      {!isThreadsDrawerOpen && mainView === 'instructors' && (
        <div className="fixed right-0 bottom-24 z-40 flex items-center select-none transition-all duration-300">
          {isCommunityFabCollapsed ? (
            /* Shrunk / Collapsed state: Compact docked tab sticking cleanly to the right border */
            <div className="flex items-center group animate-fadeIn">
              <button
                type="button"
                onClick={() => setIsThreadsDrawerOpen(true)}
                className="bg-slate-900/90 hover:bg-slate-950 text-white shadow-lg hover:shadow-xl border-y border-l border-slate-700/80 rounded-l-xl pl-3 pr-2.5 py-2.5 flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-xs group-hover:pl-3.5"
                title="開啟護生交流看板"
              >
                <div className="relative flex items-center justify-center">
                  <span className="text-sm">💬</span>
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                </div>
                <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                  交流看板
                </span>
              </button>

              {/* Expand Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCommunityFabCollapse(false);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-y border-l border-slate-700/80 px-1 py-3 transition-colors cursor-pointer"
                title="向左展開交流看板標籤"
                aria-label="向左展開"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
            </div>
          ) : (
            /* Expanded state: Full label with one-click right-shrink button */
            <div className="flex items-center shadow-xl rounded-l-2xl border-y border-l border-slate-700/80 bg-slate-900/95 hover:bg-slate-950 backdrop-blur-xs text-white transition-all overflow-hidden animate-fadeIn">
              <button
                type="button"
                onClick={() => setIsThreadsDrawerOpen(true)}
                className="pl-3.5 pr-2 py-2.5 flex items-center gap-2 text-xs font-bold hover:text-rose-200 transition-colors cursor-pointer"
                title="開啟護生交流看板"
              >
                <div className="h-5 w-5 rounded-full bg-rose-500 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                  💬
                </div>
                <span>護生交流看板</span>
              </button>

              {/* Shrink / Collapse to Right Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCommunityFabCollapse(true);
                }}
                className="px-2 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 border-l border-slate-700/80 transition-colors cursor-pointer flex items-center justify-center group"
                title="往右縮小至邊緣狀態欄（不擋路）"
                aria-label="往右縮小至側邊"
              >
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mainstream Community Direct Overlay Window */}
      <ThreadsDrawer
        isOpen={isThreadsDrawerOpen}
        onClose={() => setIsThreadsDrawerOpen(false)}
        currentUser={currentUser}
        onRequireLogin={() => {
          setCurrentUser(null);
        }}
        onSwitchToFullView={() => {
          setIsThreadsDrawerOpen(false);
          setMainView('threads');
          setSelectedInstructor(null);
        }}
      />

      {/* App Footer */}
      <Footer onReplaySplash={() => setShowLoadingPreview(true)} />

      {/* Immersive Instructor Detail Modal */}
      {selectedInstructor && (
        <InstructorDetail 
          instructor={selectedInstructor}
          onClose={() => setSelectedInstructor(null)}
          onAddReview={handleAddReview}
          onUpdateReview={handleUpdateReview}
          onDeleteReview={handleDeleteReview}
          onDeleteInstructor={handleDeleteInstructor}
          currentUser={currentUser}
          onRequireLogin={() => {
            setCurrentUser(null);
            setSelectedInstructor(null);
          }}
        />
      )}

      {/* Propose New Instructor Modal */}
      {isAddOpen && (
        <AddInstructorModal 
          onClose={() => setIsAddOpen(false)}
          onAddInstructor={handleAddInstructor}
          currentUser={currentUser}
        />
      )}

      {/* Edit Profile & Avatar Customizer Modal */}
      {isEditProfileOpen && (
        <EditProfileModal 
          user={currentUser}
          onClose={() => setIsEditProfileOpen(false)}
          onSave={(updatedUser) => {
            setCurrentUser(updatedUser);
            setIsEditProfileOpen(false);
          }}
        />
      )}

    </div>
    </>
  );
}
