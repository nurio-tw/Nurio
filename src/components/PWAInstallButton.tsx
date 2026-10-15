import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, hide
  if (isInstalled) {
    return null;
  }

  // Android / Chrome / Edge / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100/80 active:bg-rose-200 border border-rose-200 rounded-lg transition-all cursor-pointer shadow-xs whitespace-nowrap ${className}`}
        title="將 NURIO. 安裝至手機主畫面或桌面"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">安裝 App</span>
        <span className="sm:hidden">安裝</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100/80 active:bg-rose-200 border border-rose-200 rounded-lg transition-all cursor-pointer shadow-xs whitespace-nowrap ${className}`}
          title="加入 iPhone/iPad 主畫面"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">加到主畫面</span>
          <span className="sm:hidden">安裝</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[9999] p-2 sm:p-4 overflow-y-auto flex items-start sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="my-auto w-full max-w-sm rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-100 animate-scaleUp">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <img src="/apple-touch-icon.png" alt="NURIO Logo" className="w-9 h-9 rounded-xl shadow-xs border border-rose-100" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">安裝 NURIO. 到桌面</h3>
                    <p className="text-[11px] text-slate-500">直接顯示精美 NURIO 專屬 Logo</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5 text-xs text-slate-600">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs shrink-0">
                    <Share className="w-4 h-4 text-rose-500" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">第一步：</span>
                    點擊 Safari 瀏覽器底部的「<strong className="text-slate-900">分享</strong>」圖示（帶箭頭的方塊）。
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs shrink-0">
                    <PlusSquare className="w-4 h-4 text-rose-500" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">第二步：</span>
                    在選單中往下滾動，點選「<strong className="text-slate-900">加入主畫面</strong>」。
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 text-rose-700">
                  <span className="text-base">✨</span>
                  <div className="text-[11px]">
                    安裝完成後，您的桌面將直接顯示精緻的 <strong>NURIO. 緞帶標誌</strong>，不再是灰底預設字母！
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-black py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                我知道了
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
