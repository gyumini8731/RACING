/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Horse } from '../types';
import { RANK_INFO } from '../data';
import { Play, RotateCcw, Volume2, FastForward, Flag } from 'lucide-react';

interface RaceTrackProps {
  lineup: Horse[];
  betHorseId: string;
  betAmount: number;
  onRaceEnd: (finalRankings: string[]) => void;
}

export const RaceTrack: React.FC<RaceTrackProps> = ({
  lineup,
  betHorseId,
  betAmount,
  onRaceEnd,
}) => {
  const [positions, setPositions] = useState<Record<string, number>>(
    lineup.reduce((acc, horse) => ({ ...acc, [horse.id]: 0 }), {})
  );
  const [boosts, setBoosts] = useState<Record<string, boolean>>(
    lineup.reduce((acc, horse) => ({ ...acc, [horse.id]: false }), {})
  );
  const [finishedHorses, setFinishedHorses] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [commentary, setCommentary] = useState<string>('경주 준비 완료! PLAY 버튼을 누르면 경주가 시작됩니다.');
  const [isFastMode, setIsFastMode] = useState<boolean>(false);

  const requestRef = useRef<number | null>(null);
  const finishOrderRef = useRef<string[]>([]);
  const lastCommentaryTimeRef = useRef<number>(0);
  
  // Track positions in a mutable ref for synchronous updates during requestAnimationFrame
  const positionsRef = useRef<Record<string, number>>(
    lineup.reduce((acc, horse) => ({ ...acc, [horse.id]: 0 }), {})
  );

  // Sync state and ref if lineup changes
  useEffect(() => {
    positionsRef.current = lineup.reduce((acc, horse) => ({ ...acc, [horse.id]: 0 }), {});
    setPositions(positionsRef.current);
    setBoosts(lineup.reduce((acc, horse) => ({ ...acc, [horse.id]: false }), {}));
    setFinishedHorses([]);
    finishOrderRef.current = [];
  }, [lineup]);

  // Generate random commentary lines
  const updateCommentary = (sortedByPos: { id: string; name: string; pos: number }[]) => {
    const now = Date.now();
    if (now - lastCommentaryTimeRef.current < 2500) return; // limit commentary rate

    const leader = sortedByPos[0];
    const second = sortedByPos[1];
    const averagePos = sortedByPos.reduce((sum, h) => sum + h.pos, 0) / 5;

    let text = '';
    const leaderCleanName = leader.name.split(' (')[0];
    const secondCleanName = second.name.split(' (')[0];

    if (averagePos < 10) {
      const starts = [
        '힘찬 함소리와 함께 다섯 마리의 경주마가 일제히 출발에 나섰습니다!',
        '스타트 게이트가 열렸습니다! 모든 말이 흔들림 없이 달려 나갑니다.',
        '초반 레이스! 아직은 선두를 가늠하기 어렵습니다. 팽팽한 기싸움!',
      ];
      text = starts[Math.floor(Math.random() * starts.length)];
    } else if (averagePos < 40) {
      const mids = [
        `현재 ${leaderCleanName} 기수가 앞장서며 승기를 잡기 위해 가속하고 있습니다!`,
        `순간 가속력 발군! ${leaderCleanName} 이(가) 선두 탈환에 성공했습니다.`,
        `${leaderCleanName} 과 ${secondCleanName} 의 선두 다툼이 대단합니다!`
      ];
      text = mids[Math.floor(Math.random() * mids.length)];
    } else if (averagePos < 75) {
      const deeps = [
        `중반부를 지나가는 기수들! ${leaderCleanName} 이(가) 선두를 굳건히 지키고 있으나 뒤이어 ${secondCleanName} 이(가) 거세게 압박합니다!`,
        `코너 돌파 중! ${leaderCleanName} 선수의 다리 움직임이 매섭습니다! 손에 땀을 쥐는 레이스!`,
        `현재 선두 ${leaderCleanName}, 그 뒤를 ${secondCleanName} 이(가) 0.5마일 가량 바짝 추격하고 있습니다!`
      ];
      text = deeps[Math.floor(Math.random() * deeps.length)];
    } else if (averagePos < 95) {
      const spurts = [
        `마지막 직선 코스! 승부를 가르는 스퍼트 구간입니다! 기수들 일제히 채찍질 장전!`,
        `숨 막히는 극후반전! 과연 ${leaderCleanName} 이(가) 결승점까지 질주를 유지할 수 있을 것인가!`,
        `이변이 발생하나?! 후미에 있던 말들이 대거 부스터를 가동하며 좁혀옵니다!`
      ];
      text = spurts[Math.floor(Math.random() * spurts.length)];
    } else {
      text = `와! 무시무시한 라스트 질주! 선두 ${leaderCleanName} 결승점을 불과 몇 미터 앞두고 있습니다!!`;
    }

    setCommentary(text);
    lastCommentaryTimeRef.current = now;
  };

  // Main game loop
  useEffect(() => {
    if (!isRunning) return;

    const tick = () => {
      let allFinished = true;
      const tickSpeedFactor = isFastMode ? 2.2 : 1.0;

      const nextPositions = { ...positionsRef.current };
      const activeFinished = [...finishOrderRef.current];

      lineup.forEach((horse) => {
        const currentPos = nextPositions[horse.id] ?? 0;
        if (currentPos < 100) {
          allFinished = false;

          // Random boost probability (approx 1% chance per tick)
          const shouldBoost = Math.random() < 0.015;
          if (shouldBoost && !boosts[horse.id]) {
            setBoosts((pb) => ({ ...pb, [horse.id]: true }));
            setTimeout(() => {
              setBoosts((pb) => ({ ...pb, [horse.id]: false }));
            }, 1200);
          }

          // Calculation based on Base Speed + Variance + Random Noise
          const randomFactor = 0.5 + Math.random() * 1.0; // 0.5 ~ 1.5
          const varianceNoise = (Math.random() - 0.5) * horse.speedVariance;
          
          // Adjust speeds proportionally
          const isBoosting = boosts[horse.id];
          const boostFactor = isBoosting ? 1.6 : 1.0;

          const increment = ((horse.baseSpeed + varianceNoise) * randomFactor * boostFactor * tickSpeedFactor) / 28;
          
          // Speed must always be positive
          const safeIncrement = Math.max(0.15, increment);
          const targetPos = currentPos + safeIncrement;

          if (targetPos >= 100) {
            nextPositions[horse.id] = 100;
            if (!activeFinished.includes(horse.id)) {
              activeFinished.push(horse.id);
              finishOrderRef.current = activeFinished;
              setFinishedHorses([...activeFinished]);
            }
          } else {
            nextPositions[horse.id] = targetPos;
          }
        }
      });

      positionsRef.current = nextPositions;
      setPositions(nextPositions);

      // Determine current ranking order to update live ticker
      const sortedActive = lineup
        .map((h) => ({ id: h.id, name: h.name, pos: nextPositions[h.id] ?? 0 }))
        .sort((a, b) => b.pos - a.pos);

      updateCommentary(sortedActive);

      if (!allFinished) {
        requestRef.current = requestAnimationFrame(tick);
      } else {
        setIsRunning(false);
        // Add final commentary
        const winnerId = finishOrderRef.current[0];
        const winner = lineup.find(h => h.id === winnerId);
        if (winner) {
          setCommentary(`🎉 경주 종료! 1등은 최고의 주파 실력을 보여준 [${winner.name.split(' (')[0]}] 입니다! 축하합니다!`);
        }
        
        // Wait briefly for user to appreciate finishing positions, then invoke main callback
        setTimeout(() => {
          onRaceEnd(finishOrderRef.current);
        }, 3000);
      }
    };

    requestRef.current = requestAnimationFrame(tick);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isRunning, lineup, boosts, isFastMode]);

  const handleStartRace = () => {
    setIsRunning(true);
    setCommentary('스타팅 피스톨 점화! 선수들 가속합니다!');
  };

  // Convert horse list representation sorted by current progress
  const currentLeaderboard = lineup
    .map((h) => {
      const pos = positions[h.id] || 0;
      const isFinished = finishedHorses.includes(h.id);
      const finishRank = isFinished ? finishedHorses.indexOf(h.id) + 1 : null;
      return { horse: h, pos, isFinished, finishRank };
    })
    .sort((a, b) => b.pos - a.pos);

  const bettedHorse = lineup.find(h => h.id === betHorseId);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Race Commentary & Status Banner */}
      <div className="bg-[#1A1D24] border border-slate-800 rounded-lg p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl animate-pulse">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">황금배 중계석 (Live Commentator)</div>
            <p className="text-sm md:text-base font-semibold text-slate-100 mt-0.5 leading-snug">
              {commentary}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isRunning && finishedHorses.length === 0 && (
            <button
              onClick={handleStartRace}
              type="button"
              className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-md shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              배팅 시동 및 경주 시인
            </button>
          )}

          {isRunning && (
            <button
              onClick={() => setIsFastMode(!isFastMode)}
              type="button"
              className={`px-4 py-2 text-xs font-bold rounded-md border transition-all flex items-center gap-1.5 ${
                isFastMode
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FastForward className="w-3.5 h-3.5" />
              {isFastMode ? '배속 주행중 (2.2x)' : '일반 배속'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Arena Board Left (Track Map) */}
        <div className="lg:col-span-3 bg-[#1A1D24] border border-slate-800 rounded-lg shadow-xl p-5 md:p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-base font-display font-medium text-slate-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
              2D 모션 시뮬레이터 실시간 트랙
            </h3>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> 스퍼트 돌입
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-[#015f38]"></span> 안전잔디(Lane)
              </div>
            </div>
          </div>

          {/* Racetrack Lanes */}
          <div className="relative rounded-md overflow-hidden bg-slate-950/70 border border-slate-900 shadow-inner p-2 md:p-4 space-y-3">
            
            {/* Lane Lines */}
            {lineup.map((horse, idx) => {
              const pos = positions[horse.id] || 0;
              const isBetted = horse.id === betHorseId;
              const isFinished = finishedHorses.includes(horse.id);
              const rankDetails = RANK_INFO[horse.rank];
              const isBoosting = boosts[horse.id];

              return (
                <div
                  key={horse.id}
                  className="relative h-14 md:h-16 flex items-center rounded-md border border-slate-800/40 bg-slate-900/40 transition-colors duration-200 overflow-hidden"
                >
                  {/* Lane background styling */}
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900/10 via-emerald-950/5 to-slate-900/10 opacity-60"></div>
                  
                  {/* Speed Line Overlay when boosting */}
                  {isBoosting && <div className="absolute inset-0 speed-bg"></div>}

                  {/* Lane Number Block */}
                  <div className="absolute left-0 inset-y-0 w-10 md:w-12 bg-slate-950 border-r border-slate-800 flex flex-col items-center justify-center font-mono z-10 select-none">
                    <span className="text-[10px] text-slate-500">LANE</span>
                    <span className={`text-sm md:text-base font-bold ${isBetted ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {idx + 1}
                    </span>
                  </div>

                  {/* Finish Checkered Line Trigger */}
                  <div className="absolute right-10 inset-y-0 w-1 flex flex-col justify-between py-1 z-10 pointer-events-none opacity-50">
                    {Array.from({ length: 6 }).map((_, bIdx) => (
                      <div
                        key={bIdx}
                        className={`w-1 h-1.5 ${
                          bIdx % 2 === 0 ? 'bg-white' : 'bg-black'
                        }`}
                      ></div>
                    ))}
                  </div>
                  <div className="absolute right-0 inset-y-0 w-10 bg-slate-950/80 flex items-center justify-center font-bold text-slate-500 text-xs border-l border-slate-800 z-10 pointer-events-none">
                    <Flag className="w-4 h-4 text-slate-400" />
                  </div>

                  {/* Horse Sprite Track Container (Coordinate bounds from start to finish) */}
                  <div className="absolute inset-y-0 left-12 md:left-14 right-12 md:right-14 pointer-events-none">
                    
                    {/* Floating Horse Sprite Wrapper */}
                    <div
                      className="absolute inset-y-0 flex items-center justify-center transition-all duration-75 ease-out"
                      style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
                    >
                      {/* Dust Trail particles if running */}
                      {isRunning && pos > 0 && pos < 100 && (
                        <div className="absolute -left-6 flex flex-col gap-1 items-center pointer-events-none">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-600/40 dust-particle"></div>
                          <div className="w-1 h-1 rounded-full bg-slate-500/20 dust-particle" style={{ animationDelay: '0.1s' }}></div>
                        </div>
                      )}

                      {/* Sprite Content */}
                      <div className="relative flex flex-col items-center">
                        
                        {/* Name Label */}
                        <div className="absolute -top-7 md:-top-8 left-1/2 -translate-x-1/2 flex flex-col items-center whitespace-nowrap z-20">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border leading-none font-display uppercase ${
                            isBetted 
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow shadow-emerald-500/30' 
                              : 'bg-slate-950/90 text-slate-300 border-slate-800'
                          }`}>
                            {horse.name.split(' (')[0]}
                          </span>
                          
                          {/* Triangle tag tail */}
                          <div className={`w-0.5 h-1 ${isBetted ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>
                        </div>

                        {/* Speed Booster glowing ring */}
                        <div className={`relative p-1 rounded-full flex items-center justify-center transition-transform ${
                          isBoosting 
                            ? 'bg-amber-500/30 ring-2 ring-amber-400 animate-bounce scale-110' 
                            : isBetted 
                            ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-950' 
                            : 'bg-slate-950 border border-slate-800'
                        }`}>
                          
                          {/* Core Horse Emoji */}
                          <span className="text-xl md:text-2xl select-none" role="img" aria-label="horse">
                            {horse.emoji}
                          </span>

                          {/* Speed Surge Bubble/Tag */}
                          {isBoosting && (
                            <span className="absolute -right-3 -bottom-1 select-none text-[8px] font-black italic bg-amber-500 text-slate-950 rounded px-0.5 scale-90">
                              BOOST
                            </span>
                          )}
                        </div>

                        {/* Finished Marker */}
                        {isFinished && (
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-red-600 border border-red-400 text-[10px] font-bold font-mono px-1 rounded text-white py-0 leading-none">
                            {getFinishedOrdinal(finishedHorses.indexOf(horse.id) + 1)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Arena Board Right (Live Stats Card) */}
        <div className="bg-[#1A1D24] border border-slate-800 rounded-lg shadow-xl p-5 md:p-6 flex flex-col justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 mb-3">
              실시간 순위 보드 (Live Positions)
            </h4>

            {/* List ordered dynamically */}
            <div className="space-y-2">
              {currentLeaderboard.map((item, idx) => {
                const { horse, pos, isFinished, finishRank } = item;
                const isBetted = horse.id === betHorseId;
                const rankDetails = RANK_INFO[horse.rank];

                return (
                  <div
                    key={horse.id}
                    className={`flex items-center gap-2 p-2.5 rounded border transition-all ${
                      isBetted
                        ? 'bg-emerald-500/10 border-emerald-500/45'
                        : 'bg-slate-950/50 border-slate-900/60'
                    }`}
                  >
                    {/* Rank Number */}
                    <div className="w-5 font-mono text-xs font-bold text-slate-400 text-center">
                      {idx + 1}
                    </div>

                    {/* Emoji */}
                    <span className="text-base" role="img" aria-label="horse icon">
                      {horse.emoji}
                    </span>

                    {/* Name & Rank */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-xs text-slate-200 truncate">
                          {horse.name.split(' (')[0]}
                        </span>
                        {isBetted && (
                          <span className="text-[9px] font-bold bg-emerald-500 text-slate-950 px-1 rounded py-0 leading-none">
                            My
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5">
                        <span className={`${rankDetails.textColor} font-bold text-[9px]`}>
                          {rankDetails.label}
                        </span>
                        <span>{Math.round(pos)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bet status recap */}
          <div className="bg-slate-950 rounded border border-slate-805 p-3">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">나의 베팅 내역</div>
            {bettedHorse && (
              <div className="mt-2 space-y-1 text-xs text-slate-350">
                <div className="flex justify-between">
                  <span className="text-slate-400">선택 마필:</span>
                  <span className="font-bold text-slate-200">{bettedHorse.name.split(' (')[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">배팅 마등급:</span>
                  <span className={`font-bold ${RANK_INFO[bettedHorse.rank].textColor} uppercase text-[10px]`}>
                    {bettedHorse.rank}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-900 mt-1">
                  <span className="text-slate-400">베팅액:</span>
                  <span className="font-mono font-bold text-emerald-400">{betAmount.toLocaleString()}원</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple English finishing ordinal formatter
function getFinishedOrdinal(rank: number): string {
  if (rank === 1) return '1등 (우승)';
  if (rank === 2) return '2등';
  if (rank === 3) return '3등';
  return `${rank}등`;
}
