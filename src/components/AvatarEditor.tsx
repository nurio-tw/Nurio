/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AvatarConfig } from '../types';
import AvatarRenderer from './AvatarRenderer';

interface AvatarEditorProps {
  value: AvatarConfig;
  onChange: (newConfig: AvatarConfig) => void;
}

const SKIN_COLORS = [
  { value: '#FFF5EB', label: '雪白' },
  { value: '#FFD8B1', label: '白皙' },
  { value: '#FAD6A5', label: '自然' },
  { value: '#F2D2BD', label: '粉嫩' },
  { value: '#E0A96D', label: '健美' },
  { value: '#C68B59', label: '古銅' },
  { value: '#8D5524', label: '深褐' },
];

const HAIR_TYPES = [
  { value: 'short', label: '俐落短髮' },
  { value: 'long', label: '溫柔長髮' },
  { value: 'ponytail', label: '活力馬尾' },
  { value: 'bun', label: '幹練包頭' },
  { value: 'curly', label: '蓬鬆捲髮' },
] as const;

const HAIR_COLORS = [
  { value: '#1A1A1A', label: '經典黑' },
  { value: '#4A2F13', label: '深栗棕' },
  { value: '#8C6239', label: '亞麻棕' },
  { value: '#D4AF37', label: '焦糖金' },
  { value: '#9E2A2B', label: '微醺紅' },
  { value: '#F472B6', label: '櫻花粉' },
  { value: '#3B82F6', label: '星空藍' },
  { value: '#10B981', label: '極光綠' },
];

const EXPRESSIONS = [
  { value: 'smile', label: '親切微笑' },
  { value: 'happy', label: '陽光開朗' },
  { value: 'determined', label: '專業自信' },
  { value: 'neutral', label: '溫和從容' },
] as const;

const SCRUB_COLORS = [
  { value: '#0D9488', label: '湖水綠' },
  { value: '#0F766E', label: '深藍綠' },
  { value: '#0284C7', label: '專業藍' },
  { value: '#1E3A8A', label: '深海藍' },
  { value: '#EC4899', label: '溫柔粉' },
  { value: '#8B5CF6', label: '療癒紫' },
  { value: '#10B981', label: '草綠色' },
  { value: '#F59E0B', label: '活力橘' },
  { value: '#374151', label: '經典灰' },
];

const ACCESSORIES = [
  { value: 'none', label: '無配飾' },
  { value: 'stethoscope', label: '聽診器' },
  { value: 'mask', label: '醫療口罩' },
  { value: 'glasses', label: '知性眼鏡' },
] as const;

const BG_COLORS = [
  { value: 'from-teal-400 to-emerald-500', label: '薄荷綠' },
  { value: 'from-amber-300 to-orange-400', label: '暖陽橘' },
  { value: 'from-pink-400 to-rose-500', label: '玫瑰粉' },
  { value: 'from-blue-400 to-indigo-500', label: '寧靜藍' },
  { value: 'from-purple-400 to-indigo-600', label: '丁香紫' },
  { value: 'from-rose-400 to-orange-300', label: '晨曦暖' },
  { value: 'from-cyan-400 to-blue-500', label: '海洋藍' },
  { value: 'from-gray-300 to-slate-500', label: '太空灰' },
];

export default function AvatarEditor({ value, onChange }: AvatarEditorProps) {
  const updateConfig = <K extends keyof AvatarConfig>(key: K, val: AvatarConfig[K]) => {
    onChange({
      ...value,
      [key]: val,
    });
  };

  // Generate a totally random config for the user!
  const handleRandomize = () => {
    const randomSkin = SKIN_COLORS[Math.floor(Math.random() * SKIN_COLORS.length)].value;
    const randomHairType = HAIR_TYPES[Math.floor(Math.random() * HAIR_TYPES.length)].value;
    const randomHairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].value;
    const randomExpr = EXPRESSIONS[Math.floor(Math.random() * EXPRESSIONS.length)].value;
    const randomScrub = SCRUB_COLORS[Math.floor(Math.random() * SCRUB_COLORS.length)].value;
    const randomAccessory = ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)].value;
    const randomBg = BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)].value;

    onChange({
      skinColor: randomSkin,
      hairType: randomHairType,
      hairColor: randomHairColor,
      expression: randomExpr,
      scrubColor: randomScrub,
      accessory: randomAccessory,
      bgColor: randomBg,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      {/* Left Column: Interactive Avatar Display */}
      <div className="md:col-span-4 flex flex-col items-center justify-center bg-[#F0FDFA] p-5 rounded-2xl border border-teal-100/50 relative">
        <div className="text-xs text-teal-800 font-bold mb-4 bg-teal-100/60 px-3 py-1 rounded-full">
          即時頭像預覽
        </div>
        
        <AvatarRenderer config={value} className="h-32 w-32 md:h-40 md:w-40 border-4 border-white shadow-xl" />
        
        <button
          type="button"
          onClick={handleRandomize}
          className="mt-5 px-4 py-2 bg-white text-teal-700 font-bold text-xs rounded-xl border border-teal-200 hover:border-teal-400 shadow-sm hover:shadow transition flex items-center gap-1.5 active:scale-95"
        >
          🎲 隨機配置頭像
        </button>
      </div>

      {/* Right Column: Attribute Selectors */}
      <div className="md:col-span-8 space-y-4.5 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
        {/* 1. Hair Style */}
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-2">👩‍⚕️ 髮型選擇</label>
          <div className="flex flex-wrap gap-1.5">
            {HAIR_TYPES.map((h) => (
              <button
                key={h.value}
                type="button"
                onClick={() => updateConfig('hairType', h.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  value.hairType === h.value
                    ? 'bg-[#14B8A6] text-white border-[#14B8A6]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-teal-200 hover:bg-teal-50/20'
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Hair Color */}
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-2">🎨 髮色選擇</label>
          <div className="flex flex-wrap gap-2">
            {HAIR_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => updateConfig('hairColor', c.value)}
                className={`h-7 px-2.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5 ${
                  value.hairColor === c.value
                    ? 'border-teal-500 ring-2 ring-teal-200'
                    : 'border-gray-200 hover:border-teal-300'
                }`}
                style={{ backgroundColor: '#ffffff' }}
              >
                <span className="w-3.5 h-3.5 rounded-full inline-block shadow-inner" style={{ backgroundColor: c.value }} />
                <span>{c.label}</span>
              </button>
            ))}

            {/* Custom Hair Color Palette */}
            <div className={`flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[10px] font-bold border transition-all ${
              !HAIR_COLORS.some(c => c.value === value.hairColor)
                ? 'border-teal-500 ring-2 ring-teal-200 bg-teal-50/10'
                : 'border-gray-200 bg-slate-50 hover:border-teal-300'
            }`}>
              <input
                type="color"
                value={HAIR_COLORS.some(c => c.value === value.hairColor) ? '#4A2F13' : value.hairColor}
                onChange={(e) => updateConfig('hairColor', e.target.value)}
                className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent outline-none"
              />
              <span className="text-gray-600">調色盤自訂</span>
            </div>
          </div>
        </div>

        {/* 3. Skin Color */}
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-2">膚色調配</label>
          <div className="flex flex-wrap gap-2">
            {SKIN_COLORS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => updateConfig('skinColor', s.value)}
                className={`h-7 px-2.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5 ${
                  value.skinColor === s.value
                    ? 'border-teal-500 ring-2 ring-teal-200'
                    : 'border-gray-200 hover:border-teal-300'
                }`}
                style={{ backgroundColor: '#ffffff' }}
              >
                <span className="w-3.5 h-3.5 rounded-full inline-block shadow-inner" style={{ backgroundColor: s.value }} />
                <span>{s.label}</span>
              </button>
            ))}

            {/* Custom Skin Color Palette */}
            <div className={`flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[10px] font-bold border transition-all ${
              !SKIN_COLORS.some(s => s.value === value.skinColor)
                ? 'border-teal-500 ring-2 ring-teal-200 bg-teal-50/10'
                : 'border-gray-200 bg-slate-50 hover:border-teal-300'
            }`}>
              <input
                type="color"
                value={SKIN_COLORS.some(s => s.value === value.skinColor) ? '#FAD6A5' : value.skinColor}
                onChange={(e) => updateConfig('skinColor', e.target.value)}
                className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent outline-none"
              />
              <span className="text-gray-600">調色盤自訂</span>
            </div>
          </div>
        </div>

        {/* 4. Expressions */}
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-2">😊 面部表情</label>
          <div className="flex flex-wrap gap-1.5">
            {EXPRESSIONS.map((e) => (
              <button
                key={e.value}
                type="button"
                onClick={() => updateConfig('expression', e.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  value.expression === e.value
                    ? 'bg-[#14B8A6] text-white border-[#14B8A6]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-teal-200'
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Scrubs Color */}
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-2">🩺 實習制服/刷手服</label>
          <div className="flex flex-wrap gap-2">
            {SCRUB_COLORS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => updateConfig('scrubColor', s.value)}
                className={`h-7 px-2.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5 ${
                  value.scrubColor === s.value
                    ? 'border-teal-500 ring-2 ring-teal-200'
                    : 'border-gray-200 hover:border-teal-300'
                }`}
                style={{ backgroundColor: '#ffffff' }}
              >
                <span className="w-3.5 h-3.5 rounded-full inline-block shadow-inner" style={{ backgroundColor: s.value }} />
                <span>{s.label}</span>
              </button>
            ))}

            {/* Custom Scrubs Color Palette */}
            <div className={`flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[10px] font-bold border transition-all ${
              !SCRUB_COLORS.some(s => s.value === value.scrubColor)
                ? 'border-teal-500 ring-2 ring-teal-200 bg-teal-50/10'
                : 'border-gray-200 bg-slate-50 hover:border-teal-300'
            }`}>
              <input
                type="color"
                value={SCRUB_COLORS.some(s => s.value === value.scrubColor) ? '#0D9488' : value.scrubColor}
                onChange={(e) => updateConfig('scrubColor', e.target.value)}
                className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent outline-none"
              />
              <span className="text-gray-600">調色盤自訂</span>
            </div>
          </div>
        </div>

        {/* 6. Accessories */}
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-2">🛡️ 實習配備</label>
          <div className="flex flex-wrap gap-1.5">
            {ACCESSORIES.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => updateConfig('accessory', a.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  value.accessory === a.value
                    ? 'bg-[#14B8A6] text-white border-[#14B8A6]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-teal-200'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* 7. Background Gradient */}
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-2">🌄 背景漸層與色彩</label>
          <div className="flex flex-wrap gap-2">
            {BG_COLORS.map((bg) => (
              <button
                key={bg.value}
                type="button"
                onClick={() => updateConfig('bgColor', bg.value)}
                className={`h-8 px-2.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5 ${
                  value.bgColor === bg.value
                    ? 'border-teal-500 ring-2 ring-teal-200'
                    : 'border-gray-200 hover:border-teal-300'
                }`}
                style={{ backgroundColor: '#ffffff' }}
              >
                <span className={`w-4 h-4 rounded-full inline-block bg-gradient-to-br ${bg.value} shadow-inner`} />
                <span>{bg.label}</span>
              </button>
            ))}

            {/* Custom Background Color Palette */}
            <div className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[10px] font-bold border transition-all ${
              !BG_COLORS.some(bg => bg.value === value.bgColor)
                ? 'border-teal-500 ring-2 ring-teal-200 bg-teal-50/10'
                : 'border-gray-200 bg-slate-50 hover:border-teal-300'
            }`}>
              <input
                type="color"
                value={BG_COLORS.some(bg => bg.value === value.bgColor) ? '#0D9488' : value.bgColor}
                onChange={(e) => updateConfig('bgColor', e.target.value)}
                className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent outline-none"
              />
              <span className="text-gray-600">自訂單色</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
