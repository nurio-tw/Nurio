/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Instructor } from '../types';
import { Star, MapPin, BookOpen, HeartHandshake, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface InstructorCardProps {
  key?: string;
  instructor: Instructor;
  onSelect: () => void;
  isHot?: boolean;
}

export default function InstructorCard({ instructor, onSelect, isHot }: InstructorCardProps) {
  const { name, category, hospital, rating, precautions, tags, reviews } = instructor;

  const reviewsCount = reviews.length;
  const avgTheory = reviewsCount > 0 
    ? (reviews.reduce((sum, r) => sum + r.scores.theory, 0) / reviewsCount).toFixed(1)
    : '4.0';
  const avgPatience = reviewsCount > 0 
    ? (reviews.reduce((sum, r) => sum + r.scores.patience, 0) / reviewsCount).toFixed(1)
    : '4.0';

  const isStrict = tags.includes('超嚴格') || tags.includes('臨床大刀') || Number(avgTheory) >= 4.5;
  const isKind = tags.includes('佛心給分') || tags.includes('產科天使') || Number(avgPatience) >= 4.5;

  return (
    <article 
      onClick={onSelect}
      className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all duration-150 cursor-pointer flex flex-col justify-between overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Top Content Area */}
      <div className="p-5">
        
        {/* Meta Bar */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
              {category}實習
            </span>
            {isHot && (
              <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded">
                熱門討論
              </span>
            )}
            {isKind && !isStrict && (
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                溫和耐心
              </span>
            )}
            {isStrict && (
              <span className="text-[11px] font-medium text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                嚴謹扎實
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 font-medium text-slate-700">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <span className="font-semibold text-slate-900 tabular-nums">{rating.toFixed(1)}</span>
            <span className="text-slate-400 text-[11px] tabular-nums">({reviewsCount})</span>
          </div>
        </div>

        {/* Teacher Name and Hospital */}
        <div className="mb-3.5">
          <h3 className="text-base font-bold text-slate-900 group-hover:text-rose-600 transition-colors tracking-tight">
            {name}
          </h3>
          <div className="flex items-center text-xs text-slate-500 gap-1 mt-1">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{hospital}</span>
          </div>
        </div>

        {/* Clean Metric Indicators */}
        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 text-xs space-y-1.5 mb-3.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1">
              <BookOpen className="h-3 w-3 text-slate-400" /> 學理要求
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-700 rounded-full" 
                  style={{ width: `${(Number(avgTheory) / 5) * 100}%` }}
                />
              </div>
              <span className="font-mono text-[11px] text-slate-700 tabular-nums font-medium">{avgTheory}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1">
              <HeartHandshake className="h-3 w-3 text-slate-400" /> 指導耐心
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-500 rounded-full" 
                  style={{ width: `${(Number(avgPatience) / 5) * 100}%` }}
                />
              </div>
              <span className="font-mono text-[11px] text-slate-700 tabular-nums font-medium">{avgPatience}</span>
            </div>
          </div>
        </div>

        {/* Focus Preview */}
        <div className="text-xs text-slate-600 space-y-1">
          <p className="line-clamp-1 leading-normal">
            <span className="text-slate-400 font-medium mr-1.5">學理重點</span>
            {precautions.theoryFocus}
          </p>
          <p className="line-clamp-1 leading-normal">
            <span className="text-slate-400 font-medium mr-1.5">態度作風</span>
            {precautions.attitudeFocus}
          </p>
        </div>

      </div>

      {/* Bottom Footer / Tags & CTA */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
          {tags.slice(0, 2).map((tag, i) => (
            <span key={i} className="text-slate-600">
              #{tag}
            </span>
          ))}
          {tags.length > 2 && (
            <span className="text-slate-400 text-[10px]">+{tags.length - 2}</span>
          )}
        </div>

        <span className="text-xs font-semibold text-rose-600 group-hover:text-rose-700 flex items-center gap-1 shrink-0 transition-colors">
          攻略詳情 <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>

    </article>
  );
}
