/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Horse } from '../types';
import { RANK_INFO } from '../data';
import { formatWon } from '../utils';
import { Award, ArrowRight, ArrowLeft, RefreshCw, ThumbsUp, AlertTriangle } from 'lucide-react';

interface RaceResultsProps {
  lineup: Horse[];
  finalRankings: string[]; // Order of horseIds from 1st to 5th
  bet: {
    horseId: string;
    amount: number;
  };
  onRestart: () => void;
}

export const RaceResults: React.FC<RaceResultsProps> = ({
  lineup,
  finalRankings,
  bet,
  onRestart,
}) => {
  // Map horse details to their finishing ranks
  const rankedHorses = finalRankings.map((id, index) => {
    const horse = lineup.find((h) => h.id === id)!;
    return {
      rankNum: index + 1,
      ...horse,
    };
  });

  const firstPlace = rankedHorses[0];
  const secondPlace = rankedHorses[1];
  const thirdPlace = rankedHorses[2];

  // Find user's horse Rank & Outcomes
  const userRankIndex = finalRankings.indexOf(bet.horseId);
  const userFinishRank = userRankIndex + 1; // 1 to 5
  const userHorse = lineup.find((h) => h.id === bet.horseId)!;

  let multiplier = 0;
  if (userFinishRank === 1) {
    multiplier = 2.0;
  } else if (userFinishRank === 2) {
    multiplier = 1.5;
  } else if (userFinishRank === 3) {
    multiplier = 1.0;
  }

  const payoutAmount = Math.floor(bet.amount * multiplier);
  const netProfit = payoutAmount - bet.amount;
  const isLoss = multiplier === 0;
  const isProfit = multiplier > 1;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Payout Announcement Header Card */}
      <div className={`rounded-2xl border p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 ${
        isLoss 
          ? 'bg-red-500/10 border-red-500/20' 
          : isProfit 
          ? 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10' 
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
          <div className={`p-4 rounded-2xl ${
            isLoss 
              ? 'bg-red-500/20 text-red-400' 
              : isProfit 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-slate-800 text-slate-300'
          }`}>
            {isLoss ? (
              <AlertTriangle className="w-10 h-10 animate-bounce" />
            ) : (
              <Award className="w-10 h-10 animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-slate-100">
              {isLoss 
                ? '아쉽네요! 배팅 자금을 모두 잃었습니다.' 
                : isProfit
                ? '축하합니다! 배팅 마가 입상하며 수익을 냈습니다!'
                : '보전 완료! 3등 준수 성적으로 투자금을 회수했습니다.'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              선택마: <span className="font-semibold text-slate-200">{userHorse.name}</span> • 최종성적:{' '}
              <span className={`font-bold ${
                userFinishRank === 1 ? 'text-amber-400' : userFinishRank === 2 ? 'text-slate-300' : 'text-amber-700'
              }`}>{userFinishRank}등</span>
            </p>
          </div>
        </div>

        {/* Profit detail block */}
        <div className="bg-slate-950/80 border border-slate-800/60 rounded-xl px-6 py-4 flex flex-col items-center justify-center font-mono w-full md:w-auto">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">최종 정산 결과</span>
          <span className={`text-2xl font-bold mt-1 ${
            isLoss 
              ? 'text-red-400' 
              : isProfit 
              ? 'text-emerald-400' 
              : 'text-slate-300'
          }`}>
            {isLoss ? `-${formatWon(bet.amount)}` : isProfit ? `+${formatWon(netProfit)}` : '변동 없음 (±0)'}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">
            배당 계수 {multiplier.toFixed(1)}배 • 환급 {formatWon(payoutAmount)}
          </span>
        </div>
      </div>

      {/* Podium Display (3D-like perspective) */}
      <div className="bg-[#1A1D24] border border-slate-800 rounded-lg p-6 shadow-xl">
        <h3 className="text-base font-display font-medium text-slate-300 border-b border-slate-800 pb-3 mb-8 text-center sm:text-left">
          🏅 경주 우승 결과 시상식 (Race Podium)
        </h3>

        {/* Podium visualization block */}
        <div className="flex flex-col sm:flex-row items-end justify-center gap-6 sm:gap-4 md:gap-8 pt-8 pb-4">
          
          {/* 2nd Place Stand */}
          {secondPlace && (
            <div className="flex flex-col items-center w-full sm:w-44 max-w-xs sm:order-1 order-2">
              {/* Horse Avatar Bubble */}
              <div className="relative mb-3 flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-300 flex items-center justify-center text-3xl shadow">
                  {secondPlace.emoji}
                </div>
                <div className="absolute -bottom-2 bg-slate-300 text-slate-950 font-bold leading-none py-0.5 px-2 rounded text-[10px]">
                  2ND
                </div>
              </div>
              <div className="text-sm font-semibold text-slate-100 font-display truncate w-full text-center">
                {secondPlace.name.split(' (')[0]}
              </div>
              <div className={`text-[10px] font-bold ${RANK_INFO[secondPlace.rank].textColor} uppercase`}>
                {secondPlace.rank}
              </div>
              {/* Platform block */}
              <div className="w-full h-16 bg-gradient-to-t from-slate-800/80 to-slate-700/80 rounded-t-lg border-t border-slate-600 flex items-center justify-center shadow mt-3">
                <span className="text-2xl font-black text-slate-300 uppercase">2등</span>
              </div>
            </div>
          )}

          {/* 1st Place Stand (Center, Tallest) */}
          {firstPlace && (
            <div className="flex flex-col items-center w-full sm:w-48 max-w-xs sm:order-2 order-1 transform sm:-translate-y-4">
              {/* Gold Crown / Horse Avatar */}
              <div className="relative mb-3 flex flex-col items-center">
                <span className="absolute -top-6 text-xl animate-bounce">👑</span>
                <div className="w-18 h-18 rounded-full bg-amber-500/10 border-4 border-amber-400 flex items-center justify-center text-4xl shadow-lg ring-4 ring-amber-500/20">
                  {firstPlace.emoji}
                </div>
                <div className="absolute -bottom-2 bg-amber-400 text-slate-950 font-bold leading-none py-0.5 px-2.5 rounded-full text-[10px] shadow">
                  CHAMPION
                </div>
              </div>
              <div className="text-base font-bold text-slate-100 font-display truncate w-full text-center">
                {firstPlace.name.split(' (')[0]}
              </div>
              <div className={`text-[11px] font-bold ${RANK_INFO[firstPlace.rank].textColor} uppercase`}>
                {firstPlace.rank}
              </div>
              {/* Platform block */}
              <div className="w-full h-24 bg-gradient-to-t from-amber-600/60 to-amber-500/70 rounded-t-lg border-t border-amber-400 flex items-center justify-center shadow-lg mt-3">
                <span className="text-3xl font-black text-amber-100 uppercase">1등</span>
              </div>
            </div>
          )}

          {/* 3rd Place Stand */}
          {thirdPlace && (
            <div className="flex flex-col items-center w-full sm:w-44 max-w-xs sm:order-3 order-3">
              {/* Horse Avatar Bubble */}
              <div className="relative mb-3 flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-amber-700 flex items-center justify-center text-3xl shadow">
                  {thirdPlace.emoji}
                </div>
                <div className="absolute -bottom-2 bg-amber-700 text-amber-100 font-bold leading-none py-0.5 px-2 rounded text-[10px]">
                  3RD
                </div>
              </div>
              <div className="text-sm font-semibold text-slate-100 font-display truncate w-full text-center">
                {thirdPlace.name.split(' (')[0]}
              </div>
              <div className={`text-[10px] font-bold ${RANK_INFO[thirdPlace.rank].textColor} uppercase`}>
                {thirdPlace.rank}
              </div>
              {/* Platform block */}
              <div className="w-full h-10 bg-gradient-to-t from-slate-900/60 to-amber-950/40 rounded-t-lg border-t border-amber-800/50 flex items-center justify-center shadow mt-3">
                <span className="text-xl font-bold text-amber-700 uppercase">3등</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Leaderboard Results Section */}
      <div className="bg-[#1A1D24] border border-slate-800 rounded-lg p-6 shadow-xl space-y-4">
        <h3 className="text-base font-display font-medium text-slate-200">
          📝 전체 경기 결과 리스트
        </h3>

        <div className="overflow-hidden rounded-md border border-slate-800 bg-slate-950">
          <table className="min-w-full divide-y divide-slate-800 font-mono text-xs text-left">
            <thead className="bg-[#1A1D24] text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th scope="col" className="px-5 py-3">순위</th>
                <th scope="col" className="px-5 py-3">경주마 명</th>
                <th scope="col" className="px-5 py-3">마필 등급</th>
                <th scope="col" className="px-5 py-3">마필 기본 스피드</th>
                <th scope="col" className="px-5 py-3 text-right">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-300 bg-slate-950/40">
              {rankedHorses.map((horse) => {
                const isBetted = horse.id === bet.horseId;
                const rankDetails = RANK_INFO[horse.rank];

                return (
                  <tr
                    key={horse.id}
                    className={`transition-colors ${
                      isBetted ? 'bg-emerald-500/10 hover:bg-emerald-500/15' : 'hover:bg-slate-900/20'
                    }`}
                  >
                    <td className="px-5 py-3.5 font-bold">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                        horse.rankNum === 1 
                          ? 'bg-amber-400 text-slate-950' 
                          : horse.rankNum === 2 
                          ? 'bg-slate-300 text-slate-950' 
                          : horse.rankNum === 3 
                          ? 'bg-amber-700 text-amber-50' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {horse.rankNum}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold flex items-center gap-2">
                      <span className="text-lg">{horse.emoji}</span>
                      <span>{horse.name}</span>
                    </td>
                    <td className="px-5 py-3.5 font-sans font-semibold">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${rankDetails.bgLight} ${rankDetails.textColor}`}>
                        {rankDetails.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-400">{horse.baseSpeed.toFixed(1)}</td>
                    <td className="px-5 py-3.5 text-right font-sans font-bold">
                      {isBetted ? (
                        <span className="text-emerald-400 text-xs flex items-center justify-end gap-1">
                          <ThumbsUp className="w-3.5 h-3.5 active:scale-95" />
                          내 베팅마
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Retry/Lobby CTA */}
        <div className="pt-4 flex justify-end gap-3">
          <button
            onClick={onRestart}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-slate-100 font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-slate-600/20"
          >
            <ArrowLeft className="w-4 h-4" />
            메인 대기실로 ( stables )
          </button>
        </div>
      </div>
    </div>
  );
};
