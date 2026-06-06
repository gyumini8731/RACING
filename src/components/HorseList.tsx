/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Horse } from '../types';
import { RANK_INFO } from '../data';
import { Trophy, HelpCircle, Activity } from 'lucide-react';

interface HorseListProps {
  horses: Horse[];
}

export const HorseList: React.FC<HorseListProps> = ({ horses }) => {
  // Group horses by rank
  const groupedHorses = horses.reduce((acc, horse) => {
    if (!acc[horse.rank]) {
      acc[horse.rank] = [];
    }
    acc[horse.rank].push(horse);
    return acc;
  }, {} as Record<string, Horse[]>);

  // Ordered list of ranks
  const rankOrder: ('legend' | 'myth' | 'hero' | 'rare' | 'common')[] = [
    'legend',
    'myth',
    'hero',
    'rare',
    'common',
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-display font-bold tracking-tight text-slate-100">
            마구간 및 등급 리스트 (Race Stable)
          </h2>
        </div>
        <p className="text-xs text-slate-400">총 25마리 등록됨 • 높은 등급일수록 속도가 증가합니다</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {rankOrder.map((rankKey) => {
          const rankDetails = RANK_INFO[rankKey];
          const horseGroup = groupedHorses[rankKey] || [];

          return (
            <div
              key={rankKey}
              className={`rounded-xl border border-slate-800/80 p-4 flex flex-col justify-between transition-all duration-300 bg-[#1A1D24] hover:bg-[#1f222b] hover:border-slate-700/60 shadow-lg ${rankDetails.bgLight}`}
            >
              <div>
                {/* Header Rank Badge */}
                <div className={`text-center py-1.5 px-3 rounded-lg bg-gradient-to-r ${rankDetails.color} font-display font-bold text-xs text-white uppercase tracking-wider mb-3 shadow`}>
                  {rankDetails.label}
                </div>
                
                <p className="text-[11px] text-slate-400 mb-4 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  {rankDetails.speedDesc}
                </p>

                {/* Horse Entries */}
                <div className="space-y-2.5">
                  {horseGroup.map((horse) => {
                    const winRate = horse.totalRaces > 0 
                      ? Math.round((horse.winCount / horse.totalRaces) * 100) 
                      : 0;

                    return (
                      <div
                        key={horse.id}
                        className="flex flex-col p-2 rounded-lg bg-slate-950/60 border border-slate-800/40 hover:border-slate-700/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg mr-1" role="img" aria-label="horse">
                            {horse.emoji}
                          </span>
                          <span className="font-semibold text-xs text-slate-200 text-right truncate flex-1 leading-tight">
                            {horse.name.split(' (')[0]}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 pb-0.5 border-t border-slate-800/20 pt-1">
                          <span>스피드 {horse.baseSpeed.toFixed(1)}</span>
                          <span>{horse.winCount}승 / {horse.totalRaces}전</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
