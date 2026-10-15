/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type InternshipCategory = '基護' | '內外一' | '內外二' | '產科' | '兒科' | '精神科' | '社區';

export interface ReviewScores {
  theory: number;    // 注重學理
  attitude: number;  // 態度要求
  patience: number;  // 指導耐心
  workload: number;  // 作業份量
}

export interface AvatarConfig {
  skinColor: string;     // e.g. "#FFD8B1", "#E0A96D", "#F2D2BD", "#FAD6A5"
  hairType: 'short' | 'long' | 'ponytail' | 'bun' | 'curly';
  hairColor: string;    // e.g. "#1A1A1A", "#4A2F13", "#D4AF37", "#9E2A2B"
  expression: 'smile' | 'happy' | 'determined' | 'neutral';
  scrubColor: string;   // e.g. "#0D9488", "#0284C7", "#EC4899", "#8B5CF6" (Medical Scrubs)
  accessory: 'none' | 'stethoscope' | 'mask' | 'glasses';
  bgColor: string;      // Tailwind classes like gradient or flat, e.g. "from-teal-400 to-emerald-600"
}

export interface User {
  id: string;
  email: string;
  username: string;
  grade: string;        // e.g. "四技三甲"
  avatarConfig: AvatarConfig;
}

export interface Review {
  id: string;
  userId?: string; // Optional user association for editing/author verification
  userEmail?: string;
  rating: number; // 綜合評分
  author: string;
  grade: string; // 實習年級/梯次, e.g. "四技三甲", "二技一乙"
  content: string;
  experience?: string; // 實習實際情況/事件備註
  createdAt: string;
  scores: ReviewScores;
  tags?: string[];
  avatarConfig?: AvatarConfig; // Attached custom avatar
  likes?: string[]; // IDs of users who liked
  dislikes?: string[]; // IDs of users who disliked
  reports?: string[]; // Array of userIds who reported this review
  isUnderReview?: boolean; // Hidden/under review flag
  originalContent?: string; // Original content backup
}

export interface Report {
  id: string;
  reporterUserId: string;
  reporterEmail: string;
  targetUserId: string;
  targetReviewId: string;
  targetReviewContent: string;
  instructorId: string;
  instructorName: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  isArchived?: boolean;
  resolutionReason?: string;
  resolvedAt?: string;
}

export interface Notification {
  id: string;
  userId: string; // "all" for system announcements, or specific userId
  title: string;
  content: string;
  type: 'announcement' | 'personal';
  isRead?: boolean;
  createdAt: string;
}

export interface InstructorPrecautions {
  theoryFocus: string;   // 學理要求說明
  attitudeFocus: string; // 態度與禮貌要求
  workloadFocus: string; // 作業與技術單要求
  gradingStyle: string;  // 給分與考試風格
}

export interface Instructor {
  id: string;
  creatorId?: string; // ID of the user who created this instructor profile
  name: string;
  category: InternshipCategory;
  hospital: string;      // 實習醫院與病房, e.g. "台北榮總 92病房"
  background: string;    // 學經歷與背景簡介
  rating: number;        // 平均綜合星等
  precautions: InstructorPrecautions;
  tags: string[];        // 標籤, e.g. ["佛心", "學理魔人", "重態度", "技術流"]
  reviews: Review[];
  createdAt: string;
}

export type ThreadCategory = 
  | '全部'
  | '實習日常'
  | '技術學理'
  | '個案交班'
  | '選站志願'
  | '求生提問'
  | '護生樹洞';

export interface ThreadReply {
  id: string;
  threadId: string;
  userId: string;
  userEmail?: string;
  authorName: string;
  grade: string;
  avatarConfig?: AvatarConfig;
  content: string;
  isAnonymous?: boolean;
  likes?: string[];
  createdAt: string;
}

export interface Thread {
  id: string;
  userId: string;
  userEmail: string;
  authorName: string;
  grade: string;
  avatarConfig?: AvatarConfig;
  content: string;
  category: ThreadCategory;
  tags?: string[];
  likes?: string[]; // IDs of users who liked
  replyCount?: number;
  replies?: ThreadReply[];
  isAnonymous?: boolean;
  isPinned?: boolean;
  hospitalTag?: string; // Optional hospital or ward tag
  createdAt: string;
  updatedAt?: string;
}
