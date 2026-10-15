/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Instructor } from '../types';
import { Award, Heart, BookOpen, MessageSquare, ArrowRight, BarChart2 } from 'lucide-react';

interface AnalyticsDashboardProps {
  instructors: Instructor[];
  selectedCategory?: string;
  onSelectInstructor: (inst: Instructor) => void;
}

export default function AnalyticsDashboard({ 
  instructors, 
  selectedCategory = '全部',
  onSelectInstructor 
}: AnalyticsDashboardProps) {
  // Filter instructors strictly by the currently selected category
  const categoryInstructors = selectedCategory === '全部'
    ? instructors
    : instructors.filter(i => i.category === selectedCategory);

  const totalInstructors = categoryInstructors.length;
  const totalReviews = categoryInstructors.reduce((sum, inst) => sum + inst.reviews.length, 0);

  // 1. High Rated
  const sortedByRating = [...categoryInstructors].sort((a, b) => b.rating - a.rating);
  const topAngel = sortedByRating[0];

  // 2. Most Academic
  const getAverageTheory = (inst: Instructor) => {
    if (inst.reviews.length === 0) return 3.5;
    const sum = inst.reviews.reduce((s, r) => s + r.scores.theory, 0);
    return sum / inst.reviews.length;
  };
  const sortedByTheory = [...categoryInstructors].sort((a, b) => getAverageTheory(b) - getAverageTheory(a));
  const topAcademic = sortedByTheory[0];

  // 3. Most Patient
  const getAveragePatience = (inst: Instructor) => {
    if (inst.reviews.length === 0) return 4.0;
    const sum = inst.reviews.reduce((s, r) => s + r.scores.patience, 0);
    return sum / inst.reviews.length;
  };
  const sortedByPatience = [...categoryInstructors].sort((a, b) => getAveragePatience(b) - getAveragePatience(a));
  const topPatient = sortedByPatience[0];

  // 4. Most Reviewed
  const sortedByReviews = [...categoryInstructors].sort((a, b) => b.reviews.length - a.reviews.length);
  const topDiscussed = sortedByReviews[0];

  return (
    <section id="radar-section" className="mb-10">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-slate-600" />
            實習特色總覽
            {selectedCategory !== '全部' && (
              <span className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200/60 px-2.5 py-0.5 rounded-full">
                {selectedCategory}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedCategory === '全部' 
              ? '依據學長姐實習評鑑動態彙整，快速定位各教學風格的代表性教師'
              : `聚焦【${selectedCategory}】實習評鑑，呈現本科別各教學風格的代表性教師`
            }
          </p>
        </div>

        {/* Global Tabular Figures */}
        <div className="flex items-center gap-3 text-xs text-slate-600 self-start sm:self-auto">
          <span>
            {selectedCategory === '全部' ? '收錄教師' : `${selectedCategory}教師`}{' '}
            <strong className="font-mono text-slate-900 tabular-nums">{totalInstructors}</strong> 位
          </span>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <span>
            累積心得 <strong className="font-mono text-slate-900 tabular-nums">{totalReviews}</strong> 則
          </span>
        </div>
      </div>

      {/* Grid items */}
      {totalInstructors === 0 ? (
        <div className="text-center py-8 bg-white rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">
            目前尚無【{selectedCategory}】的教師資料，歡迎點選右上角推薦新增！
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: 綜合好評推薦 */}
          {topAngel && (
            <div 
              onClick={() => onSelectInstructor(topAngel)}
              className="bg-white p-4.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onSelectInstructor(topAngel); }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Award className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    綜合好評最高
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {topAngel.category} · {topAngel.hospital.split(' ')[0]}
                </div>
                <h4 className="text-base font-bold text-slate-900 group-hover:text-rose-600 transition-colors mt-0.5">
                  {topAngel.name}
                </h4>
                <div className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1">
                  <span>★ {topAngel.rating.toFixed(1)}</span>
                  <span className="text-slate-400 font-normal">綜合評分</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="truncate max-w-[180px]">
                  {topAngel.reviews[0]?.content || "暫無心得留言"}
                </span>
                <ArrowRight className="h-3 w-3 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
            </div>
          )}

          {/* Card 2: 溫柔耐心指導 */}
          {topPatient && (
            <div 
              onClick={() => onSelectInstructor(topPatient)}
              className="bg-white p-4.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onSelectInstructor(topPatient); }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                    <Heart className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                    耐心指導首選
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {topPatient.category} · {topPatient.hospital.split(' ')[0]}
                </div>
                <h4 className="text-base font-bold text-slate-900 group-hover:text-rose-600 transition-colors mt-0.5">
                  {topPatient.name}
                </h4>
                <div className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1">
                  <span>★ {getAveragePatience(topPatient).toFixed(1)}</span>
                  <span className="text-slate-400 font-normal">耐心評等</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="truncate max-w-[180px]">
                  {topPatient.reviews[0]?.content || "暫無心得留言"}
                </span>
                <ArrowRight className="h-3 w-3 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
            </div>
          )}

          {/* Card 3: 深度學理型教師 */}
          {topAcademic && (
            <div 
              onClick={() => onSelectInstructor(topAcademic)}
              className="bg-white p-4.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onSelectInstructor(topAcademic); }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    學術與病理扎實
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {topAcademic.category} · {topAcademic.hospital.split(' ')[0]}
                </div>
                <h4 className="text-base font-bold text-slate-900 group-hover:text-rose-600 transition-colors mt-0.5">
                  {topAcademic.name}
                </h4>
                <div className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1">
                  <span>★ {getAverageTheory(topAcademic).toFixed(1)}</span>
                  <span className="text-slate-400 font-normal">學理要求</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="truncate max-w-[180px]">
                  {topAcademic.reviews[0]?.content || "暫無心得留言"}
                </span>
                <ArrowRight className="h-3 w-3 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
            </div>
          )}

          {/* Card 4: 最受討論老師 */}
          {topDiscussed && (
            <div 
              onClick={() => onSelectInstructor(topDiscussed)}
              className="bg-white p-4.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onSelectInstructor(topDiscussed); }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    討論度最高
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {topDiscussed.category} · {topDiscussed.hospital.split(' ')[0]}
                </div>
                <h4 className="text-base font-bold text-slate-900 group-hover:text-rose-600 transition-colors mt-0.5">
                  {topDiscussed.name}
                </h4>
                <div className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1">
                  <span className="font-mono tabular-nums">{topDiscussed.reviews.length}</span>
                  <span className="text-slate-400 font-normal">則學長姐評價</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="truncate max-w-[180px]">
                  {topDiscussed.reviews[0]?.content || "暫無心得留言"}
                </span>
                <ArrowRight className="h-3 w-3 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
            </div>
          )}

        </div>
      )}

    </section>
  );
}
