/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, AvatarConfig } from '../types';
import AvatarEditor from './AvatarEditor';
import { X, Save, User as UserIcon, GraduationCap } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
}

const NURSING_GRADES = [
  '護四一', '護四二', '護四三', '護四四', '護二一', '護二二', '其他'
];

export default function EditProfileModal({ user, onClose, onSave }: EditProfileModalProps) {
  const [username, setUsername] = useState(user.username);
  const [grade, setGrade] = useState(user.grade);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(user.avatarConfig);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    // Update session info
    const updatedUser: User = {
      ...user,
      username: username.trim(),
      grade: grade,
      avatarConfig: avatarConfig,
    };

    // Update in local database
    const storedUsers = JSON.parse(localStorage.getItem('ntunhs_users') || '[]');
    const updatedUsers = storedUsers.map((u: any) => {
      if (u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()) {
        return {
          ...u,
          username: username.trim(),
          grade: grade,
          avatarConfig: avatarConfig,
        };
      }
      return u;
    });
    localStorage.setItem('ntunhs_users', JSON.stringify(updatedUsers));

    // Sync to Cloud Firestore
    try {
      await setDoc(doc(db, 'users', user.email.toLowerCase()), {
        username: username.trim(),
        grade: grade,
        avatarConfig: avatarConfig,
      }, { merge: true });
    } catch (err) {
      console.error('Failed to sync profile changes to cloud', err);
    }

    onSave(updatedUser);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fadeIn max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4 flex-shrink-0 flex items-center justify-between bg-white">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900">個人資料與實習頭像設定</h3>
            <p className="text-slate-500 text-xs mt-0.5">更新帳號暱稱、年級與醫護形象，新發表的實習心得將同步套用</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Credentials Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Username */}
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">
                實習暱稱 / 姓名
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="請輸入暱稱"
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 text-xs focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/15 transition-all"
                  required
                />
              </div>
            </div>

            {/* Grade */}
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">
                實習年級與班別
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 text-xs focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/15 bg-white transition cursor-pointer text-slate-800"
                >
                  {NURSING_GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Interactive Avatar Editor */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-xs font-semibold text-slate-900 mb-3">
              實習頭像外觀工坊
            </h4>
            <AvatarEditor value={avatarConfig} onChange={setAvatarConfig} />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              儲存設定
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
