/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AvatarConfig } from '../types';

interface AvatarRendererProps {
  config: AvatarConfig;
  className?: string;
}

export default function AvatarRenderer({ config, className = 'h-12 w-12' }: AvatarRendererProps) {
  const { skinColor, hairType, hairColor, expression, scrubColor, accessory, bgColor } = config;

  // Render Hair SVG elements
  const renderHair = () => {
    switch (hairType) {
      case 'short':
        return (
          <>
            {/* Short hair back & sides */}
            <path d="M 28 40 C 20 40, 16 30, 20 20 C 24 10, 56 10, 60 20 C 64 30, 60 40, 52 40 Z" fill={hairColor} />
            {/* Fringe/Bang */}
            <path d="M 22 25 C 28 18, 40 18, 44 26 C 46 18, 54 18, 58 25 C 55 18, 25 18, 22 25 Z" fill={hairColor} />
          </>
        );
      case 'long':
        return (
          <>
            {/* Long flowing hair behind and sides */}
            <path d="M 20 30 C 15 45, 12 65, 18 80 C 20 85, 26 80, 24 60 C 24 40, 56 40, 56 60 C 54 80, 60 85, 62 80 C 68 65, 65 45, 60 30 Z" fill={hairColor} />
            <path d="M 28 35 C 20 30, 18 15, 40 12 C 62 15, 60 30, 52 35" fill="none" stroke={hairColor} strokeWidth="10" strokeLinecap="round" />
            <path d="M 22 24 C 30 16, 40 22, 43 28 C 45 22, 52 16, 58 24 C 54 18, 26 18, 22 24 Z" fill={hairColor} />
          </>
        );
      case 'ponytail':
        return (
          <>
            {/* Ponytail extension */}
            <path d="M 54 30 C 62 25, 72 32, 70 45 C 68 55, 58 55, 54 48 Z" fill={hairColor} />
            {/* Main Head Hair */}
            <path d="M 28 40 C 20 40, 16 30, 20 20 C 24 10, 56 10, 60 20 C 64 30, 60 40, 52 40 Z" fill={hairColor} />
            {/* Front bang */}
            <path d="M 21 24 C 28 17, 38 20, 42 27 C 45 20, 53 17, 59 24 C 55 18, 25 18, 21 24 Z" fill={hairColor} />
            {/* Hair tie */}
            <ellipse cx="55" cy="38" rx="3" ry="5" fill="#14B8A6" />
          </>
        );
      case 'bun':
        return (
          <>
            {/* Top Bun */}
            <circle cx="40" cy="14" r="11" fill={hairColor} />
            {/* Main Hair */}
            <path d="M 28 40 C 20 40, 16 30, 20 20 C 24 10, 56 10, 60 20 C 64 30, 60 40, 52 40 Z" fill={hairColor} />
            {/* Bangs */}
            <path d="M 22 24 C 30 17, 38 20, 42 27 C 45 20, 53 17, 58 24 Z" fill={hairColor} />
          </>
        );
      case 'curly':
        return (
          <>
            {/* Fluffy Curly Hair Outline */}
            <circle cx="23" cy="22" r="10" fill={hairColor} />
            <circle cx="31" cy="15" r="11" fill={hairColor} />
            <circle cx="49" cy="15" r="11" fill={hairColor} />
            <circle cx="57" cy="22" r="10" fill={hairColor} />
            <circle cx="19" cy="32" r="9" fill={hairColor} />
            <circle cx="61" cy="32" r="9" fill={hairColor} />
            {/* Center Fill */}
            <path d="M 28 40 C 20 40, 16 30, 20 20 C 24 10, 56 10, 60 20 C 64 30, 60 40, 52 40 Z" fill={hairColor} />
            <path d="M 22 25 C 32 18, 48 18, 58 25" fill="none" stroke={hairColor} strokeWidth="6" strokeLinecap="round" />
          </>
        );
      default:
        return null;
    }
  };

  // Render Face Expressions
  const renderExpression = () => {
    switch (expression) {
      case 'smile':
        return (
          <>
            {/* Eyes */}
            <circle cx="33" cy="33" r="2.5" fill="#2D3748" />
            <circle cx="47" cy="33" r="2.5" fill="#2D3748" />
            {/* Smile */}
            <path d="M 36 41 Q 40 45 44 41" fill="none" stroke="#2D3748" strokeWidth="2.5" strokeLinecap="round" />
            {/* Blushing */}
            <circle cx="29" cy="37" r="2.5" fill="#F87171" opacity="0.4" />
            <circle cx="51" cy="37" r="2.5" fill="#F87171" opacity="0.4" />
          </>
        );
      case 'happy':
        return (
          <>
            {/* Happy Curved Eyes */}
            <path d="M 30 34 Q 33 30 36 34" fill="none" stroke="#2D3748" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 44 34 Q 47 30 50 34" fill="none" stroke="#2D3748" strokeWidth="2.5" strokeLinecap="round" />
            {/* Open Mouth Joy */}
            <path d="M 36 40 Q 40 46 44 40 Z" fill="#E11D48" />
            {/* Blushing */}
            <circle cx="28" cy="37" r="3.5" fill="#F87171" opacity="0.5" />
            <circle cx="52" cy="37" r="3.5" fill="#F87171" opacity="0.5" />
          </>
        );
      case 'determined':
        return (
          <>
            {/* Focused Eyes */}
            <circle cx="33" cy="33" r="2.5" fill="#2D3748" />
            <circle cx="47" cy="33" r="2.5" fill="#2D3748" />
            {/* Focused Eyebrows */}
            <path d="M 29 28 L 35 30" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" />
            <path d="M 51 28 L 45 30" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" />
            {/* Confident Smile */}
            <path d="M 37 42 Q 40 40 43 42" fill="none" stroke="#2D3748" strokeWidth="2.5" strokeLinecap="round" />
          </>
        );
      case 'neutral':
      default:
        return (
          <>
            {/* Pleasant Eyes */}
            <circle cx="33" cy="33" r="2.5" fill="#2D3748" />
            <circle cx="47" cy="33" r="2.5" fill="#2D3748" />
            {/* Soft Line */}
            <line x1="37" y1="41" x2="43" y2="41" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" />
          </>
        );
    }
  };

  // Render Accessories
  const renderAccessory = () => {
    switch (accessory) {
      case 'glasses':
        return (
          <>
            {/* Stylish Circular Glasses */}
            <circle cx="33" cy="33" r="6" fill="none" stroke="#B45309" strokeWidth="2" />
            <circle cx="47" cy="33" r="6" fill="none" stroke="#B45309" strokeWidth="2" />
            <line x1="39" y1="33" x2="41" y2="33" stroke="#B45309" strokeWidth="2" />
            {/* Frame temple bars */}
            <path d="M 27 33 L 24 31" stroke="#B45309" strokeWidth="1.5" />
            <path d="M 53 33 L 56 31" stroke="#B45309" strokeWidth="1.5" />
          </>
        );
      case 'mask':
        return (
          <>
            {/* Light Blue Medical Mask */}
            <path d="M 28 38 L 52 38 L 49 48 L 31 48 Z" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1" />
            {/* Mask pleat details */}
            <line x1="30" y1="41" x2="50" y2="41" stroke="#60A5FA" strokeWidth="1" />
            <line x1="31" y1="44" x2="49" y2="44" stroke="#60A5FA" strokeWidth="1" />
            {/* Mask Straps */}
            <path d="M 28 38 L 22 36" stroke="#E2E8F0" strokeWidth="1" />
            <path d="M 28 45 L 22 43" stroke="#E2E8F0" strokeWidth="1" />
            <path d="M 52 38 L 58 36" stroke="#E2E8F0" strokeWidth="1" />
            <path d="M 52 45 L 58 43" stroke="#E2E8F0" strokeWidth="1" />
          </>
        );
      case 'stethoscope':
        return (
          <>
            {/* Stethoscope Tubing behind neck & coming down */}
            <path d="M 23 48 C 21 60, 24 66, 32 72" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 57 48 C 59 60, 56 66, 48 72" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
            {/* Chest Piece */}
            <circle cx="48" cy="73" r="3.5" fill="#94A3B8" stroke="#475569" strokeWidth="1.5" />
            <circle cx="48" cy="73" r="1.5" fill="#E2E8F0" />
            {/* Earpieces resting around neck */}
            <path d="M 25 46 Q 23 40 25 46" fill="none" stroke="#94A3B8" strokeWidth="1.5" />
          </>
        );
      case 'none':
      default:
        return null;
    }
  };

  // Construct class name with background
  const isCustomBg = bgColor.startsWith('#') || bgColor.startsWith('linear-gradient') || bgColor.startsWith('radial-gradient');
  const bgClass = isCustomBg 
    ? '' 
    : (bgColor.includes('from-') ? `bg-gradient-to-br ${bgColor}` : bgColor);
  const bgStyle = isCustomBg ? { background: bgColor } : {};

  return (
    <div 
      className={`relative overflow-hidden rounded-full shadow-inner flex items-center justify-center select-none ${bgClass} ${className}`}
      style={bgStyle}
    >
      <svg
        viewBox="0 0 80 80"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Hair Back if long */}
        {hairType === 'long' && renderHair()}

        {/* Neck */}
        <path
          d="M 36 46 L 44 46 L 43 56 L 37 56 Z"
          fill={skinColor}
          opacity="0.9"
          filter="brightness(0.92)"
        />

        {/* Face / Head */}
        <circle cx="40" cy="35" r="16" fill={skinColor} />

        {/* Hair Front */}
        {hairType !== 'long' && renderHair()}

        {/* Eyes, Mouth, Blushing */}
        {accessory !== 'mask' ? renderExpression() : (
          <>
            {/* Eyes only if masked */}
            <circle cx="33" cy="33" r="2.5" fill="#2D3748" />
            <circle cx="47" cy="33" r="2.5" fill="#2D3748" />
          </>
        )}

        {/* Medical Scrubs Body */}
        <path
          d="M 18 80 C 18 58, 25 56, 40 56 C 55 56, 62 58, 62 80 Z"
          fill={scrubColor}
        />

        {/* Scrub Collar V-Neck cutout */}
        <path
          d="M 33 56 L 40 66 L 47 56 Z"
          fill={skinColor}
          filter="brightness(0.95)"
        />

        {/* Accessories */}
        {renderAccessory()}
      </svg>
    </div>
  );
}
