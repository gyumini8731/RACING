/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RaceRecord } from '../types';
import { RANK_INFO } from '../data';
import { formatWon } from '../utils';
import { Clock, Trash2, ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react';

interface HistoryLogProps {
  records: RaceRecord[];
  onClearHistory: () => void;
}

export const HistoryLog: React.FC<HistoryLogProps> = ({ records, onClearHistory }) => {
  return (
    <div className="bg-[#1A1D24] border border-slate-800 rounded-lg p-5 md:p-6 shadow-xl space-y-4 text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-display font-medium text-slate-100">
            📊 베팅 경기 전적 일지 (Betting History Log)
          </h2>
        </div>
        {records.length > 0 && (
          <button
            onClick={onClearHistory}
            type="button"
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors py-1 px-2.5 rounded bg-red-500/10 hover:bg-red-500/20"
          >
            <Trash2 className="w-3.5 h-3.5" />
            이력 초기화
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded bg-slate-950/40 border border-slate-900">
          <span className="text-4xl mb-3">📋</span>
          <p className="text-sm font-medium text-slate-400">아직 진행된 경마 배팅 기록이 없습니다.</p>
          <p className="text-xs text-slate-600 mt-1">상단의 PLAY 버튼을 눌러 승률 높은 마필에 배팅해 보세요!</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-slate-800 bg-slate-950">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 font-mono text-xs text-left">
              <thead className="bg-[#1A1D24] text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3">일시</th>
                  <th scope="col" className="px-5 py-3">배팅 경주마</th>
                  <th scope="col" className="px-5 py-3">배팅 머니</th>
                  <th scope="col" className="px-5 py-3 text-center">결과 순위</th>
                  <th scope="col" className="px-5 py-3">수령액</th>
                  <th scope="col" className="px-5 py-3 text-right">최종 손익</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-950 text-slate-300 bg-slate-950/40">
                {records.map((record) => {
                  const betHorseName = record.participatingHorses.find(
                    (h) => h.id === record.bet.horseId
                  )?.name.split(' (')[0] || '삭제된 마필';
                  
                  const betHorseRank = record.participatingHorses.find(
                    (h) => h.id === record.bet.horseId
                  )?.rank || 'common';

                  const finishRankIndex = record.finalRankings.indexOf(record.bet.horseId);
                  const finishRankNum = finishRankIndex + 1; // 1 to 5

                  const isProfit = record.profit > 0;
                  const isLoss = record.profit < 0;

                  return (
                    <tr key={record.id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="px-5 py-3 text-slate-500 text-[10px] whitespace-nowrap">
                        {record.date}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${RANK_INFO[betHorseRank].color}`} />
                          <span className="truncate max-w-[120px]">{betHorseName}</span>
                          <span className={`text-[9px] uppercase font-bold px-1 rounded ${RANK_INFO[betHorseRank].bgLight} ${RANK_INFO[betHorseRank].textColor}`}>
                            {betHorseRank}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-400">
                        {record.bet.amount.toLocaleString()}원
                      </td>
                      <td className="px-5 py-3 text-center font-bold">
                        <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] ${
                          finishRankNum === 1 
                            ? 'bg-amber-400 text-slate-900' 
                            : finishRankNum === 2 
                            ? 'bg-slate-300 text-slate-900' 
                            : finishRankNum === 3 
                            ? 'bg-amber-700 text-amber-50' 
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {finishRankNum}등
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-300">
                        {record.payout.toLocaleString()}원
                      </td>
                      <td className="px-5 py-3 text-right font-bold whitespace-nowrap">
                        {isLoss ? (
                          <span className="text-red-400 flex items-center justify-end gap-0.5">
                            <ArrowDownRight className="w-3 h-3" />
                            {record.profit.toLocaleString()}원
                          </span>
                        ) : isProfit ? (
                          <span className="text-emerald-400 flex items-center justify-end gap-0.5">
                            <ArrowUpRight className="w-3 h-3" />
                            +{record.profit.toLocaleString()}원
                          </span>
                        ) : (
                          <span className="text-slate-400">0원</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
