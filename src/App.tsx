/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Horse, GamePhase, Bet, RaceRecord } from './types';
import { INITIAL_HORSES } from './data';
import { getRandomElements, formatWon } from './utils';
import { HorseList } from './components/HorseList';
import { BetSelection } from './components/BetSelection';
import { RaceTrack } from './components/RaceTrack';
import { RaceResults } from './components/RaceResults';
import { HistoryLog } from './components/HistoryLog';
import { Coins, HelpCircle, Trophy, Sparkles, RefreshCcw, DollarSign, Database, Check, AlertCircle, Loader2, Info, ExternalLink, Github } from 'lucide-react';
import { isSupabaseConfigured, getGameDataFromSupabase, saveGameDataToSupabase, getUserId } from './supabase';

export default function App() {
  // State Initialization with LocalStorage Persistence
  const [horses, setHorses] = useState<Horse[]>(() => {
    const saved = localStorage.getItem('race_game_horses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_HORSES;
      }
    }
    return INITIAL_HORSES;
  });

  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem('race_game_balance');
    if (saved) {
      const parsed = parseInt(saved, 10);
      return isNaN(parsed) ? 100000 : parsed;
    }
    return 100000; // Default starts at 100,000 KRW (10만원)
  });

  const [history, setHistory] = useState<RaceRecord[]>(() => {
    const saved = localStorage.getItem('race_game_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [lineup, setLineup] = useState<Horse[]>([]);
  const [bet, setBet] = useState<Bet>({ horseId: '', amount: 0 });
  const [finalRankings, setFinalRankings] = useState<string[]>([]);
  const [showRefillConfirm, setShowRefillConfirm] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState<boolean>(false);

  const [supabaseLoading, setSupabaseLoading] = useState<boolean>(isSupabaseConfigured());
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [showSupabaseInstructions, setShowSupabaseInstructions] = useState<boolean>(false);

  // Initial load from Supabase if configured
  useEffect(() => {
    if (isSupabaseConfigured()) {
      setSupabaseLoading(true);
      getGameDataFromSupabase()
        .then((data) => {
          if (data) {
            setBalance(data.balance);
            setHistory(data.history);
          }
          setSupabaseLoading(false);
          setSupabaseError(null);
        })
        .catch((err) => {
          setSupabaseError(err.message || 'Supabase 연동 실패');
          setSupabaseLoading(false);
        });
    }
  }, []);

  // Synchronize state changes back to Supabase if configured
  useEffect(() => {
    if (isSupabaseConfigured() && !supabaseLoading) {
      saveGameDataToSupabase(balance, history)
        .then(() => {
          setSupabaseError(null);
        })
        .catch((err) => {
          setSupabaseError(err.message || 'Supabase 저장 실패');
        });
    }
  }, [balance, history, supabaseLoading]);

  // Synchronizers to LocalStorage
  useEffect(() => {
    localStorage.setItem('race_game_horses', JSON.stringify(horses));
  }, [horses]);

  useEffect(() => {
    localStorage.setItem('race_game_balance', balance.toString());
  }, [balance]);

  useEffect(() => {
    localStorage.setItem('race_game_history', JSON.stringify(history));
  }, [history]);

  // Handle clicking "PLAY" - Setup lineup and go to betting screen
  const handleInitiateGame = () => {
    // Collect 5 random horses representing the round lineup
    const roundLineup = getRandomElements(horses, 5);
    setLineup(roundLineup);
    setPhase('betting');
  };

  // Handle confirming the bet and transitioning to track view
  const handleStartRace = (betHorseId: string, betAmount: number) => {
    setBet({ horseId: betHorseId, amount: betAmount });
    
    // Dedicate bet money upfront
    setBalance((prev) => prev - betAmount);
    setPhase('racing');
  };

  // Race completed: process statistics and finances, log records, swap state
  const handleRaceEnd = (rankings: string[]) => {
    setFinalRankings(rankings);

    // Find user's outcome
    const finishRankIndex = rankings.indexOf(bet.horseId);
    const finishRank = finishRankIndex + 1;

    let multiplier = 0;
    if (finishRank === 1) {
      multiplier = 2.0;
    } else if (finishRank === 2) {
      multiplier = 1.5;
    } else if (finishRank === 3) {
      multiplier = 1.0;
    }

    const payout = Math.floor(bet.amount * multiplier);
    const netProfit = payout - bet.amount;

    // 1. Update User Balance
    setBalance((prev) => prev + payout);

    // 2. Log History
    const newRecord: RaceRecord = {
      id: `race_${Date.now()}`,
      date: new Date().toLocaleString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      participatingHorses: lineup.map((h) => ({
        id: h.id,
        name: h.name,
        rank: h.rank,
        avatar: h.emoji,
      })),
      bet: { ...bet },
      finalRankings: [...rankings],
      payout,
      profit: netProfit,
    };
    setHistory((prev) => [newRecord, ...prev]);

    // 3. Update Horse Stable stats (total races + win modifiers)
    setHorses((prevHorses) => {
      return prevHorses.map((horse) => {
        const isMatched = lineup.some((h) => h.id === horse.id);
        if (isMatched) {
          const finishedRankIndex = rankings.indexOf(horse.id);
          const finishedRank = finishedRankIndex + 1;
          const isWinner = finishedRank === 1;

          return {
            ...horse,
            totalRaces: horse.totalRaces + 1,
            winCount: isWinner ? horse.winCount + 1 : horse.winCount,
          };
        }
        return horse;
      });
    });

    setPhase('result');
  };

  const handleClearHistory = () => {
    setShowClearHistoryConfirm(true);
  };

  const handleConfirmClearHistory = () => {
    setHistory([]);
    setShowClearHistoryConfirm(false);
  };

  const handleRefillBalance = () => {
    setBalance(100000);
    setShowRefillConfirm(false);
  };

  const handleResetAllData = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmResetAllData = () => {
    localStorage.removeItem('race_game_horses');
    localStorage.removeItem('race_game_balance');
    localStorage.removeItem('race_game_history');
    setHorses(INITIAL_HORSES);
    setBalance(100000);
    setHistory([]);
    setPhase('lobby');
    setShowResetConfirm(false);
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30">
      
      {/* Absolute Head Section */}
      <header className="bg-[#1A1D24] border-b border-slate-800 shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          
          {/* Logo Title Group */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <span className="text-2xl" role="img" aria-label="horse">🐎</span>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter italic uppercase text-amber-500 underline decoration-2 underline-offset-4 leading-none">
                Legendary Derby
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1">경마 배팅 시뮬레이터</p>
            </div>
          </div>

          {/* Account Balance Widget */}
          <div className="flex items-center gap-2.5">
            {/* Supabase Sync Badge Widget */}
            <div className="flex items-center">
              {isSupabaseConfigured() ? (
                supabaseLoading ? (
                  <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-semibold animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="hidden lg:inline text-[11px]">Supabase 동기화 중...</span>
                  </div>
                ) : supabaseError ? (
                  <button
                    type="button"
                    onClick={() => setShowSupabaseInstructions(true)}
                    className="bg-red-500/15 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                    title={supabaseError}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline text-[11px]">Supabase 연결 오류</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSupabaseInstructions(true)}
                    className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                    title="Supabase 클라우드 동기화 완료! 클릭하여 정보 보기"
                  >
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden lg:inline text-[11px]">크레딧 동기화됨</span>
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSupabaseInstructions(true)}
                  className="bg-slate-800/40 border border-slate-700/60 text-slate-400 hover:bg-slate-850 transition-all px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                  title="비연동 (클릭하여 연동 가이드 보기)"
                >
                  <Database className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden lg:inline text-[11px]">로컬 저장 (Supabase 비연동)</span>
                </button>
              )}
            </div>

            <div className="bg-[#1A1D24] border border-slate-800 px-4 py-2 rounded-md flex items-center gap-3 shadow">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:inline">Available Funds</span>
              <span className="text-sm font-mono font-bold text-green-400">
                {formatWon(balance)}
              </span>
            </div>

            {/* Diagnostics Reset */}
            {phase === 'lobby' && (
              <button
                type="button"
                onClick={handleResetAllData}
                className="p-2 text-slate-400 hover:text-red-400 bg-[#1A1D24] border border-slate-800 rounded-md transition-colors hover:bg-slate-800"
                title="게임 초기화"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Primary Dynamic Engine Stage */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {phase === 'lobby' && (
          <div className="space-y-8 animate-fade-in">
            {/* Quick Greeting / Play Callboard Banner */}
            <div className="relative rounded-lg overflow-hidden bg-[#1A1D24] border border-slate-800 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <Sparkles className="w-3.5 h-3.5" />
                  신나는 경마 베팅에 잘 오셨습니다!
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-medium tracking-tight text-white">
                  당신의 예측 능력을 보여주세요!
                </h2>
                <p className="text-sm text-slate-400 max-w-xl">
                  초기자금 10만원으로 시작하여 어떤 최강 등급의 말이 결승선을 통과할지 배팅해 보세요. 
                  우승 시 <strong>2배</strong>, 준우승 시 <strong>1.5배</strong>, 3위 입상 시 <strong>1배(본전)</strong>의 당첨금을 얻습니다!
                </p>
              </div>

              {/* Ready to Play trigger buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {balance < 1000 && (
                  <button
                    onClick={() => setShowRefillConfirm(true)}
                    type="button"
                    className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-display rounded-md text-center shadow-lg transition-all active:scale-[0.98]"
                  >
                    💸 파산 구제 자금 받기
                  </button>
                )}
                {balance >= 1000 && (
                  <button
                    onClick={handleInitiateGame}
                    type="button"
                    className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black font-display rounded-md text-center text-lg shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    🎮 PLAY - 베팅 경기 즐기기
                  </button>
                )}
              </div>
            </div>

            {/* Stable catalog view */}
            <HorseList horses={horses} />

            {/* History Table */}
            <HistoryLog records={history} onClearHistory={handleClearHistory} />
          </div>
        )}

        {phase === 'betting' && (
          <BetSelection
            lineup={lineup}
            balance={balance}
            onStartRace={handleStartRace}
            onCancel={() => setPhase('lobby')}
          />
        )}

        {phase === 'racing' && (
          <RaceTrack
            lineup={lineup}
            betHorseId={bet.horseId}
            betAmount={bet.amount}
            onRaceEnd={handleRaceEnd}
          />
        )}

        {phase === 'result' && (
          <RaceResults
            lineup={lineup}
            finalRankings={finalRankings}
            bet={bet}
            onRestart={() => setPhase('lobby')}
          />
        )}

      </main>

      {/* Free Fund Recalibration Modal */}
      {showRefillConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-center space-y-5 animate-scale-up">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-3xl">
              💸
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-100">보유 자금이 부족하신가요?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                파산을 막고 무제한으로 게임을 즐길 수 있도록 무상 복리 <strong>10만원 자금 충전</strong>을 승인해 드립니다.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowRefillConfirm(false)}
                className="flex-1 py-3 border border-slate-800 hover:bg-slate-950 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition-all"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleRefillBalance}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg active:scale-95"
              >
                충전 승인받기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Data Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-center space-y-5 animate-scale-up">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-3xl">
              ⚠️
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-100">게임 전체 초기화</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                정말로 게임의 모든 데이터(소지금, 승률 기록, 배팅 내역)를 초기 상태로 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 border border-slate-800 hover:bg-slate-950 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition-all"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmResetAllData}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg active:scale-95"
              >
                초기화 진행
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      {showClearHistoryConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-center space-y-5 animate-scale-up">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-3xl">
              🗑️
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-100">경기 기록 삭제</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                정말로 모든 배팅 경기 전적 기록을 일괄 삭제하시겠습니까? (소지금과 마필 자체의 기록은 지워지지 않습니다.)
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowClearHistoryConfirm(false)}
                className="flex-1 py-3 border border-slate-800 hover:bg-slate-950 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition-all"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmClearHistory}
                className="flex-1 py-3 bg-gradient-to-r from-amber-550 to-orange-600 hover:from-amber-450 hover:to-orange-500 bg-amber-600 text-white font-bold text-xs rounded-xl transition-all shadow-lg active:scale-95"
              >
                기록 삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supabase & Vercel/GitHub Integration Guidelines Modal */}
      {showSupabaseInstructions && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-2xl text-left space-y-6 animate-scale-up my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg flex items-center justify-center text-xl">
                  ☁️
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    클라우드 연동 가이드
                  </h3>
                  <p className="text-xs text-slate-400">GitHub 저장, Vercel 구동 및 Supabase 크레딧 저장 설정</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSupabaseInstructions(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-sm font-bold bg-slate-800/40 hover:bg-slate-800/80 px-2 py-1 rounded"
              >
                닫기
              </button>
            </div>

            <div className="space-y-6 text-sm text-slate-300">
              
              {/* Part 1: GitHub & Vercel */}
              <div className="space-y-2.5">
                <h4 className="font-semibold text-amber-500 flex items-center gap-2">
                  <Github className="w-4 h-4 text-amber-400" />
                  1. 깃허브 저장 & Vercel 무료 배포
                </h4>
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4 space-y-2 text-xs text-slate-300 leading-relaxed">
                  <p>
                    <strong className="text-white">🚀 GitHub 연동:</strong> AI Studio 우측 상단 톱니바퀴 설정 메뉴에서 <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-bold border border-slate-700">Export to GitHub</span>를 누르면 본인의 깃허브 레포지토리로 바로 저장됩니다. (또는 Download ZIP 파일 다운로드 가능)
                  </p>
                  <p>
                    <strong className="text-white">🌐 Vercel 구동:</strong> <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-0.5 font-bold">Vercel<ExternalLink className="w-3 h-3 inline" /></a>에 로그인한 뒤, 해당 Repository를 임포트(Import)하면 아무런 비용 없이 즉시 실시간 웹에 배포하여 무료 구동이 완료됩니다!
                  </p>
                </div>
              </div>

              {/* Part 2: Supabase database setup */}
              <div className="space-y-3">
                <h4 className="font-semibold text-emerald-400 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  2. Supabase 실시간 크레딧 연동 테이블 설정
                </h4>
                
                <div className="space-y-2 text-xs">
                  <p className="text-slate-400 leading-relaxed">
                    실시간 자금 및 승률/배팅 히스토리 로그가 브라우저를 닫고 다른 컴퓨터에서 접속해도 실시간 클라우드 상에 영구 유지됩니다. 가입하신 <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline font-bold inline-flex items-center gap-0.5">Supabase<ExternalLink className="w-3 h-3" /></a> 대시보드의 <strong className="text-white">SQL Editor</strong>에서 아래 쿼리를 입력하여 테이블을 만들어 주세요:
                  </p>

                  <div className="relative">
                    <pre className="bg-slate-950 border border-slate-800 text-[10.5px] text-emerald-300 p-3.5 rounded-lg font-mono overflow-x-auto leading-relaxed max-h-[170px] overflow-y-auto">
{`CREATE TABLE public.user_balances (
    user_id text primary key,
    balance numeric not null default 100000,
    history jsonb not null default '[]'::jsonb,
    updated_at timestamp with time zone not null default now()
);

-- RLS 정책 설정 (모든 익명 사용자의 동기화 데이터 추가 및 업데이트 허용)
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous interactions" 
ON public.user_balances FOR ALL 
USING (true) WITH CHECK (true);`}
                    </pre>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="text-slate-400">
                    테이블을 생성한 후, 깃허브 저장소 또는 Vercel의 <strong className="text-white">Environment Variables(환경 변수)</strong>에 아래의 변수를 등록해 주시면 자동으로 본인의 Supabase 클라우드 데이터베이스에 연동됩니다.
                  </p>
                  
                  <div className="bg-slate-950/80 border border-slate-850 p-3 rounded-lg space-y-1.5 font-mono text-[11px] text-slate-300">
                    <div>
                      <span className="text-amber-400 font-semibold">VITE_SUPABASE_URL</span> = <span className="text-slate-400">"본인의 Supabase Project URL"</span>
                    </div>
                    <div>
                      <span className="text-amber-400 font-semibold">VITE_SUPABASE_ANON_KEY</span> = <span className="text-slate-400">"본인의 API Project Anon API Key"</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status display */}
              <div className="bg-[#1A1D24] border border-slate-800 rounded-lg p-3.5 flex items-center justify-between gap-4 text-xs">
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-semibold">현재 연결 정보</span>
                  <p className="text-slate-300 font-mono text-[10.5px]">접속 유저 ID: {getUserId()}</p>
                </div>
                <div>
                  {isSupabaseConfigured() ? (
                    <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-bold">
                      CONNECTED
                    </span>
                  ) : (
                    <span className="bg-slate-800 text-slate-400 px-2 py-1 rounded font-bold">
                      LOCAL ONLY
                    </span>
                  )}
                </div>
              </div>

            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSupabaseInstructions(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md active:scale-95 cursor-pointer"
              >
                가이드 닫기 및 플레이 재생
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Core Footer credits and regulatory statement */}
      <footer className="bg-[#1A1D24] border-t border-slate-800 px-8 py-3.5 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 gap-2 mt-12 shadow-inner">
        <div>CONNECTED TO DERBY-MAINNET-01</div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 items-center">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            LIVE SERVER
          </span>
          <span>© 2026 Legendary Derby. All Rights Reserved.</span>
        </div>
      </footer>

    </div>
  );
}
