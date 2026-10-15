/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Instructor, Review, User } from '../types';
import AvatarRenderer from './AvatarRenderer';
import { 
  X, Star, MapPin, Award, BookOpen, Heart, ShieldAlert, FileText, 
  MessageSquare, Send, ThumbsUp, ThumbsDown, Calendar, AlertTriangle, Pencil, Trash2,
  AlertCircle, CheckCircle, ShieldCheck, Copy, Check
} from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface InstructorDetailProps {
  instructor: Instructor;
  onClose: () => void;
  onAddReview: (instructorId: string, review: Review) => void;
  onUpdateReview: (instructorId: string, reviewId: string, updatedReview: Review) => void;
  onDeleteReview?: (instructorId: string, reviewId: string) => void;
  onDeleteInstructor?: (instructorId: string) => void;
  currentUser: User | null;
  onRequireLogin?: () => void;
}

const PRESET_TAGS = ['溫柔耐心', '給分超甜', '臨床大刀', '學理魔王', '作業繁重', '收穫滿滿', '注重無菌', '技術精湛', '活動歡樂'];

export default function InstructorDetail({ 
  instructor, 
  onClose, 
  onAddReview, 
  onUpdateReview, 
  onDeleteReview, 
  onDeleteInstructor, 
  currentUser, 
  onRequireLogin 
}: InstructorDetailProps) {
  const { id, name, category, hospital, background, rating, precautions, tags, reviews } = instructor;

  // Admin Identification
  const isAdmin = currentUser?.email?.trim().toLowerCase() === 'yurou010@gmail.com';

  // Report Modal / Form states
  const [reportingReview, setReportingReview] = useState<Review | null>(null);
  const [reportReason, setReportReason] = useState('言論人身攻擊/不雅字眼');
  const [customReportReason, setCustomReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Review Form State (For adding new review)
  const [author, setAuthor] = useState(currentUser?.username || '');
  const [grade, setGrade] = useState(currentUser?.grade || '');
  const [overallRating, setOverallRating] = useState(5);
  const [theoryScore, setTheoryScore] = useState(4);
  const [attitudeScore, setAttitudeScore] = useState(4);
  const [patienceScore, setPatienceScore] = useState(4);
  const [workloadScore, setWorkloadScore] = useState(3);
  const [content, setContent] = useState('');
  const [experience, setExperience] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hasAgreedDisclaimer, setHasAgreedDisclaimer] = useState(false);
  
  // Edit Review State
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editAuthor, setEditAuthor] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editOverallRating, setEditOverallRating] = useState(5);
  const [editTheoryScore, setEditTheoryScore] = useState(4);
  const [editAttitudeScore, setEditAttitudeScore] = useState(4);
  const [editPatienceScore, setEditPatienceScore] = useState(4);
  const [editWorkloadScore, setEditWorkloadScore] = useState(3);
  const [editContent, setEditContent] = useState('');
  const [editExperience, setEditExperience] = useState('');
  const [editSelectedTags, setEditSelectedTags] = useState<string[]>([]);
  
  // Update state if currentUser loads or changes
  useEffect(() => {
    if (currentUser) {
      setAuthor(currentUser.username);
      setGrade(currentUser.grade);
    }
  }, [currentUser]);

  // UI States
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleLikeToggle = (reviewId: string, isLike: boolean) => {
    if (currentUser?.email === 'guest@ntunhs.edu.tw' || currentUser?.id?.startsWith('guest-')) {
      alert('請先登入！');
      if (onRequireLogin) {
        onRequireLogin();
      }
      return;
    }
    const rev = reviews.find(r => r.id === reviewId);
    if (!rev) return;

    let visitorId = currentUser?.id;
    if (!visitorId) {
      visitorId = localStorage.getItem('visitor_id') || '';
      if (!visitorId) {
        visitorId = 'vis-' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('visitor_id', visitorId);
      }
    }

    const currentLikes = rev.likes || [];
    const currentDislikes = rev.dislikes || [];

    let updatedLikes = [...currentLikes];
    let updatedDislikes = [...currentDislikes];

    if (isLike) {
      if (currentLikes.includes(visitorId)) {
        updatedLikes = updatedLikes.filter(id => id !== visitorId);
      } else {
        updatedLikes.push(visitorId);
        updatedDislikes = updatedDislikes.filter(id => id !== visitorId);
      }
    } else {
      if (currentDislikes.includes(visitorId)) {
        updatedDislikes = updatedDislikes.filter(id => id !== visitorId);
      } else {
        updatedDislikes.push(visitorId);
        updatedLikes = updatedLikes.filter(id => id !== visitorId);
      }
    }

    const updatedReview: Review = {
      ...rev,
      likes: updatedLikes,
      dislikes: updatedDislikes
    };

    onUpdateReview(id, reviewId, updatedReview);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !content.trim() || !grade.trim()) {
      alert('請填寫完整的所有必填欄位！');
      return;
    }

    if (!hasAgreedDisclaimer) {
      alert('請閱讀並勾選免責聲明承諾後再送出評價。');
      return;
    }

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      userId: currentUser?.id,
      rating: overallRating,
      author: author.trim(),
      grade: grade.trim(),
      content: content.trim(),
      experience: experience.trim() || undefined,
      createdAt: new Date().toISOString().split('T')[0],
      scores: {
        theory: theoryScore,
        attitude: attitudeScore,
        patience: patienceScore,
        workload: workloadScore
      },
      tags: selectedTags,
      avatarConfig: currentUser?.avatarConfig
    };

    onAddReview(id, newReview);

    // Reset Form
    setAuthor(currentUser?.username || '');
    setGrade(currentUser?.grade || '');
    setOverallRating(5);
    setTheoryScore(4);
    setAttitudeScore(4);
    setPatienceScore(4);
    setWorkloadScore(3);
    setContent('');
    setExperience('');
    setSelectedTags([]);
    setHasAgreedDisclaimer(false);
    setShowForm(false);
    
    setTimeout(() => {
      document.getElementById('reviews-list-start')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleEditSubmit = (e: React.FormEvent, reviewId: string) => {
    e.preventDefault();
    if (!editAuthor.trim() || !editContent.trim() || !editGrade.trim()) {
      alert('請填寫完整的所有必填欄位！');
      return;
    }

    const originalReview = reviews.find(r => r.id === reviewId);
    if (!originalReview) return;

    const updatedReview: Review = {
      ...originalReview,
      rating: editOverallRating,
      author: editAuthor.trim(),
      grade: editGrade.trim(),
      content: editContent.trim(),
      experience: editExperience.trim() || undefined,
      scores: {
        theory: editTheoryScore,
        attitude: editAttitudeScore,
        patience: editPatienceScore,
        workload: editWorkloadScore
      },
      tags: editSelectedTags
    };

    onUpdateReview(id, reviewId, updatedReview);
    setEditingReviewId(null);
  };

  const handleEditTagToggle = (tag: string) => {
    if (editSelectedTags.includes(tag)) {
      setEditSelectedTags(editSelectedTags.filter(t => t !== tag));
    } else {
      setEditSelectedTags([...editSelectedTags, tag]);
    }
  };

  const startEditing = (rev: Review) => {
    setEditingReviewId(rev.id);
    setEditAuthor(rev.author);
    setEditGrade(rev.grade);
    setEditOverallRating(rev.rating);
    setEditTheoryScore(rev.scores.theory);
    setEditAttitudeScore(rev.scores.attitude);
    setEditPatienceScore(rev.scores.patience);
    setEditWorkloadScore(rev.scores.workload);
    setEditContent(rev.content);
    setEditExperience(rev.experience || '');
    setEditSelectedTags(rev.tags || []);
  };

  const handleReportClick = (rev: Review) => {
    if (!currentUser || currentUser.email === 'guest@ntunhs.edu.tw' || currentUser.id.startsWith('guest-')) {
      alert('訪客請先註冊/登入正式帳號再進行檢舉！');
      if (onRequireLogin) {
        onRequireLogin();
      }
      return;
    }
    if (rev.reports?.includes(currentUser.id)) {
      alert('您已經檢舉過此實習評價囉！管理員正在審查中。');
      return;
    }
    setReportingReview(rev);
    setReportReason('言論人身攻擊/不雅字眼');
    setCustomReportReason('');
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingReview || !currentUser || isSubmittingReport) return;

    setIsSubmittingReport(true);
    try {
      const reporterId = currentUser.id;
      const updatedReports = [...(reportingReview.reports || []), reporterId];
      const checkUnderReview = updatedReports.length >= 5;

      const finalReason = reportReason === '其他原因' && customReportReason.trim() 
        ? customReportReason.trim() 
        : reportReason;

      const updatedReview: Review = {
        ...reportingReview,
        reports: updatedReports,
        isUnderReview: checkUnderReview ? true : (reportingReview.isUnderReview || false),
        originalContent: reportingReview.originalContent || reportingReview.content
      };

      onUpdateReview(id, reportingReview.id, updatedReview);

      const reportId = `rep-${Date.now()}`;
      await setDoc(doc(db, 'reports', reportId), {
        id: reportId,
        reporterUserId: currentUser.id,
        reporterEmail: currentUser.email,
        targetUserId: reportingReview.userId || 'anonymous',
        targetReviewId: reportingReview.id,
        targetReviewContent: reportingReview.content,
        instructorId: id,
        instructorName: name,
        reason: finalReason,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      alert(`檢舉已送出！${checkUnderReview ? '該評價已累計 5 次檢舉，系統已自動下架審查。' : '管理端將盡快進行審核。'}`);
      setReportingReview(null);
      setReportReason('言論人身攻擊/不雅字眼');
      setCustomReportReason('');
    } catch (err: any) {
      alert('送出檢舉失敗：' + err.message);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleAdminModerate = (rev: Review, shouldHide: boolean) => {
    if (!currentUser || currentUser.email.trim().toLowerCase() !== 'yurou010@gmail.com') return;

    const actionText = shouldHide ? '下架審查' : '還原公開';
    if (window.confirm(`【管理權限】確定將此篇評價「${actionText}」？`)) {
      const updatedReview: Review = {
        ...rev,
        isUnderReview: shouldHide,
        originalContent: rev.originalContent || rev.content
      };
      onUpdateReview(id, rev.id, updatedReview);
      alert(`已成功${actionText}該評價！`);
    }
  };

  const handleCopyPrecautions = () => {
    const text = `【實習老師攻略 - ${name}】\n科別：${category}實習\n醫院：${hospital}\n\n1. 學理要求：${precautions.theoryFocus}\n2. 態度與禮貌：${precautions.attitudeFocus}\n3. 作業與技術單：${precautions.workloadFocus}\n4. 給分風格：${precautions.gradingStyle}`;
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-xl border border-slate-200 overflow-hidden flex flex-col my-6 max-h-[92vh] animate-fadeIn">
        
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-200 relative shrink-0 bg-white">
          <div className="absolute top-5 right-5 flex items-center gap-2">
            {currentUser && onDeleteInstructor && (
              instructor.creatorId === currentUser.id ||
              (!instructor.creatorId && (instructor.reviews.length === 0 || instructor.reviews.some(r => r.userId === currentUser.id || r.author === currentUser.username))) ||
              (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('my_created_instructors') || '[]').includes(id))
            ) && (
              <button
                onClick={() => {
                  if (currentUser?.email === 'guest@ntunhs.edu.tw' || currentUser?.id?.startsWith('guest-')) {
                    alert('請先登入！');
                    if (onRequireLogin) {
                      onRequireLogin();
                    }
                    return;
                  }
                  if (window.confirm('確定要刪除這位實習老師的所有資料嗎？此動作無法復原。')) {
                    onDeleteInstructor(id);
                  }
                }}
                className="text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-medium flex items-center gap-1"
                title="刪除此老師資料"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>刪除老師</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              title="關閉"
              aria-label="關閉"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1.5">
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
              {category}實習
            </span>
            <span>·</span>
            <span className="text-slate-600">{hospital}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">{name}</h2>
              {background && (
                <p className="text-xs text-slate-500 mt-1 max-w-lg">{background}</p>
              )}
            </div>

            {/* Overall Rating Display */}
            <div className="bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200 flex items-center gap-3 self-start sm:self-auto">
              <div>
                <div className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{rating.toFixed(1)}</div>
                <div className="text-[10px] text-slate-400 font-medium mt-1">綜合評分</div>
              </div>
              <div className="h-7 w-px bg-slate-200"></div>
              <div>
                <div className="flex text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      className={`h-3.5 w-3.5 ${s <= Math.round(rating) ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`} 
                    />
                  ))}
                </div>
                <div className="text-[10px] text-slate-500 font-mono tabular-nums mt-0.5">{reviews.length} 則學長姐評價</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-7">
          
          {/* Quick Notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>臨床適應提示：</strong>評鑑心得具主觀經驗性，臨床氣氛亦可能因病房政策或梯次成員而有所差異。保持積極主動、踏實落實護理技術，是順利完成實習的核心基石。
            </p>
          </div>

          {/* Section 1: Specialty Tags */}
          {tags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                風格標籤
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, i) => (
                  <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Precise Precautions (注意事項) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                臨床帶教與考核重點
              </h3>
              <button 
                onClick={handleCopyPrecautions}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1"
              >
                {copiedSuccess ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span>已複製</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>複製攻略</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              
              {/* Theory Focus */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">學理要求程度</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {precautions.theoryFocus}
                  </p>
                </div>
              </div>

              {/* Attitude Focus */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Heart className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">態度與常規要求</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {precautions.attitudeFocus}
                  </p>
                </div>
              </div>

              {/* Workload Focus */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">作業與技術單份量</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {precautions.workloadFocus}
                  </p>
                </div>
              </div>

              {/* Grading Style */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">給分與考試風格</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {precautions.gradingStyle}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Section 3: Reviews (學長姐評價區) */}
          <div className="space-y-4 pt-2">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 id="reviews-list-start" className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-slate-600" />
                <span>學長姐回饋與心得 ({reviews.length})</span>
              </h3>
              
              {!showForm && (
                <button 
                  onClick={() => {
                    if (currentUser?.email === 'guest@ntunhs.edu.tw' || currentUser?.id?.startsWith('guest-')) {
                      alert('請先登入！');
                      if (onRequireLogin) {
                        onRequireLogin();
                      }
                    } else {
                      setShowForm(true);
                    }
                  }}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Send className="h-3 w-3" /> 分享我的心得
                </button>
              )}
            </div>

            {/* Add Review Form */}
            {showForm && (
              <form onSubmit={handleSubmit} className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">
                    填寫實習心得回饋
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => setShowForm(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    取消
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      發表暱稱 <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="例如：護四三學姐、匿名實習生"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      required
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500/15 focus:border-rose-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      實習梯次 / 班別 <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="例如：基護一梯、內外一第3組"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      required
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500/15 focus:border-rose-500 bg-white"
                    />
                  </div>
                </div>

                {/* Star Ratings Grid */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      綜合滿意度評分 <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setOverallRating(star)}
                          className="focus:outline-none cursor-pointer"
                        >
                          <Star 
                            className={`h-5 w-5 transition-colors ${star <= overallRating ? 'text-amber-500 fill-amber-500' : 'text-slate-200 hover:text-amber-300'}`} 
                          />
                        </button>
                      ))}
                      <span className="text-xs text-slate-500 ml-2 font-mono tabular-nums">
                        {overallRating} / 5
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-500 block mb-1">學理要求</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button key={s} type="button" onClick={() => setTheoryScore(s)}>
                            <Star className={`h-3.5 w-3.5 cursor-pointer ${s <= theoryScore ? 'text-slate-700 fill-slate-700' : 'text-slate-200'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">指導耐心</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button key={s} type="button" onClick={() => setPatienceScore(s)}>
                            <Star className={`h-3.5 w-3.5 cursor-pointer ${s <= patienceScore ? 'text-rose-500 fill-rose-500' : 'text-slate-200'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">態度常規</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button key={s} type="button" onClick={() => setAttitudeScore(s)}>
                            <Star className={`h-3.5 w-3.5 cursor-pointer ${s <= attitudeScore ? 'text-slate-700 fill-slate-700' : 'text-slate-200'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">作業繁重</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button key={s} type="button" onClick={() => setWorkloadScore(s)}>
                            <Star className={`h-3.5 w-3.5 cursor-pointer ${s <= workloadScore ? 'text-slate-700 fill-slate-700' : 'text-slate-200'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comment Text Area */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    詳細心得內容 <span className="text-rose-500">*</span>
                  </label>
                  <textarea 
                    rows={4}
                    placeholder="分享老師的帶教風格、晨會問答偏好、報告修改重點或給學弟妹的實用建議..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-rose-500/15 focus:border-rose-500 bg-white"
                  ></textarea>
                </div>

                {/* Experience Note Text Area */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    臨床事件備註（選填）
                  </label>
                  <textarea 
                    rows={2}
                    placeholder="可補充具體的臨床帶教事件或突發狀況應對經驗..."
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-rose-500/15 focus:border-rose-500 bg-white"
                  ></textarea>
                </div>

                {/* Preset Tag Selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">選擇特色標籤</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        className={`text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                          selectedTags.includes(tag) 
                            ? 'bg-slate-900 text-white border-slate-900' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Disclaimer Checkbox */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={hasAgreedDisclaimer}
                      onChange={(e) => setHasAgreedDisclaimer(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-rose-500 focus:ring-rose-400 cursor-pointer h-3.5 w-3.5"
                    />
                    <span className="text-xs text-slate-600 select-none">
                      我已閱讀並同意實習交流條款，保證心得客觀理性，無不實誹謗或透露病患隱私。
                    </span>
                  </label>
                </div>

                {/* Submit button */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={!hasAgreedDisclaimer}
                    className="px-4 py-1.5 text-xs font-medium text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    送出心得
                  </button>
                </div>

              </form>
            )}

            {/* Existing Reviews List */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500">目前尚無評價記錄。</p>
                  <button 
                    onClick={() => setShowForm(true)}
                    className="text-xs text-rose-600 font-medium hover:underline mt-1.5 inline-block cursor-pointer"
                  >
                    成為第一位分享實習心得的學長姐 →
                  </button>
                </div>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
                    {editingReviewId === rev.id ? (
                      <form onSubmit={(e) => handleEditSubmit(e, rev.id)} className="space-y-3.5 animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                            <Pencil className="h-3.5 w-3.5 text-slate-500" /> 編輯評價
                          </h4>
                          <button 
                            type="button" 
                            onClick={() => setEditingReviewId(null)} 
                            className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            取消
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">暱稱</label>
                            <input 
                              type="text" 
                              value={editAuthor}
                              onChange={(e) => setEditAuthor(e.target.value)}
                              required
                              className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">班級年級</label>
                            <select 
                              value={editGrade}
                              onChange={(e) => setEditGrade(e.target.value)}
                              required
                              className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 bg-white cursor-pointer"
                            >
                              <option value="">選擇班級年級...</option>
                              {['護四一', '護四二', '護四三', '護四四', '護二一', '護二二', '其他'].map(g => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">評分星等</label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setEditOverallRating(star)}
                                className="cursor-pointer"
                              >
                                <Star className={`h-4.5 w-4.5 ${star <= editOverallRating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">心得內容</label>
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            required
                            rows={3}
                            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 bg-white"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setEditingReviewId(null)}
                            className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                          >
                            取消
                          </button>
                          <button
                            type="submit"
                            className="px-3.5 py-1.5 text-xs font-medium text-white bg-rose-500 hover:bg-rose-600 rounded-lg shadow-xs cursor-pointer"
                          >
                            儲存變更
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        {/* Review Header */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            {rev.avatarConfig ? (
                              <AvatarRenderer config={rev.avatarConfig} className="h-8 w-8 rounded-full border border-slate-200" />
                            ) : (
                              <div className="bg-slate-100 text-slate-600 font-semibold text-xs h-8 w-8 rounded-full flex items-center justify-center">
                                {rev.author.slice(0, 1)}
                              </div>
                            )}
                            <div>
                              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{rev.author}</span>
                                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {rev.grade}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono tabular-nums mt-0.5">
                                {rev.createdAt}
                              </div>
                            </div>
                          </div>

                          {/* Score */}
                          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded text-xs font-semibold text-amber-800">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            <span className="font-mono tabular-nums">{rev.rating.toFixed(1)}</span>
                          </div>
                        </div>

                        {/* Criteria Breakdown */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div>學理要求：<span className="font-mono text-slate-800 tabular-nums">{rev.scores.theory} ★</span></div>
                          <div>態度常規：<span className="font-mono text-slate-800 tabular-nums">{rev.scores.attitude} ★</span></div>
                          <div>指導耐心：<span className="font-mono text-slate-800 tabular-nums">{rev.scores.patience} ★</span></div>
                          <div>作業份量：<span className="font-mono text-slate-800 tabular-nums">{rev.scores.workload} ★</span></div>
                        </div>

                        {/* Content */}
                        {rev.isUnderReview ? (
                          <div className="bg-rose-50 text-rose-700 p-3 rounded-lg border border-rose-200 text-xs font-medium flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                            <span>該評論接獲檢舉，管理端審查中</span>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {rev.content}
                          </p>
                        )}

                        {/* Experience Note */}
                        {(!rev.isUnderReview || isAdmin) && rev.experience && rev.experience.trim() && (
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
                            <span className="font-semibold text-slate-800 block mb-1">臨床備註：</span>
                            <p className="leading-relaxed whitespace-pre-wrap">{rev.experience}</p>
                          </div>
                        )}

                        {/* Tags */}
                        {(!rev.isUnderReview || isAdmin) && rev.tags && rev.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {rev.tags.map((t, idx) => (
                              <span key={idx} className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Actions bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => handleLikeToggle(rev.id, true)}
                              className={`text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer flex items-center gap-1 ${
                                (() => {
                                  let vid = currentUser?.id || (typeof window !== 'undefined' ? localStorage.getItem('visitor_id') : '');
                                  return rev.likes?.includes(vid || '')
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'text-slate-600 bg-slate-50 hover:bg-slate-100 border-slate-200';
                                })()
                              }`}
                            >
                              <ThumbsUp className="h-3 w-3" />
                              <span className="font-mono tabular-nums">{rev.likes?.length || 0}</span>
                            </button>

                            <button 
                              onClick={() => handleLikeToggle(rev.id, false)}
                              className={`text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer flex items-center gap-1 ${
                                (() => {
                                  let vid = currentUser?.id || (typeof window !== 'undefined' ? localStorage.getItem('visitor_id') : '');
                                  return rev.dislikes?.includes(vid || '')
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'text-slate-600 bg-slate-50 hover:bg-slate-100 border-slate-200';
                                })()
                              }`}
                            >
                              <ThumbsDown className="h-3 w-3" />
                              <span className="font-mono tabular-nums">{rev.dislikes?.length || 0}</span>
                            </button>

                            {currentUser && rev.userId !== currentUser.id && (
                              <button
                                onClick={() => handleReportClick(rev)}
                                className="text-xs text-slate-400 hover:text-rose-600 px-2 py-1 transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <ShieldAlert className="h-3 w-3" />
                                <span>檢舉</span>
                              </button>
                            )}

                            {isAdmin && (
                              <button
                                onClick={() => handleAdminModerate(rev, !rev.isUnderReview)}
                                className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded cursor-pointer font-medium"
                              >
                                {rev.isUnderReview ? '管理：重新上架' : '管理：直接下架'}
                              </button>
                            )}
                          </div>

                          {currentUser && (
                            rev.userId === currentUser.id || 
                            rev.author === currentUser.username || 
                            (rev.userEmail && currentUser.email?.toLowerCase() === rev.userEmail.toLowerCase()) || 
                            isAdmin
                          ) && (
                            <div className="flex items-center gap-2">
                              {(rev.userId === currentUser.id || rev.author === currentUser.username || (rev.userEmail && currentUser.email?.toLowerCase() === rev.userEmail.toLowerCase())) && (
                                <button 
                                  onClick={() => startEditing(rev)}
                                  className="text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Pencil className="h-3 w-3" /> 編輯
                                </button>
                              )}
                              {onDeleteReview && (
                                <button 
                                  onClick={() => setReviewToDelete(rev)}
                                  className="text-xs text-rose-500 hover:text-rose-700 transition-colors cursor-pointer flex items-center gap-1"
                                  title="刪除此評價"
                                >
                                  <Trash2 className="h-3 w-3" /> 刪除
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

        {/* Modal Bottom Close */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
          >
            關閉視窗
          </button>
        </div>

        {/* Report Modal */}
        {reportingReview && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-lg p-6 border border-slate-200 space-y-4 animate-fadeIn text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldAlert className="h-4.5 w-4.5 text-rose-500" />
                  <span>檢舉實習評價</span>
                </h3>
                <button
                  onClick={() => setReportingReview(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600">
                <span className="font-medium text-slate-700 block mb-1">留言內容：</span>
                <p className="italic line-clamp-2">"{reportingReview.content}"</p>
              </div>

              <form onSubmit={handleReportSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">違規原因：</label>
                  {[
                    '言論人身攻擊/不雅字眼',
                    '不實謠言與捏造情節',
                    '洩漏個人隱私或敏感個資',
                    '其他原因'
                  ].map((reason) => (
                    <label key={reason} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-1 rounded hover:bg-slate-50">
                      <input
                        type="radio"
                        name="reportReason"
                        value={reason}
                        checked={reportReason === reason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="text-rose-500 focus:ring-rose-400 h-3.5 w-3.5 cursor-pointer"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>

                {reportReason === '其他原因' && (
                  <div>
                    <textarea
                      value={customReportReason}
                      onChange={(e) => setCustomReportReason(e.target.value)}
                      required
                      placeholder="請說明具體違規事項..."
                      rows={2}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-rose-500/15 focus:border-rose-500 bg-white"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setReportingReview(null)}
                    className="px-3.5 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="px-4 py-1.5 text-xs font-medium text-white bg-rose-500 hover:bg-rose-600 rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingReport ? '提交中...' : '送出檢舉'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* In-App Delete Review Confirmation Modal */}
        {reviewToDelete && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl space-y-3 text-left animate-scaleUp">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <Trash2 className="h-5 w-5" />
                <span>確定刪除這筆實習評價？</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-3 italic">
                "{reviewToDelete.experience || reviewToDelete.content || '（無文字內容）'}"
              </p>
              <p className="text-[11px] text-slate-500">
                此操作不可復原，評論刪除後將重新計算老師評分平均值。
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setReviewToDelete(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteReview) {
                      onDeleteReview(id, reviewToDelete.id);
                    }
                    setReviewToDelete(null);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer transition shadow-xs"
                >
                  確認刪除
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
