/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Horse } from '../types';
import { RANK_INFO } from '../data';
import { formatWon } from '../utils';
import { Coins, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react';

interface BetSelectionProps {
  lineup: Horse[];
  balance: number;
  onStartRace: (betHorseId: string, betAmount: number) => void;
  onCancel: () => void;
}

export const BetSelection: React.FC<BetSelectionProps> = ({
  lineup,
  balance,
  onStartRace,
  onCancel,
}) => {
  const [selectedHorseId, setSelectedHorseId] = useState<string>('');
  const [betInput, setBetInput] = useState<string>('10000'); // Default bet is 10,000 KRW
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Auto-select the first horse by default
  useEffect(() => {
    if (lineup.length > 0) {
      setSelectedHorseId(lineup[0].id);
    }
  }, [lineup]);

  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setBetInput(value);
  };

  const adjustBet = (amount: number) => {
    const current = parseInt(betInput || '0', 10);
    const updated = Math.max(0, current + amount);
    setBetInput(Math.min(balance, updated).toString());
  };

  const handleAllIn = () => {
    setBetInput(balance.toString());
  };

  const handleClear = () => {
    setBetInput('0');
  };

  const betAmount = parseInt(betInput || '0', 10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHorseId) {
      setErrorMsg('경주에 배팅할 말을 기수단에서 선택해 주세요!');
      return;
    }
    if (betAmount <= 0) {
      setErrorMsg('배팅 금액은 최소 1만원 이상이어야 합니다.');
      return;
    }
    if (betAmount > balance) {
      setErrorMsg('소지하고 계신 자금을 초과하여 배팅하실 수 없습니다.');
      return;
    }
    if (betAmount % 10000 !== 0) {
      const isAllInWithLowBalance = balance < 10000 && betAmount === balance;
      if (!isAllInWithLowBalance) {
        setErrorMsg('배팅 금액은 1만원 단위(예: 10,000원, 20,000원 등)로만 설정하실 수 있습니다. (보유 자금이 1만원 미만일 때만 전액 배팅 허용)');
        return;
      }
    }

    setErrorMsg('');
    onStartRace(selectedHorseId, betAmount);
  };

  const selectedHorse = lineup.find(h => h.id === selectedHorseId);

  return (
    <div className="max-w-4xl mx-auto bg-[#1A1D24] border border-slate-800 rounded-lg shadow-xl p-6 md:p-8 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
        <div>
          <button
            onClick={onCancel}
            type="button"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            마구간으로 돌아가기
          </button>
          <h2 className="text-2xl font-black italic uppercase tracking-tight text-white flex items-center gap-2">
            🐎 라인업 및 배팅 금액 선택
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            금번 경주에 배치된 5마리의 말 중 우승을 예측하는 말에 배팅해 주세요.
          </p>
        </div>

        {/* Balance Display */}
        <div className="bg-slate-900 border border-slate-800 rounded-md px-5 py-3 flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Coins className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">나의 보유 자금</div>
            <div className="text-lg font-mono font-bold text-emerald-400">
              {formatWon(balance)}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Horse Selector Grid */}
        <div>
          <label className="block text-sm font-semibold text-slate-350 mb-3">
            1. 예측 우승마 선택 (러너 카드)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {lineup.map((horse) => {
              const rankDetails = RANK_INFO[horse.rank];
              const isSelected = horse.id === selectedHorseId;

              return (
                <button
                  key={horse.id}
                  type="button"
                  onClick={() => {
                    setSelectedHorseId(horse.id);
                    setErrorMsg('');
                  }}
                  className={`relative text-left flex flex-col justify-between p-4 rounded-md border transition-all duration-200 ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500 shadow-md ring-1 ring-amber-500/50 scale-[1.02]'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-950/90 hover:border-slate-700'
                  }`}
                >
                  {/* Selected Indicator Glow */}
                  {isSelected && (
                    <div className="absolute top-1 right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </div>
                  )}

                  <div className="w-full text-center mb-2 pt-1">
                    <span className="text-3xl filter drop-shadow" role="img" aria-label="horse">
                      {horse.emoji}
                    </span>
                  </div>

                  <div className="w-full">
                    {/* Rank Badge */}
                    <div className={`text-[9px] font-bold text-center uppercase tracking-wide rounded py-0.5 mb-1 bg-gradient-to-r ${rankDetails.color} text-white`}>
                      {rankDetails.label}
                    </div>

                    <div className="font-bold text-xs text-slate-100 truncate text-center leading-tight">
                      {horse.name.split(' (')[0]}
                    </div>

                    <div className="flex flex-col gap-0.5 mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                      <div className="flex justify-between">
                        <span>속도 계수</span>
                        <span className="font-mono text-slate-400 font-semibold">{horse.baseSpeed.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>전적</span>
                        <span className="font-mono text-slate-400 font-semibold">{horse.winCount}승/{horse.totalRaces}전</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bet Amount Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Bet input */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-md p-5">
            <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center justify-between">
              <span>2. 배팅 금액 설정</span>
              <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                1만원 단위 전용
              </span>
            </label>
            
            <div className="relative rounded-lg shadow-sm">
              <input
                type="text"
                name="bet-amount"
                id="bet-amount"
                value={betInput === '' ? '' : parseInt(betInput || '0', 10).toLocaleString()}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setBetInput(raw);
                  setErrorMsg('');
                }}
                className="block w-full rounded bg-slate-950 border border-slate-800 px-4 py-3 text-lg font-mono font-semibold text-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right pr-12"
                placeholder="0"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                <span className="text-slate-400 font-bold text-sm">원</span>
              </div>
            </div>

            {/* Quick adjust buttons */}
            <div className="grid grid-cols-5 gap-1.5 mt-3">
              <button
                type="button"
                onClick={() => adjustBet(-10000)}
                className="py-1.5 px-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-[11px] font-semibold text-slate-300 transition-colors text-center"
              >
                -1만원
              </button>
              <button
                type="button"
                onClick={() => adjustBet(10000)}
                className="py-1.5 px-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-[11px] font-semibold text-slate-300 transition-colors text-center"
              >
                +1만원
              </button>
              <button
                type="button"
                onClick={() => adjustBet(50000)}
                className="py-1.5 px-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-[11px] font-semibold text-slate-300 transition-colors text-center"
              >
                +5만원
              </button>
              <button
                type="button"
                onClick={() => adjustBet(100000)}
                className="py-1.5 px-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-[11px] font-semibold text-slate-300 transition-colors text-center"
              >
                +10만원
              </button>
              <button
                type="button"
                onClick={handleAllIn}
                className="py-1.5 px-1 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 rounded text-[11px] font-bold text-amber-400 transition-colors text-center"
              >
                올인!
              </button>
            </div>

            <div className="flex justify-between items-center mt-3 text-xs text-slate-500 pr-1">
              <span>최대 배팅 가능: {formatWon(balance)}</span>
              <button
                type="button"
                onClick={handleClear}
                className="hover:text-slate-300 transition-colors underline"
              >
                초기화
              </button>
            </div>
          </div>

          {/* Expected Outputs Panel */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-md p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
                예상 입상 배당금 (Simulated Payout rates)
              </h3>
              
              <div className="space-y-2 font-mono">
                <div className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-900">
                  <span className="text-slate-400">선택된 경주마:</span>
                  <span className={`font-bold ${selectedHorse ? RANK_INFO[selectedHorse.rank].textColor : 'text-slate-400'}`}>
                    {selectedHorse ? selectedHorse.name : '선택 없음'}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-red-400 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span> 1등 우승배당 (2.0x)
                  </span>
                  <span className="font-bold text-sm text-red-400">
                    {formatWon(betAmount * 2)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-cyan-400 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span> 2등 준우승 (1.5x)
                  </span>
                  <span className="font-bold text-sm text-cyan-400">
                    {formatWon(Math.floor(betAmount * 1.5))}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-stone-400 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-stone-500 rounded-full"></span> 3등 본전회수 (1.0x)
                  </span>
                  <span className="font-bold text-sm text-stone-300">
                    {formatWon(betAmount)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 pb-1">
                  <span>4등 & 5등 탈락:</span>
                  <span>배팅 금액 전액 소멸 ({formatWon(0)})</span>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="mt-3 flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-2.5 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Call to action */}
        <div className="pt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 font-semibold rounded-md transition-all"
          >
            취소
          </button>
          <button
            type="submit"
            className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold font-display rounded-md shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            경주장 입장하기
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
