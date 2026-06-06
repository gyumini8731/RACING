/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Horse } from './types';

export const INITIAL_HORSES: Horse[] = [
  // 전설 (Legend) - Rank 1 (Fastest)
  {
    id: 'l1',
    name: '적토마 (Red Hare)',
    rank: 'legend',
    baseSpeed: 13.5,
    speedVariance: 2.2,
    color: '#ef4444', // Red
    emoji: '🐎',
    winCount: 0,
    totalRaces: 0,
  },
  {
    id: 'l2',
    name: '골드쉽 (Gold Ship)',
    rank: 'legend',
    baseSpeed: 13.2,
    speedVariance: 2.5,
    color: '#eab308', // Gold
    emoji: '🐴',
    winCount: 0,
    totalRaces: 0,
  },
  {
    id: 'l3',
    name: '천마 페가수스 (Pegasus)',
    rank: 'legend',
    baseSpeed: 13.6,
    speedVariance: 1.8,
    color: '#38bdf8', // Sky Blue
    emoji: '🦄',
    winCount: 0,
    totalRaces: 0,
  },
  {
    id: 'l4',
    name: '번개러너 (Bolt Runner)',
    rank: 'legend',
    baseSpeed: 13.4,
    speedVariance: 2.1,
    color: '#f97316', // Orange
    emoji: '⚡',
    winCount: 0,
    totalRaces: 0,
  },
  {
    id: 'l5',
    name: '크로노스 (Chronos)',
    rank: 'legend',
    baseSpeed: 13.3,
    speedVariance: 2.3,
    color: '#a855f7', // Purple
    emoji: '☄️',
    winCount: 0,
    totalRaces: 0,
  },

  // 신화 (Myth) - Rank 2
  {
    id: 'm1',
    name: '슬레이프니르 (Sleipnir)',
    rank: 'myth',
    baseSpeed: 12.0,
    speedVariance: 2.0,
    color: '#3b82f6', // Blue
    emoji: '🛡️',
    winCount: 0,
    totalRaces: 0,
  },
  {
    id: 'm2',
    name: '포세이돈 (Poseidon)',
    rank: 'myth',
    baseSpeed: 11.8,
    speedVariance: 2.2,
    color: '#06b6d4', // Cyan
    emoji: '🔱',
    winCount: 0,
    totalRaces: 0,
  },
  {
    id: 'm3',
    name: '발키리 (Valkyrie)',
    rank: 'myth',
    baseSpeed: 12.2,
    speedVariance: 1.9,
    color: '#ec4899', // Pink
    emoji: '⚔️',
    winCount: 0,
    totalRaces: 0,
  },
  {
    id: 'm4',
    name: '피닉스 (Phoenix)',
    rank: 'myth',
    baseSpeed: 12.1,
    speedVariance: 2.4,
    color: '#f43f5e', // Rose
    emoji: '🔥',
    winCount: 0,
    totalRaces: 0,
  },
  {
    id: 'm5',
    name: '헬리오스 (Helios)',
    rank: 'myth',
    baseSpeed: 11.9,
    speedVariance: 2.1,
    color: '#f59e0b', // Amber
    emoji: '☀️',
    winCount: 0,
    totalRaces: 0,
  },

  // 영웅 (Hero) - Rank 3
  {
    id: 'h1',
    name: '글래디에이터 (Gladiator)',
    rank: 'hero',
    baseSpeed: 10.5,
    speedVariance: 1.8,
    color: '#10b981', // Emerald
    emoji: '🏆',
    winCount: 0,
    totalRaces: 0,
  },
  {
    id: 'h2',
    name: '아킬레우스 (Achilles)',
    rank: 'hero',
    baseSpeed: 10.7,
    speedVariance: 2.3,
    color: '#6366f1', // Indigo
    emoji: '🎖️',
    winCount: 0,
    totalRaces: 0,
  },
  {
    id: 'h3',
    name: '카이사르 (Caesar)',
    rank: 'hero',
    baseSpeed: 10.4,
    speedVariance: 1.6,
    color: '#6b7280', // Gray
    emoji: '🦁',
    winCount: 0,
    totalRaces: 0,
  },
  {
    id: 'h4',
    name: '나폴레옹 (Napoleon)',
    rank: 'hero',
    baseSpeed: 10.3,
    speedVariance: 2.0,
    color: '#14b8a6', // Teal
    emoji: '🦅',
    winCount: 0,
    totalRaces: 0,
  },
  {
    id: 'h5',
    name: '다크나이트 (Dark Knight)',
    rank: 'hero',
    baseSpeed: 10.6,
    speedVariance: 2.2,
    color: '#1e293b', // Slate Dark
    emoji: '🦇',
    winCount: 0,
    totalRaces: 0,
  },

  // 희귀 (Rare) - Rank 4
  {
    id: 'r1',
    name: '태풍 (Typhoon)',
    rank: 'rare',
    baseSpeed: 9.2,
    speedVariance: 1.8,
    color: '#0ea5e9', // Sky Blue
    emoji: '🌀',
    winCount: 0,
    totalRaces: 0,
  },
  {
    id: 'r2',
    name: '흑송곳 (Black Auger)',
    rank: 'rare',
    baseSpeed: 9.0,
    speedVariance: 2.4,
    color: '#475569', // Slate
    emoji: '🐗',
    winCount: 0,
    totalRaces: 0,
  },
  {
    id: 'r3',
    name: '밤안개 (Night Fog)',
    rank: 'rare',
    baseSpeed: 9.3,
    speedVariance: 1.5,
    color: '#8b5cf6', // Violet
    emoji: '🌫️',
    winCount: 0,
    totalRaces: 0,
  },
  {
    id: 'r4',
    name: '질풍가도 (Gale Wind)',
    rank: 'rare',
    baseSpeed: 9.1,
    speedVariance: 2.0,
    color: '#059669', // Emerald dark
    emoji: '🍃',
    winCount: 0,
    totalRaces: 0,
  },
  {
    id: 'r5',
    name: '호랑이발톱 (Tiger Claw)',
    rank: 'rare',
    baseSpeed: 8.9,
    speedVariance: 2.2,
    color: '#b45309', // Amber dark
    emoji: '🐅',
    winCount: 0,
    totalRaces: 0,
  },

  // 일반 (Common) - Rank 5 (Slowest)
  {
    id: 'c1',
    name: '바둑이 (Badugi)',
    rank: 'common',
    baseSpeed: 7.7,
    speedVariance: 1.6,
    color: '#d97706', // Brown Amber
    emoji: '🐕',
    winCount: 0,
    totalRaces: 0,
  },
  {
    id: 'c2',
    name: '돌쇠 (Dolsoe)',
    rank: 'common',
    baseSpeed: 7.5,
    speedVariance: 1.5,
    color: '#71717a', // Zinc
    emoji: '🪵',
    winCount: 0,
    totalRaces: 0,
  },
  {
    id: 'c3',
    name: '누렁이 (Nureongi)',
    rank: 'common',
    baseSpeed: 7.6,
    speedVariance: 1.8,
    color: '#ca8a04', // Yellow dark
    emoji: '🐂',
    winCount: 0,
    totalRaces: 0,
  },
  {
    id: 'c4',
    name: '씩씩이 (Sik-Sik)',
    rank: 'common',
    baseSpeed: 7.8,
    speedVariance: 1.4,
    color: '#4b5563', // Grey
    emoji: '🌱',
    winCount: 0,
    totalRaces: 0,
  },
  {
    id: 'c5',
    name: '점박이 (Jeombaki)',
    rank: 'common',
    baseSpeed: 7.4,
    speedVariance: 2.0,
    color: '#1f2937', // Slate Dark gray
    emoji: '🐾',
    winCount: 0,
    totalRaces: 0,
  },
];

export const RANK_INFO = {
  legend: {
    label: '전설 (Legend)',
    color: 'from-orange-500 to-red-600',
    textColor: 'text-red-500',
    bgLight: 'bg-red-500/10 border-red-500/30',
    speedDesc: '가장 빠름 (Base Speed: 13.2~13.6)',
  },
  myth: {
    label: '신화 (Myth)',
    color: 'from-purple-500 to-indigo-600',
    textColor: 'text-purple-400',
    bgLight: 'bg-purple-500/10 border-purple-500/30',
    speedDesc: '매우 빠름 (Base Speed: 11.8~12.2)',
  },
  hero: {
    label: '영웅 (Hero)',
    color: 'from-blue-500 to-cyan-600',
    textColor: 'text-blue-400',
    bgLight: 'bg-blue-500/10 border-blue-500/30',
    speedDesc: '빠름 (Base Speed: 10.3~10.7)',
  },
  rare: {
    label: '희귀 (Rare)',
    color: 'from-emerald-500 to-teal-600',
    textColor: 'text-emerald-400',
    bgLight: 'bg-emerald-500/10 border-emerald-500/30',
    speedDesc: '보통 (Base Speed: 8.9~9.3)',
  },
  common: {
    label: '일반 (Common)',
    color: 'from-stone-500 to-slate-600',
    textColor: 'text-stone-400',
    bgLight: 'bg-stone-500/10 border-stone-500/30',
    speedDesc: '느림 (Base Speed: 7.4~7.8)',
  },
};
