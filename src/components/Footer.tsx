import React from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { NurioMark } from './NurioLogo';

export default function Footer({ onReplaySplash }: { onReplaySplash?: () => void } = {}) {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-slate-800">
          
          {/* Disclaimer Section */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <span>實習經驗交流免責聲明</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              本平台專為全臺灣護理實習學生之學術與臨床實習經驗交流所設立。所有評分與心得內容皆為各梯次同學之真實主觀反饋，僅供臨床適應參考。分享時請恪守客觀與建設性原則，嚴禁人身攻擊、不實誹謗或洩露涉及病患隱私之醫療資訊。
            </p>
          </div>

          {/* Clinical Tips Section */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Info className="h-4 w-4 text-rose-400" />
              <span>臨床學習核心指引</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              各專科臨床教師帶教重點互有不同，包含病理學理機轉、技術操作流暢度或治療性溝通。核心原則在於保持<strong>「不懂即問、落實三讀五對給藥安全、確實執行無菌技術」</strong>，維持積極主動的學習心態，即可順利完成各階段臨床實習。
            </p>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2.5 flex-wrap">
            <NurioMark className="h-5 w-5 shrink-0" />
            <span className="font-bold text-slate-300">
              NURIO<span className="text-rose-500">.</span>
            </span>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <p className="text-slate-400">© 2026 NURIO. 全臺灣護理學生的實習交流平台</p>
          </div>
          <div className="flex items-center gap-3 text-slate-500 text-[11px]">
            {onReplaySplash && (
              <button
                type="button"
                onClick={onReplaySplash}
                className="text-slate-400 hover:text-slate-200 transition-colors underline underline-offset-2 cursor-pointer"
              >
                預覽啟動畫面
              </button>
            )}
            <span className="hidden sm:inline text-slate-700">•</span>
            <span>Empowering Nursing Students Across Taiwan</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
