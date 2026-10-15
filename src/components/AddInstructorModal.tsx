/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Instructor, InternshipCategory, User, Review } from '../types';
import { X, UserPlus, Star } from 'lucide-react';

interface AddInstructorModalProps {
  onClose: () => void;
  onAddInstructor: (
    instructor: Omit<Instructor, 'id' | 'rating' | 'reviews' | 'createdAt'>,
    initialReview?: Omit<Review, 'id' | 'createdAt'>
  ) => void;
  currentUser: User | null;
}

const CATEGORY_OPTIONS: InternshipCategory[] = ['基護', '內外一', '內外二', '產科', '兒科', '精神科', '社區'];

export default function AddInstructorModal({ onClose, onAddInstructor, currentUser }: AddInstructorModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InternshipCategory>('基護');
  const [hospital, setHospital] = useState('');
  const background = '';
  
  // Precautions States
  const [theoryFocus, setTheoryFocus] = useState('');
  const [attitudeFocus, setAttitudeFocus] = useState('');
  const [workloadFocus, setWorkloadFocus] = useState('');
  const [gradingStyle, setGradingStyle] = useState('');
  
  // Custom Tags
  const [tagsInput, setTagsInput] = useState('');

  // Initial Review States
  const [initialRating, setInitialRating] = useState(5);
  const [initialReviewContent, setInitialReviewContent] = useState('');
  const [theoryScore, setTheoryScore] = useState(3);
  const [attitudeScore, setAttitudeScore] = useState(3);
  const [patienceScore, setPatienceScore] = useState(3);
  const [workloadScore, setWorkloadScore] = useState(3);
  
  // Disclaimer state
  const [hasAgreedDisclaimer, setHasAgreedDisclaimer] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !hospital.trim() || !theoryFocus.trim() || !attitudeFocus.trim() || !workloadFocus.trim() || !gradingStyle.trim()) {
      alert('請填寫完整的所有必填欄位！');
      return;
    }

    if (!initialReviewContent.trim()) {
      alert('請填寫您對這位老師的第一則實習攻略/評價心得！');
      return;
    }

    if (!hasAgreedDisclaimer) {
      alert('請勾選同意實習交流免責聲明後再發佈老師資料。');
      return;
    }

    // Process tags
    const tagsArray = tagsInput
      .split(/[,，\s]+/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const initialReviewData: Omit<Review, 'id' | 'createdAt'> = {
      userId: currentUser?.id,
      rating: initialRating,
      author: currentUser?.username || '熱心學長姐',
      grade: currentUser?.grade || '護理系',
      content: initialReviewContent.trim(),
      scores: {
        theory: theoryScore,
        attitude: attitudeScore,
        patience: patienceScore,
        workload: workloadScore
      },
      tags: tagsArray.slice(0, 3),
      avatarConfig: currentUser?.avatarConfig
    };

    onAddInstructor({
      name: name.trim(),
      category,
      hospital: hospital.trim(),
      background: background.trim(),
      precautions: {
        theoryFocus: theoryFocus.trim(),
        attitudeFocus: attitudeFocus.trim(),
        workloadFocus: workloadFocus.trim(),
        gradingStyle: gradingStyle.trim()
      },
      tags: tagsArray.length > 0 ? tagsArray : ['新推薦老師']
    }, initialReviewData);

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl border border-slate-200 overflow-hidden flex flex-col my-6 max-h-[92vh] animate-fadeIn">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 relative shrink-0 bg-white">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
            title="關閉"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
              <UserPlus className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">推薦 / 新增實習老師</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                建立臨床教師建檔與首則實習攻略，協助護理實習同儕掌握重要帶教資訊
              </p>
            </div>
          </div>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Section 1: Basic Info */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              1. 教師基本資訊
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  老師姓名 <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="例如：王美惠 老師"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500/15 focus:border-rose-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  實習專科分區 <span className="text-rose-500">*</span>
                </label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value as InternshipCategory)}
                  required
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500/15 focus:border-rose-500 bg-white cursor-pointer"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>{cat}實習</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                實習醫院與單位病房 <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder="例如：台北榮總 92心臟內科病房"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                required
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500/15 focus:border-rose-500 bg-white"
              />
            </div>
          </div>

          {/* Section 2: Precautions */}
          <div className="space-y-3.5 pt-3 border-t border-slate-200">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              2. 臨床帶教重點與常規
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  學理要求重點 <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="例如：重視心電圖與病理機轉，晨會會抽問常見檢驗值與給藥原理"
                  value={theoryFocus}
                  onChange={(e) => setTheoryFocus(e.target.value)}
                  required
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500/15 focus:border-rose-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  態度與禮貌常規 <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="例如：準時到達、交班確實、主動向病房學姐打招呼、不懂立即提問"
                  value={attitudeFocus}
                  onChange={(e) => setAttitudeFocus(e.target.value)}
                  required
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500/15 focus:border-rose-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  作業與技術單要求 <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="例如：個案護理記錄格式嚴謹、技術單進度緊湊、注重反思深度"
                  value={workloadFocus}
                  onChange={(e) => setWorkloadFocus(e.target.value)}
                  required
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500/15 focus:border-rose-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  給分與考試風格 <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="例如：嚴謹但公正（常態約82-86），重視無菌操作觀念與給藥安全"
                  value={gradingStyle}
                  onChange={(e) => setGradingStyle(e.target.value)}
                  required
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500/15 focus:border-rose-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Extra Tags */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              3. 特徵標籤
            </h3>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                標籤（以逗號或空格分隔）
              </label>
              <input 
                type="text" 
                placeholder="例如：溫柔耐心, 學理扎實, 重無菌, 給分甜"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500/15 focus:border-rose-500 bg-white"
              />
            </div>
          </div>

          {/* Section 4: Initial Review */}
          <div className="space-y-3.5 pt-3 border-t border-slate-200">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              4. 首次實習評價與評分
            </h3>

            {/* Overall Rating */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                綜合評分星等 <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setInitialRating(star)}
                    className="focus:outline-none cursor-pointer"
                  >
                    <Star 
                      className={`h-5 w-5 transition-colors ${star <= initialRating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} 
                    />
                  </button>
                ))}
                <span className="text-xs text-slate-500 ml-2 font-mono tabular-nums">
                  {initialRating} / 5
                </span>
              </div>
            </div>

            {/* Metric scores */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
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
                <span className="text-slate-500 block mb-1">作業難度</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} type="button" onClick={() => setWorkloadScore(s)}>
                      <Star className={`h-3.5 w-3.5 cursor-pointer ${s <= workloadScore ? 'text-slate-700 fill-slate-700' : 'text-slate-200'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Review textarea */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                首次心得回饋 <span className="text-rose-500">*</span>
              </label>
              <textarea 
                rows={3}
                placeholder="分享老師的臨床帶教特色、在意的關鍵技術、或是提早預備的建議..."
                value={initialReviewContent}
                onChange={(e) => setInitialReviewContent(e.target.value)}
                required
                className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-rose-500/15 focus:border-rose-500 bg-white"
              ></textarea>
            </div>
          </div>

          {/* Section 5: Terms */}
          <div className="pt-3 border-t border-slate-200">
            <label className="flex items-start gap-2 cursor-pointer">
              <input 
                type="checkbox"
                checked={hasAgreedDisclaimer}
                onChange={(e) => setHasAgreedDisclaimer(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-rose-500 focus:ring-rose-400 cursor-pointer h-3.5 w-3.5"
              />
              <span className="text-xs text-slate-600 select-none">
                我承諾提供之臨床資訊與心得客觀真實，不含人身攻擊言論，亦未洩漏任何病患隱私。
              </span>
            </label>
          </div>

        </form>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!hasAgreedDisclaimer}
            className="px-4 py-2 text-xs font-medium text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            建立老師資料
          </button>
        </div>

      </div>
    </div>
  );
}
