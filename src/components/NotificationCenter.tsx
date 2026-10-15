import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../lib/firebase';
import { 
  collection, onSnapshot, query, orderBy, doc, setDoc, updateDoc, deleteDoc, getDocs, getDoc 
} from 'firebase/firestore';
import { Instructor, Review, User, Report, Notification } from '../types';
import { 
  Bell, ChevronDown, ShieldAlert, History, MessageSquare, Users, Megaphone, 
  Mail, Scale, X, Send, Eye, CheckCircle2, AlertCircle, Trash2, Shield, Search,
  Archive, FileText, Check, AlertTriangle, Layers, RefreshCw
} from 'lucide-react';
import AvatarRenderer from './AvatarRenderer';

interface NotificationCenterProps {
  currentUser: User | null;
  instructors: Instructor[];
  onSelectInstructor: (instructor: Instructor) => void;
  onRequireLogin?: () => void;
}

export default function NotificationCenter({ 
  currentUser, 
  instructors, 
  onSelectInstructor,
  onRequireLogin 
}: NotificationCenterProps) {
  // Dropdown / Popover states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isBellPopoverOpen, setIsBellPopoverOpen] = useState(false);
  
  // Modal states for different menu items
  const [activeModal, setActiveModal] = useState<'reports_history' | 'my_reviews' | 'admin_moderation' | 'user_list' | 'send_message' | 'manage_messages' | null>(null);

  // Firestore Sync States
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [allSystemNotifications, setAllSystemNotifications] = useState<Notification[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  
  // Search / Inputs states
  const [userSearch, setUserSearch] = useState('');
  const [targetUserMsg, setTargetUserMsg] = useState(''); // Target user email or "all"
  const [msgTitle, setMsgTitle] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const [msgType, setMsgType] = useState<'announcement' | 'personal'>('personal');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [manageFilter, setManageFilter] = useState<'all' | 'announcement' | 'personal'>('all');

  const isAdmin = currentUser?.email?.trim().toLowerCase() === 'yurou010@gmail.com';

  // 1. Listen to relevant Notifications in real-time
  useEffect(() => {
    if (!currentUser) return;

    const colRef = collection(db, 'notifications');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedForBell: Notification[] = [];
      const loadedAll: Notification[] = [];

      snapshot.forEach(docSnap => {
        const data = docSnap.data() as Notification;
        loadedAll.push(data);
        
        // Bell filtering:
        // System Announcements: for all users (userId === 'all' or type === 'announcement')
        // Personal Messages: only addressed to the current user (by user id or email)
        const isAnnouncement = data.userId === 'all' || data.type === 'announcement';
        const isPersonalToMe = data.userId === currentUser.id || 
          (Boolean(data.userId) && Boolean(currentUser.email) && data.userId.trim().toLowerCase() === currentUser.email.trim().toLowerCase());
        
        if (isAnnouncement || isPersonalToMe) {
          loadedForBell.push(data);
        }
      });
      
      setNotifications(loadedForBell);
      setAllSystemNotifications(loadedAll);
    }, (err) => {
      console.error('Failed to subscribe notifications:', err);
    });

    return () => unsubscribe();
  }, [currentUser, isAdmin]);

  // 2. Listen to Reports
  useEffect(() => {
    if (!currentUser) return;

    const colRef = collection(db, 'reports');
    const q = query(colRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: Report[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as Report;
        if (isAdmin || data.reporterUserId === currentUser.id) {
          loaded.push(data);
        }
      });
      setReports(loaded);
    }, (err) => {
      console.error('Failed to subscribe reports:', err);
    });

    return () => unsubscribe();
  }, [currentUser, isAdmin]);

  // Load all users on-demand for Admin
  const loadAllUsers = async () => {
    if (!isAdmin) return;
    setIsUsersLoading(true);
    try {
      const querySnap = await getDocs(collection(db, 'users'));
      const list: any[] = [];
      querySnap.forEach(d => {
        list.push({ id: d.id, ...d.data() });
      });

      // Also merge with any users in local storage backup to ensure none are missed
      try {
        const storedUsers = JSON.parse(localStorage.getItem('ntunhs_users') || '[]');
        if (Array.isArray(storedUsers)) {
          storedUsers.forEach((lu: any) => {
            if (lu?.email && !list.some(u => u.email?.trim().toLowerCase() === lu.email.trim().toLowerCase())) {
              list.push({ id: lu.id || `local-${lu.email}`, ...lu });
            }
          });
        }
      } catch (e) {
        console.error('Failed reading local users fallback:', e);
      }

      // Sort: Admin first, then newest registered first
      list.sort((a, b) => {
        if (a.email?.toLowerCase() === 'yurou010@gmail.com') return -1;
        if (b.email?.toLowerCase() === 'yurou010@gmail.com') return 1;
        const dateA = a.createdAt || '';
        const dateB = b.createdAt || '';
        return dateB.localeCompare(dateA);
      });

      setAllUsers(list);
    } catch (err) {
      console.error('Failed to fetch user list:', err);
    } finally {
      setIsUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeModal === 'user_list') {
      loadAllUsers();
    }
  }, [activeModal]);

  // User storage key helper
  const userStorageKey = currentUser?.email ? `notifs_${currentUser.email.trim().toLowerCase()}` : 'notifs_guest';

  // Read notifications
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(`${userStorageKey}_read`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const legacy = localStorage.getItem('read_notification_ids');
    return legacy ? JSON.parse(legacy) : [];
  });

  // Cleared (deleted from view) notifications
  const [clearedNotificationIds, setClearedNotificationIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(`${userStorageKey}_cleared`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const legacy = localStorage.getItem('cleared_notification_ids');
    return legacy ? JSON.parse(legacy) : [];
  });

  // Sync user's read/cleared preferences with Firestore so logging in from another device/browser doesn't reset it
  useEffect(() => {
    if (!currentUser?.email) return;
    const userEmailLower = currentUser.email.trim().toLowerCase();
    
    const fetchCloudUserPreferences = async () => {
      try {
        const uDoc = await getDoc(doc(db, 'users', userEmailLower));
        if (uDoc.exists()) {
          const uData = uDoc.data();
          if (Array.isArray(uData.readNotificationIds) && uData.readNotificationIds.length > 0) {
            setReadNotificationIds(prev => {
              const merged = Array.from(new Set([...prev, ...uData.readNotificationIds]));
              localStorage.setItem(`${userStorageKey}_read`, JSON.stringify(merged));
              return merged;
            });
          }
          if (Array.isArray(uData.clearedNotificationIds) && uData.clearedNotificationIds.length > 0) {
            setClearedNotificationIds(prev => {
              const merged = Array.from(new Set([...prev, ...uData.clearedNotificationIds]));
              localStorage.setItem(`${userStorageKey}_cleared`, JSON.stringify(merged));
              return merged;
            });
          }
        }
      } catch (e) {
        console.error('Could not load user notification preferences from Firestore', e);
      }
    };
    fetchCloudUserPreferences();
  }, [currentUser?.email]);

  const persistReadState = (newReadIds: string[]) => {
    setReadNotificationIds(newReadIds);
    localStorage.setItem(`${userStorageKey}_read`, JSON.stringify(newReadIds));
    if (currentUser?.email) {
      updateDoc(doc(db, 'users', currentUser.email.trim().toLowerCase()), {
        readNotificationIds: newReadIds
      }).catch(err => console.error('Failed to sync read status to Firestore:', err));
    }
  };

  const persistClearedState = (newClearedIds: string[]) => {
    setClearedNotificationIds(newClearedIds);
    localStorage.setItem(`${userStorageKey}_cleared`, JSON.stringify(newClearedIds));
    if (currentUser?.email) {
      updateDoc(doc(db, 'users', currentUser.email.trim().toLowerCase()), {
        clearedNotificationIds: newClearedIds
      }).catch(err => console.error('Failed to sync cleared status to Firestore:', err));
    }
  };

  // Track currently selected notification for the zoomed full detail modal
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Filter out cleared notifications
  const visibleNotifications = notifications.filter(n => !clearedNotificationIds.includes(n.id));

  const unreadCount = visibleNotifications.filter(n => !readNotificationIds.includes(n.id)).length;

  const markAllAsRead = () => {
    const allIds = visibleNotifications.map(n => n.id);
    const updated = Array.from(new Set([...readNotificationIds, ...allIds]));
    persistReadState(updated);
  };

  const handleNotificationClick = (n: Notification) => {
    if (!readNotificationIds.includes(n.id)) {
      const updated = Array.from(new Set([...readNotificationIds, n.id]));
      persistReadState(updated);
    }
    // Set selected notification to trigger the detailed modal
    setSelectedNotification(n);
  };

  // Permanently delete a notification from Cloud Firestore (Available to Admin)
  const handlePermanentDeleteNotification = async (notifId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('確定要從雲端資料庫永久刪除此通知嗎？\n刪除後全系統將永久下架此訊息，不再顯示給任何人。')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'notifications', notifId));
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      setAllSystemNotifications(prev => prev.filter(n => n.id !== notifId));
      if (selectedNotification?.id === notifId) {
        setSelectedNotification(null);
      }
      alert('已成功從雲端資料庫永久刪除該訊息！');
    } catch (err: any) {
      alert('刪除失敗：' + err.message);
    }
  };

  const clearNotification = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (isAdmin) {
      const choice = window.confirm(
        '【管理員訊息處置】\n點擊「確定」：從雲端資料庫「永久刪除」此訊息（所有學生均不再看見）。\n點擊「取消」：僅在個人本次畫面隱藏。'
      );
      if (choice) {
        try {
          await deleteDoc(doc(db, 'notifications', id));
          setNotifications(prev => prev.filter(n => n.id !== id));
          setAllSystemNotifications(prev => prev.filter(n => n.id !== id));
          return;
        } catch (err: any) {
          alert('雲端刪除失敗：' + err.message);
        }
      }
    }
    const updated = Array.from(new Set([...clearedNotificationIds, id]));
    persistClearedState(updated);
  };

  const clearAllNotifications = async () => {
    const allIds = visibleNotifications.map(n => n.id);
    if (allIds.length === 0) return;
    
    if (isAdmin) {
      const action = window.confirm(
        '【管理員清空操作】\n點擊「確定」：從雲端資料庫「永久清空刪除」目前顯示的訊息。\n點擊「取消」：僅在個人畫面隱藏。'
      );
      if (action) {
        try {
          for (const id of allIds) {
            await deleteDoc(doc(db, 'notifications', id));
          }
          setNotifications(prev => prev.filter(n => !allIds.includes(n.id)));
          setAllSystemNotifications(prev => prev.filter(n => !allIds.includes(n.id)));
          alert('已從雲端資料庫永久清除所有通知！');
          return;
        } catch (err: any) {
          alert('清除失敗：' + err.message);
        }
      }
    }

    if (window.confirm('確定要隱藏目前所有顯示的通知訊息嗎？')) {
      const updated = Array.from(new Set([...clearedNotificationIds, ...allIds]));
      persistClearedState(updated);
    }
  };

  // Regular user's discussions: Search in-memory instructors and find reviews they authored
  const myReviews: { instructor: Instructor; review: Review }[] = [];
  if (currentUser) {
    instructors.forEach(inst => {
      if (inst.reviews) {
        inst.reviews.forEach(rev => {
          if (rev.userId === currentUser.id || rev.author === currentUser.username) {
            myReviews.push({ instructor: inst, review: rev });
          }
        });
      }
    });
  }

  // Admin states for moderation layouts and archival
  const [adminViewLayout, setAdminViewLayout] = useState<'card' | 'list'>('list');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [pendingReportAction, setPendingReportAction] = useState<{
    report: Report;
    actionType: 'resolved' | 'dismissed' | 'delete';
  } | null>(null);
  const [actionReason, setActionReason] = useState<string>('');

  // Admin: Toggle archive state of a report in Firestore
  const handleToggleArchiveReport = async (report: Report) => {
    try {
      const newArchived = !report.isArchived;
      await updateDoc(doc(db, 'reports', report.id), {
        isArchived: newArchived
      });
      alert(newArchived ? '📁 已成功將該案件封存！' : '📁 已成功解除此案件的封存。');
    } catch (err: any) {
      alert('切換封存狀態失敗：' + err.message);
    }
  };

  // Admin: Submit resolved action with a mandatory reason
  const submitReportAction = async () => {
    if (!pendingReportAction) return;
    if (!actionReason.trim()) {
      alert('請填寫審查處理原因，這是必填欄位！');
      return;
    }

    const { report, actionType } = pendingReportAction;
    try {
      const reasonText = actionReason.trim();
      const nowStr = new Date().toISOString();

      if (actionType === 'dismissed') {
        // 1. Update report status and save mandatory reason
        await updateDoc(doc(db, 'reports', report.id), { 
          status: 'dismissed',
          resolutionReason: reasonText,
          resolvedAt: nowStr
        });
        
        // 2. If dismissed (keep review), reset reports array and isUnderReview on the review itself
        const inst = instructors.find(i => i.id === report.instructorId);
        if (inst) {
          const rev = inst.reviews.find(r => r.id === report.targetReviewId);
          if (rev) {
            const updatedReview = {
              ...rev,
              reports: [],
              isUnderReview: false
            };
            const updatedReviews = inst.reviews.map(r => r.id === rev.id ? updatedReview : r);
            await setDoc(doc(db, 'instructors', inst.id), {
              ...inst,
              reviews: updatedReviews
            });
          }
        }
        alert('已成功駁回此檢舉（保持公開），並已同步記錄審查理由。');
      } else if (actionType === 'resolved') {
        // 1. Update report status and save reason
        await updateDoc(doc(db, 'reports', report.id), { 
          status: 'resolved',
          resolutionReason: reasonText,
          resolvedAt: nowStr
        });

        // 2. Hide the review from general users (set isUnderReview to true)
        const inst = instructors.find(i => i.id === report.instructorId);
        if (inst) {
          const rev = inst.reviews.find(r => r.id === report.targetReviewId);
          if (rev) {
            const updatedReview = {
              ...rev,
              isUnderReview: true
            };
            const updatedReviews = inst.reviews.map(r => r.id === rev.id ? updatedReview : r);
            await setDoc(doc(db, 'instructors', inst.id), {
              ...inst,
              reviews: updatedReviews
            });
          }
        }
        alert('已確認該評價違規並直接下架，且同步記錄審查理由。');
      } else if (actionType === 'delete') {
        // 1. Delete review permanently
        const inst = instructors.find(i => i.id === report.instructorId);
        if (inst) {
          const updatedReviews = inst.reviews.filter(r => r.id !== report.targetReviewId);
          const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
          const newAvgRating = updatedReviews.length > 0 ? totalRating / updatedReviews.length : 5.0;

          await setDoc(doc(db, 'instructors', inst.id), {
            ...inst,
            reviews: updatedReviews,
            rating: Number(newAvgRating.toFixed(2))
          });
        }
        
        // 2. Update report status and reason
        await updateDoc(doc(db, 'reports', report.id), { 
          status: 'resolved',
          resolutionReason: `【永久刪除評論】審查原因：${reasonText}`,
          resolvedAt: nowStr
        });
        alert('已成功永久刪除此評價，並完成審查存檔！');
      }

      setPendingReportAction(null);
      setActionReason('');
    } catch (err: any) {
      alert('處理檢舉失敗：' + err.message);
    }
  };

  // Admin: Send direct message / announcements
  const handleSendMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgTitle.trim() || !msgContent.trim() || isSendingMsg) return;

    setIsSendingMsg(true);
    try {
      const nId = `notif-${Date.now()}`;
      
      // Determine receiver (if email input, check if users match, or set the receiver)
      let finalTarget = targetUserMsg.trim().toLowerCase();
      if (msgType === 'announcement') {
        finalTarget = 'all';
      }

      await setDoc(doc(db, 'notifications', nId), {
        id: nId,
        userId: finalTarget,
        title: msgTitle.trim(),
        content: msgContent.trim(),
        type: msgType,
        createdAt: new Date().toISOString()
      });

      alert(msgType === 'announcement' ? '系統公告發布成功！所有註冊學生皆可看見。' : `自訂訊息成功傳送給：${finalTarget}`);
      setMsgTitle('');
      setMsgContent('');
      setActiveModal(null);
    } catch (err: any) {
      alert('傳送失敗：' + err.message);
    } finally {
      setIsSendingMsg(false);
    }
  };

  // Open particular instructor details from myReviews list
  const handleJumpToReview = (inst: Instructor) => {
    onSelectInstructor(inst);
    setActiveModal(null);
  };

  if (!currentUser) return null;

  return (
    <div className="flex items-center gap-2 relative">
      
      {/* 1. Notification Bell Icon Button with Dropdown Popover */}
      <div className="relative">
        <button
          onClick={() => {
            setIsBellPopoverOpen(!isBellPopoverOpen);
            setIsDropdownOpen(false);
          }}
          className={`p-2 rounded-lg border transition-colors relative flex items-center justify-center cursor-pointer ${
            isBellPopoverOpen 
              ? 'bg-slate-100 border-slate-300 text-slate-900' 
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-xs'
          }`}
          title="通知與公告"
          aria-label="通知與公告"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full border-2 border-white tabular-nums">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Bell Popover Panel */}
        {isBellPopoverOpen && (
          <div className="absolute left-0 md:left-auto md:right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden animate-fadeIn max-h-[420px] flex flex-col text-left">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between gap-2 bg-white">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5 text-slate-500" />
                <span>訊息通知與公告</span>
              </span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-medium hover:underline cursor-pointer"
                    title="全部標記為已讀"
                  >
                    全部已讀
                  </button>
                )}
                {visibleNotifications.length > 0 && (
                  <button 
                    onClick={clearAllNotifications}
                    className="text-[11px] text-slate-400 hover:text-rose-600 font-medium hover:underline cursor-pointer"
                    title="清除所有顯示的通知"
                  >
                    全部清除
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto p-2 space-y-1.5 flex-grow">
              {visibleNotifications.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  目前無未讀通知或公告
                </div>
              ) : (
                visibleNotifications.map((notif) => {
                  const isRead = readNotificationIds.includes(notif.id);
                  return (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-2.5 rounded-lg border transition text-left cursor-pointer relative group ${
                        isRead 
                          ? 'bg-white border-slate-100 text-slate-500 opacity-80 hover:bg-slate-50' 
                          : 'bg-rose-50/20 border-rose-100/70 hover:bg-rose-50/40 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px]">
                        {notif.type === 'announcement' ? (
                          <span className="bg-amber-50 text-amber-700 font-medium px-1.5 py-0.5 rounded border border-amber-200/60">
                            系統公告
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-700 font-medium px-1.5 py-0.5 rounded">
                            個人訊息
                          </span>
                        )}
                        <span className="text-slate-400 font-mono tabular-nums">
                          {notif.createdAt ? notif.createdAt.slice(0, 10) : ''}
                        </span>
                        {!isRead && (
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                        )}
                        
                        {/* Clear single message icon/button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearNotification(notif.id);
                          }}
                          className="ml-auto text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                          title="清除此訊息"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-900 truncate pr-4">{notif.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.content}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="p-2 border-t border-slate-100 text-center bg-slate-50">
              <button 
                onClick={() => setIsBellPopoverOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
              >
                收起通知欄
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Dropdown Menu Trigger Next to Bell */}
      <div className="relative">
        <button
          onClick={() => {
            setIsDropdownOpen(!isDropdownOpen);
            setIsBellPopoverOpen(false);
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer shadow-xs ${
            isDropdownOpen 
              ? 'bg-slate-100 border-slate-300 text-slate-900' 
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
          }`}
        >
          {isAdmin ? (
            <span className="flex items-center gap-1 text-slate-900 font-semibold">
              <Shield className="h-3.5 w-3.5 text-rose-500" />
              <span>管理中心</span>
            </span>
          ) : (
            <span>個人記錄</span>
          )}
          <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Items */}
        {isDropdownOpen && (
          <div className="absolute left-0 md:left-auto md:right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-50 py-1 overflow-hidden animate-fadeIn text-left">
            {!isAdmin ? (
              <>
                <button
                  onClick={() => {
                    setActiveModal('reports_history');
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-xs text-slate-700 hover:bg-rose-50/50 hover:text-pink-600 transition flex items-center gap-2 cursor-pointer font-bold"
                >
                  <History className="h-4 w-4 text-pink-400" />
                  <span>檢舉歷史與進度</span>
                </button>
                <button
                  onClick={() => {
                    setActiveModal('my_reviews');
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-xs text-slate-700 hover:bg-rose-50/50 hover:text-pink-600 transition flex items-center gap-2 cursor-pointer font-bold"
                >
                  <MessageSquare className="h-4 w-4 text-pink-400" />
                  <span>我發表過的討論 ({myReviews.length})</span>
                </button>
              </>
            ) : (
              <>
                <div className="px-4 py-1.5 text-[9px] font-black tracking-wider text-rose-400 uppercase bg-rose-50/30">
                  🛡️ 系統最高權限
                </div>
                <button
                  onClick={() => {
                    setActiveModal('admin_moderation');
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-xs text-slate-700 hover:bg-rose-50/50 hover:text-rose-600 transition flex items-center gap-2 cursor-pointer font-bold"
                >
                  <Scale className="h-4 w-4 text-rose-500" />
                  <span>案件審查中心 ({reports.filter(r => r.status === 'pending').length})</span>
                </button>
                <button
                  onClick={() => {
                    setActiveModal('user_list');
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-xs text-slate-700 hover:bg-rose-50/50 hover:text-rose-600 transition flex items-center gap-2 cursor-pointer font-bold"
                >
                  <Users className="h-4 w-4 text-rose-500" />
                  <span>查詢所有註冊用戶</span>
                </button>
                <button
                  onClick={() => {
                    setActiveModal('send_message');
                    setIsDropdownOpen(false);
                    setMsgType('announcement');
                    setTargetUserMsg('all');
                  }}
                  className="w-full px-4 py-2.5 text-xs text-slate-700 hover:bg-rose-50/50 hover:text-rose-600 transition flex items-center gap-2 cursor-pointer font-bold"
                >
                  <Megaphone className="h-4 w-4 text-rose-500" />
                  <span>傳送訊息與發布公告</span>
                </button>
                <button
                  onClick={() => {
                    setActiveModal('manage_messages');
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-xs text-slate-700 hover:bg-rose-50/50 hover:text-rose-600 transition flex items-center gap-2 cursor-pointer font-bold"
                >
                  <Layers className="h-4 w-4 text-rose-500" />
                  <span>管理系統公告與歷史訊息 ({allSystemNotifications.length})</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ======================= TABS MODAL OVERLAYS (PORTAL TO BODY TO PREVENT HEADER CLIPPING) ======================= */}
      {typeof document !== 'undefined' && createPortal(
        <>
          {/* 1. Report History Modal (For Regular Users) */}
          {activeModal === 'reports_history' && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] p-2 sm:p-4 overflow-y-auto flex items-start sm:items-center justify-center animate-fadeIn">
          <div className="my-auto bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl p-4 sm:p-6 border border-rose-100 flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[85vh] animate-scaleUp space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <History className="h-5 w-5 text-pink-500" />
                <span>檢舉進度與歷史查詢</span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-grow pr-1">
              {reports.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">
                  您目前沒有發起任何違規檢舉紀錄。
                </div>
              ) : (
                reports.map((rep) => (
                  <div key={rep.id} className="bg-slate-50 border border-gray-150 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded">
                        編號: {rep.id}
                      </span>
                      {rep.status === 'pending' ? (
                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 animate-pulse" /> 審查中
                        </span>
                      ) : rep.status === 'resolved' ? (
                        <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> 檢舉屬實已處置
                        </span>
                      ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded">
                          駁回檢舉
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-700 space-y-1.5">
                      <div>
                        <strong className="text-slate-600">被檢舉教師：</strong>
                        <span className="font-semibold text-slate-800">{rep.instructorName}</span>
                      </div>
                      <div>
                        <strong className="text-slate-600">檢舉違規理由：</strong>
                        <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded text-[11px] font-bold">
                          {rep.reason}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-gray-100 mt-1 italic text-gray-600">
                        "{rep.targetReviewContent}"
                      </div>
                    </div>

                    <div className="text-[9px] text-gray-400 flex justify-between items-center">
                      <span>送出時間: {rep.createdAt ? rep.createdAt.replace('T', ' ').slice(0, 19) : ''}</span>
                      {rep.status === 'resolved' && <span className="text-green-600 font-bold">處置結果：該留言已強制下架審查</span>}
                      {rep.status === 'dismissed' && <span className="text-slate-500 font-bold">處置結果：案件駁回，予以保留</span>}
                    </div>

                    {rep.resolutionReason && (
                      <div className="bg-white p-3 rounded-xl border border-rose-100 text-xs text-slate-750 mt-2 text-left">
                        <span className="font-extrabold text-pink-600 flex items-center gap-1 mb-1">
                          <Shield className="h-3.5 w-3.5 text-pink-500" /> 管理員審核原因與說明：
                        </span>
                        <p className="font-semibold text-slate-600 pl-4 border-l-2 border-pink-200 whitespace-pre-wrap leading-relaxed">
                          {rep.resolutionReason}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button 
                onClick={() => setActiveModal(null)}
                className="bg-gray-800 hover:bg-gray-950 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. My Discussions Modal (For Regular Users) */}
      {activeModal === 'my_reviews' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] p-2 sm:p-4 overflow-y-auto flex items-start sm:items-center justify-center animate-fadeIn">
          <div className="my-auto bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl p-4 sm:p-6 border border-rose-100 flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[85vh] animate-scaleUp space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-pink-500" />
                <span>我發表過的討論與評價 ({myReviews.length})</span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-grow pr-1">
              {myReviews.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">
                  您目前尚未留下任何實習評價喔！
                </div>
              ) : (
                myReviews.map(({ instructor, review }) => (
                  <div key={review.id} className="bg-slate-50 border border-gray-150 rounded-2xl p-4 space-y-2 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-black text-pink-500">
                        {instructor.category} ➜ {instructor.name} ({instructor.hospital})
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {review.createdAt}
                      </span>
                    </div>
                    
                    <p className="text-xs text-slate-700 whitespace-pre-wrap line-clamp-3 bg-white p-2.5 rounded-xl border border-gray-100">
                      {review.content}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-100/50">
                      <div className="text-[10px] text-gray-400 flex items-center gap-2">
                        <span>⭐ {review.rating} 顆星</span>
                        <span>👍 ({review.likes?.length || 0}) 推薦</span>
                        {review.reports && review.reports.length > 0 && (
                          <span className="text-red-500 font-bold">⚠️ 被檢舉 {review.reports.length} 次</span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleJumpToReview(instructor)}
                        className="text-[10px] text-pink-600 font-bold hover:underline cursor-pointer flex items-center gap-1 bg-pink-50 hover:bg-pink-100/60 px-2 py-1 rounded"
                      >
                        <Eye className="h-3 w-3" /> 查看該教師頁面
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button 
                onClick={() => setActiveModal(null)}
                className="bg-gray-800 hover:bg-gray-950 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Admin Moderation Center Modal (For Admin) */}
      {activeModal === 'admin_moderation' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] p-2 sm:p-4 overflow-y-auto flex items-start sm:items-center justify-center animate-fadeIn">
          <div className="my-auto bg-white rounded-2xl sm:rounded-3xl max-w-5xl w-full shadow-2xl p-4 sm:p-6 border border-rose-100 flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[88vh] animate-scaleUp space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Scale className="h-5 w-5 text-rose-500" />
                <span>違規檢舉案件審查中心</span>
                <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                  未處置: {reports.filter(r => r.status === 'pending').length} 案 / 總計: {reports.length} 案
                </span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-slate-50 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Layout Toggles and Filter Panel */}
            <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-150 text-xs">
              <div className="flex items-center gap-2 text-left">
                <span className="font-extrabold text-slate-700">版面選擇：</span>
                <div className="inline-flex bg-white border border-gray-200 p-0.5 rounded-xl shadow-xs">
                  <button
                    onClick={() => setAdminViewLayout('list')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      adminViewLayout === 'list'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    明細條列式
                  </button>
                  <button
                    onClick={() => setAdminViewLayout('card')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      adminViewLayout === 'card'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    卡片排列式
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                    showArchived
                      ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                      : 'bg-white border-gray-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Archive className="h-3.5 w-3.5" />
                  {showArchived ? '📂 已顯示封存案 (點擊隱藏)' : '📥 僅顯示未封存案 (點擊包含封存)'}
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="overflow-y-auto flex-grow pr-1">
              {reports.filter(rep => showArchived ? true : !rep.isArchived).length === 0 ? (
                <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-gray-200 space-y-2">
                  <p className="text-gray-400 text-xs">
                    {showArchived ? '目前沒有任何案件！系統安全和諧。' : '目前沒有待審查的未封存案件。點擊「顯示封存案」可查閱舊案！'}
                  </p>
                </div>
              ) : adminViewLayout === 'list' ? (
                /* 📋 Elegant and Dense List Layout */
                <div className="border border-gray-150 rounded-2xl overflow-hidden bg-white shadow-sm text-xs">
                  <div className="grid grid-cols-12 bg-slate-105 border-b border-gray-200 px-4 py-2.5 font-bold text-slate-700 text-[11px] uppercase tracking-wider text-left">
                    <div className="col-span-3">案件資訊 / 檢舉者</div>
                    <div className="col-span-5">被檢舉評論與原因</div>
                    <div className="col-span-2">審核理由 & 結果</div>
                    <div className="col-span-2 text-right">執行操作 / 封存</div>
                  </div>
                  
                  <div className="divide-y divide-gray-150">
                    {reports
                      .filter(rep => showArchived ? true : !rep.isArchived)
                      .map((rep) => (
                        <div 
                          key={rep.id} 
                          className={`grid grid-cols-12 px-4 py-3.5 items-start gap-4 transition hover:bg-slate-50/50 text-left ${
                            rep.isArchived ? 'bg-slate-100/50 text-slate-400' : ''
                          }`}
                        >
                          {/* Column 1: Info */}
                          <div className="col-span-3 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] bg-red-100 text-red-700 font-extrabold px-1.5 py-0.5 rounded">
                                {rep.id}
                              </span>
                              {rep.status === 'pending' ? (
                                <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 font-bold px-1.5 py-0.5 rounded animate-pulse">
                                  待處置
                                </span>
                              ) : rep.status === 'resolved' ? (
                                <span className="text-[9px] bg-green-50 text-green-700 border border-green-200 font-bold px-1.5 py-0.5 rounded">
                                  已下架違規
                                </span>
                              ) : (
                                <span className="text-[9px] bg-gray-100 text-gray-500 font-bold px-1.5 py-0.5 rounded">
                                  已駁回
                                </span>
                              )}
                              {rep.isArchived && (
                                <span className="text-[9px] bg-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded">
                                  已封存
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium truncate" title={rep.reporterEmail}>
                            檢舉者：{rep.reporterEmail}
                          </p>
                          <p className="text-[9px] text-gray-400">
                            時間: {rep.createdAt ? rep.createdAt.replace('T', ' ').slice(0, 16) : ''}
                          </p>
                        </div>

                        {/* Column 2: Content */}
                        <div className="col-span-5 space-y-1.5">
                          <p className="text-[11px] font-extrabold text-slate-700">
                            教師：<span className="text-pink-600">{rep.instructorName}</span>
                          </p>
                          <div className="text-[10px] text-rose-600 font-bold bg-rose-50/85 px-2 py-1 rounded border border-rose-100 inline-block">
                            檢舉理由：{rep.reason}
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-gray-100 font-medium text-slate-600 italic whitespace-pre-wrap max-h-24 overflow-y-auto">
                            "{rep.targetReviewContent}"
                          </div>
                        </div>

                        {/* Column 3: Decision & Reason */}
                        <div className="col-span-2 space-y-1">
                          {rep.status === 'pending' ? (
                            <span className="text-gray-400 italic font-medium text-[11px]">等待管理員審查</span>
                          ) : (
                            <div className="space-y-1 text-left">
                              <span className={`text-[10px] font-bold ${rep.status === 'resolved' ? 'text-red-600' : 'text-slate-600'}`}>
                                {rep.status === 'resolved' ? '✅ 確認違規已下架' : '❌ 檢舉駁回已保留'}
                              </span>
                              {rep.resolutionReason && (
                                <p className="text-[10px] text-slate-500 bg-slate-50/50 p-1.5 rounded border border-slate-100 font-medium whitespace-pre-wrap leading-relaxed line-clamp-3" title={rep.resolutionReason}>
                                  理由: {rep.resolutionReason}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Column 4: Actions */}
                        <div className="col-span-2 space-y-2 text-right">
                          {rep.status === 'pending' ? (
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => setPendingReportAction({ report: rep, actionType: 'dismissed' })}
                                className="w-full text-center px-2 py-1 bg-white hover:bg-slate-105 border border-slate-300 text-slate-700 font-bold rounded-lg transition text-[10px] cursor-pointer"
                              >
                                駁回檢舉
                              </button>
                              <button
                                onClick={() => setPendingReportAction({ report: rep, actionType: 'resolved' })}
                                className="w-full text-center px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition text-[10px] cursor-pointer"
                              >
                                確認違規
                              </button>
                              <button
                                onClick={() => setPendingReportAction({ report: rep, actionType: 'delete' })}
                                className="w-full text-center px-2 py-1 bg-red-655 hover:bg-red-755 text-white font-bold rounded-lg transition text-[10px] cursor-pointer flex items-center justify-center gap-0.5"
                              >
                                <Trash2 className="h-2.5 w-2.5" /> 永久刪除
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleToggleArchiveReport(rep)}
                                className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition cursor-pointer flex items-center gap-1 ${
                                  rep.isArchived 
                                    ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                                }`}
                              >
                                <Archive className="h-3 w-3" />
                                {rep.isArchived ? '解除封存' : '選擇封存'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* 🎴 Card Layout (Original style but enhanced with archival options and reasons) */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reports
                    .filter(rep => showArchived ? true : !rep.isArchived)
                    .map((rep) => (
                      <div 
                        key={rep.id} 
                        className={`bg-slate-50 border border-gray-150 rounded-2xl p-4 space-y-3 text-left transition hover:shadow-xs relative ${
                          rep.isArchived ? 'opacity-70 bg-slate-105' : ''
                        }`}
                      >
                        {/* Card Archival Tag */}
                        {rep.isArchived && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-200 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                            <Archive className="h-2.5 w-2.5" /> 已封存
                          </div>
                        )}

                        <div className="flex items-center justify-between flex-wrap gap-2 pr-12">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded">
                              案件：{rep.id}
                            </span>
                            <span className="text-[10px] bg-gray-200 text-slate-600 font-medium px-2 py-0.5 rounded truncate max-w-[120px]" title={rep.reporterEmail}>
                              檢舉者：{rep.reporterEmail}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {rep.status === 'pending' ? (
                              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-bold px-2 py-0.5 rounded animate-pulse">
                                待處置
                              </span>
                            ) : rep.status === 'resolved' ? (
                              <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 font-bold px-2 py-0.5 rounded">
                                已下架違規
                              </span>
                            ) : (
                              <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded">
                                已駁回
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="bg-red-50/30 p-3 rounded-xl border border-red-150 text-xs space-y-1.5">
                          <div>
                            <strong>老師：</strong> {rep.instructorName}
                          </div>
                          <div>
                            <strong>檢舉原因：</strong> <span className="text-red-600 font-bold bg-white px-2 py-0.5 rounded border border-red-200">{rep.reason}</span>
                          </div>
                          <div>
                            <strong>被檢舉言論原內容：</strong>
                            <p className="bg-white p-2.5 rounded-lg border border-gray-200 italic font-medium text-gray-700 mt-1 whitespace-pre-wrap max-h-24 overflow-y-auto">
                              "{rep.targetReviewContent}"
                            </p>
                          </div>
                        </div>

                        {/* Display Resolution Reason in Card */}
                        {rep.status !== 'pending' && rep.resolutionReason && (
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs text-slate-750">
                            <span className="font-extrabold text-pink-600 flex items-center gap-1 mb-1 text-[11px]">
                              <Check className="h-3.5 w-3.5 text-pink-500" /> 審核原因與說明：
                            </span>
                            <p className="font-semibold text-slate-600 pl-3 border-l border-pink-200 whitespace-pre-wrap leading-relaxed">
                              {rep.resolutionReason}
                            </p>
                          </div>
                        )}

                        {/* Card action buttons */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-105 flex-wrap">
                          {rep.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => setPendingReportAction({ report: rep, actionType: 'dismissed' })}
                                className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                              >
                                駁回檢舉
                              </button>
                              <button
                                onClick={() => setPendingReportAction({ report: rep, actionType: 'resolved' })}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition cursor-pointer"
                              >
                                確認違規
                              </button>
                              <button
                                onClick={() => setPendingReportAction({ report: rep, actionType: 'delete' })}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition cursor-pointer flex items-center gap-1"
                              >
                                <Trash2 className="h-3 w-3" /> 永久刪除
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleToggleArchiveReport(rep)}
                              className={`px-3 py-1.5 text-xs font-black rounded-xl transition border cursor-pointer flex items-center gap-1.5 ${
                                rep.isArchived 
                                  ? 'bg-amber-50 text-amber-600 border-amber-200' 
                                  : 'bg-white text-slate-600 border-gray-300 hover:bg-slate-50'
                              }`}
                            >
                              <Archive className="h-3.5 w-3.5" />
                              {rep.isArchived ? '解除封存案件' : '封存此案件'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button 
                onClick={() => setActiveModal(null)}
                className="bg-gray-800 hover:bg-gray-950 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Reason Input Modal overlay */}
      {pendingReportAction && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-[10000] p-2 sm:p-4 overflow-y-auto flex items-start sm:items-center justify-center animate-fadeIn">
          <div className="my-auto bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-rose-100 p-5 sm:p-6 space-y-4 text-left animate-scaleUp">
            <div className="flex items-center gap-2 border-b border-rose-50 pb-3">
              <ShieldAlert className="h-5 w-5 text-pink-600" />
              <h4 className="text-sm font-black text-slate-800">
                {pendingReportAction.actionType === 'dismissed' && '⚠️ 確定要駁回此檢舉嗎？'}
                {pendingReportAction.actionType === 'resolved' && '🛡️ 確定此評價違規並強制下架嗎？'}
                {pendingReportAction.actionType === 'delete' && '🚨 確定要永久刪除此評論嗎？'}
              </h4>
            </div>
            
            <div className="text-xs text-slate-500 space-y-1">
              <p>被檢舉人/內容：</p>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic text-slate-600 line-clamp-2">
                "{pendingReportAction.report.targetReviewContent}"
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 block">
                請輸入審查處置原因（必填）：
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="請詳細敘述您判定此案件的理據（例如：不實謾罵、洩漏人身資訊、態度極度挑釁、或者屬客觀合理之學習心得、予以保留等...）"
                className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 h-24 resize-none"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-1 text-xs">
              <button
                onClick={() => {
                  setPendingReportAction(null);
                  setActionReason('');
                }}
                className="px-4 py-2 font-bold text-gray-500 hover:text-gray-750 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={submitReportAction}
                className="px-4 py-2 font-black text-white bg-pink-500 hover:bg-pink-600 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
              >
                確認送出
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. User Database Query Modal (For Admin) */}
      {activeModal === 'user_list' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] p-2 sm:p-4 overflow-y-auto flex items-start sm:items-center justify-center animate-fadeIn">
          <div className="my-auto bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full shadow-2xl border border-rose-100 flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[88vh] overflow-hidden animate-scaleUp text-left">
            {/* Modal Header */}
            <div className="shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <Users className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-800 leading-tight">
                    註冊學生與用戶數據總表
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    平台目前共註冊 {allUsers.length} 位用戶
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)} 
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                aria-label="關閉"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search filter & Quick Bar */}
            <div className="shrink-0 px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/70 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="輸入學生姓名、年級科系或 Email 進行快速查詢..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/15 focus:border-rose-400 transition"
                />
                {userSearch && (
                  <button 
                    onClick={() => setUserSearch('')} 
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-md cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable User Grid */}
            <div className="overflow-y-auto flex-1 min-h-0 p-4 sm:p-6 space-y-3">
              {isUsersLoading ? (
                <div className="text-center py-14 text-gray-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-rose-500" />
                  <span>正在載入所有註冊用戶清單...</span>
                </div>
              ) : allUsers.filter(u => 
                  (u.username || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                  (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                  (u.grade || '').toLowerCase().includes(userSearch.toLowerCase())
                ).length === 0 ? (
                <div className="text-center py-14 text-gray-400 text-xs">
                  {userSearch ? `查無符合「${userSearch}」的用戶紀錄` : '目前尚無註冊用戶'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {allUsers
                    .filter(u => 
                      (u.username || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                      (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                      (u.grade || '').toLowerCase().includes(userSearch.toLowerCase())
                    )
                    .map((usr) => {
                      const isThisAdmin = usr.email?.toLowerCase() === 'yurou010@gmail.com';
                      return (
                        <div key={usr.id} className="bg-slate-50 border border-slate-200/80 hover:border-rose-200 rounded-2xl p-4 flex items-start gap-3 transition shadow-2xs">
                          {usr.avatarConfig && (
                            <AvatarRenderer config={usr.avatarConfig} className="h-12 w-12 rounded-xl border border-rose-100 bg-white shrink-0 shadow-2xs" />
                          )}
                          <div className="text-left space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {usr.username || '匿名學生'}
                              </span>
                              {isThisAdmin ? (
                                <span className="text-[9px] bg-rose-500 text-white font-extrabold px-1.5 py-0.5 rounded shadow-2xs">
                                  👑 最高管理員
                                </span>
                              ) : (
                                <span className="text-[9px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                                  {usr.grade || '護理系'}
                                </span>
                              )}
                              <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <CheckCircle2 className="h-2.5 w-2.5" /> 已驗證啟用
                              </span>
                            </div>
                            
                            <p className="text-[11px] text-slate-600 truncate font-mono">
                              Email: <span className="text-slate-900 font-semibold">{usr.email}</span>
                            </p>
                            <p className="text-[10px] text-slate-500">
                              密碼: <span className="font-mono text-slate-700 bg-white px-1.5 py-0.5 rounded border border-gray-200">{usr.password || '******'}</span>
                            </p>
                            {usr.createdAt && (
                              <p className="text-[9px] text-slate-400">
                                註冊時間: {usr.createdAt.slice(0, 10)}
                              </p>
                            )}
                            
                            <div className="pt-1.5 flex gap-1.5">
                              <button
                                onClick={() => {
                                  setMsgType('personal');
                                  setTargetUserMsg(usr.email);
                                  setMsgTitle('【管理端私訊】');
                                  setMsgContent('');
                                  setActiveModal('send_message');
                                }}
                                className="text-[10px] bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 border border-pink-200"
                              >
                                <Mail className="h-3 w-3" /> 發送專屬私訊
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="shrink-0 px-4 sm:px-6 py-3 border-t border-gray-100 flex justify-between items-center bg-slate-50">
              <span className="text-xs text-slate-500 font-medium">
                顯示 {allUsers.filter(u => 
                  (u.username || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                  (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                  (u.grade || '').toLowerCase().includes(userSearch.toLowerCase())
                ).length} / 共 {allUsers.length} 位
              </span>
              <div className="flex gap-2">
                <button
                  onClick={loadAllUsers}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isUsersLoading ? 'animate-spin' : ''}`} />
                  <span>重新整理</span>
                </button>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-1.5 rounded-xl transition cursor-pointer"
                >
                  關閉視窗
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Admin Send Message / Announcement Modal (For Admin) */}
      {activeModal === 'send_message' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] p-2 sm:p-4 overflow-y-auto flex items-start sm:items-center justify-center animate-fadeIn">
          <div className="my-auto bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl p-5 sm:p-6 border border-rose-100 flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[88vh] overflow-y-auto animate-scaleUp space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-rose-500" />
                <span>傳送公告與使用者私訊</span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendMessageSubmit} className="space-y-4 text-left">
              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setMsgType('announcement');
                    setTargetUserMsg('all');
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${
                    msgType === 'announcement' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  廣播系統公告
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMsgType('personal');
                    setTargetUserMsg('');
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${
                    msgType === 'personal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  傳送個人私訊
                </button>
              </div>

              {/* Target Input if personal */}
              {msgType === 'personal' && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">收件者 Email：</label>
                  <input
                    type="text"
                    required
                    placeholder="請輸入目標用戶的 Email 帳號..."
                    value={targetUserMsg}
                    onChange={(e) => setTargetUserMsg(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-2 bg-white"
                  />
                </div>
              )}

              {/* Message Title */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">訊息主旨：</label>
                <input
                  type="text"
                  required
                  placeholder="請輸入主旨，例如：實習資訊、違規警告、系統更動..."
                  value={msgTitle}
                  onChange={(e) => setMsgTitle(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-2 bg-white"
                />
              </div>

              {/* Message Content */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">訊息內容描述：</label>
                <textarea
                  required
                  placeholder="請輸入詳細內容..."
                  rows={4}
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-xl p-3 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSendingMsg}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <Send className="h-3 w-3" />
                  <span>{isSendingMsg ? '傳送中...' : '確認送出'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. System Announcements and Sent Messages Management Modal (For Admin) */}
      {activeModal === 'manage_messages' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] p-2 sm:p-4 overflow-y-auto flex items-start sm:items-center justify-center animate-fadeIn">
          <div className="my-auto bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full shadow-2xl p-4 sm:p-6 border border-rose-100 flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[88vh] animate-scaleUp space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-rose-500" />
                <h3 className="text-base font-black text-slate-800">
                  系統公告與發布訊息管理
                </h3>
                <span className="text-xs font-bold text-slate-500 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full">
                  共 {allSystemNotifications.length} 則紀錄
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveModal('send_message');
                    setMsgType('announcement');
                    setTargetUserMsg('all');
                  }}
                  className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <Megaphone className="h-3.5 w-3.5" />
                  <span>發布新公告</span>
                </button>
                <button 
                  onClick={() => setActiveModal(null)} 
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setManageFilter('all')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    manageFilter === 'all'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  全部訊息 ({allSystemNotifications.length})
                </button>
                <button
                  onClick={() => setManageFilter('announcement')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    manageFilter === 'announcement'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  📢 系統公告 ({allSystemNotifications.filter(n => n.type === 'announcement' || n.userId === 'all').length})
                </button>
                <button
                  onClick={() => setManageFilter('personal')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    manageFilter === 'personal'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ✉️ 個人私訊 ({allSystemNotifications.filter(n => n.type === 'personal' && n.userId !== 'all').length})
                </button>
              </div>

              {allSystemNotifications.length > 0 && (
                <button
                  onClick={async () => {
                    if (window.confirm('⚠️ 警告：確定要清空雲端資料庫中的「所有歷史通知與公告」嗎？\n此動作將永久刪除全部訊息，無法復原！')) {
                      try {
                        for (const n of allSystemNotifications) {
                          await deleteDoc(doc(db, 'notifications', n.id));
                        }
                        setAllSystemNotifications([]);
                        setNotifications([]);
                        alert('已成功清空所有雲端通知訊息！');
                      } catch (err: any) {
                        alert('清空失敗：' + err.message);
                      }
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" /> 全部清空
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto space-y-3 flex-grow pr-1">
              {allSystemNotifications
                .filter(n => {
                  if (manageFilter === 'announcement') return n.type === 'announcement' || n.userId === 'all';
                  if (manageFilter === 'personal') return n.type === 'personal' && n.userId !== 'all';
                  return true;
                })
                .length === 0 ? (
                <div className="text-center py-16 text-slate-400 space-y-2">
                  <Megaphone className="h-8 w-8 mx-auto text-slate-300 opacity-60" />
                  <p className="text-sm font-bold">目前雲端資料庫中沒有任何公告或歷史訊息</p>
                  <p className="text-xs text-slate-400">點擊上方「發布新公告」即可向學生發布臨床實習最新通知！</p>
                </div>
              ) : (
                allSystemNotifications
                  .filter(n => {
                    if (manageFilter === 'announcement') return n.type === 'announcement' || n.userId === 'all';
                    if (manageFilter === 'personal') return n.type === 'personal' && n.userId !== 'all';
                    return true;
                  })
                  .map((notif) => (
                    <div 
                      key={notif.id}
                      className="bg-slate-50 hover:bg-rose-50/20 border border-slate-200/80 rounded-2xl p-4 transition text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 flex-grow pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {notif.type === 'announcement' || notif.userId === 'all' ? (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-md border border-amber-200">
                              📢 系統全體公告
                            </span>
                          ) : (
                            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded-md border border-indigo-200">
                              ✉️ 個人私訊 (收件者: {notif.userId})
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {notif.createdAt ? notif.createdAt.replace('T', ' ').slice(0, 16) : ''}
                          </span>
                        </div>

                        <h4 className="text-sm font-black text-slate-800">{notif.title}</h4>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-white/70 p-2 rounded-xl border border-slate-100">
                          {notif.content}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 sm:self-center shrink-0">
                        <button
                          onClick={() => setSelectedNotification(notif)}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Eye className="h-3 w-3" />
                          <span>全文</span>
                        </button>
                        <button
                          onClick={(e) => handlePermanentDeleteNotification(notif.id, e)}
                          className="px-3 py-1.5 text-xs text-white bg-red-500 hover:bg-red-600 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer shadow-sm"
                          title="從雲端資料庫永久刪除"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>永久刪除</span>
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button 
                onClick={() => setActiveModal(null)}
                className="bg-gray-800 hover:bg-gray-950 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Detailed zoomed view modal for notifications to ensure readability (字體放大、清晰易讀) */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[10000] p-2 sm:p-4 overflow-y-auto flex items-start sm:items-center justify-center animate-fadeIn">
          <div className="my-auto bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-rose-100 overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[85vh] transform scale-100 transition-all duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-5 sm:p-6 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedNotification.type === 'announcement' ? (
                  <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-1 rounded-full border border-amber-200">
                    📢 系統公告
                  </span>
                ) : (
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-black px-2.5 py-1 rounded-full border border-indigo-200">
                    ✉️ 個人訊息
                  </span>
                )}
                <span className="text-xs text-slate-400 font-bold">
                  {selectedNotification.createdAt ? selectedNotification.createdAt.slice(0, 10) : ''}
                </span>
              </div>
              <button 
                onClick={() => setSelectedNotification(null)}
                className="p-1.5 rounded-full hover:bg-rose-100/50 text-slate-400 hover:text-pink-600 transition cursor-pointer"
                title="關閉"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body with larger text for high readability */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-grow">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 leading-snug">
                {selectedNotification.title}
              </h3>
              
              <div className="bg-slate-50/70 p-5 sm:p-6 rounded-2xl border border-rose-50 select-text">
                <p className="text-sm sm:text-base text-slate-700 whitespace-pre-wrap leading-relaxed font-semibold">
                  {selectedNotification.content}
                </p>
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-row items-center justify-between gap-3">
              {isAdmin ? (
                <button
                  onClick={() => handlePermanentDeleteNotification(selectedNotification.id)}
                  className="px-3.5 py-2.5 text-xs text-white bg-red-600 hover:bg-red-700 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  title="從雲端資料庫永久下架此訊息"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>從雲端永久刪除</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    clearNotification(selectedNotification.id);
                    setSelectedNotification(null);
                  }}
                  className="px-3.5 py-2.5 text-xs text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="隱藏此訊息"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>隱藏此訊息</span>
                </button>
              )}
              
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-5 py-2.5 text-xs font-black text-white bg-pink-500 hover:bg-pink-600 rounded-xl shadow-md hover:shadow-lg shadow-pink-500/20 transition cursor-pointer"
              >
                確認關閉
              </button>
            </div>
          </div>
        </div>
      )}
        </>,
        document.body
      )}

    </div>
  );
}
