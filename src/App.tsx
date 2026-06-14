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
import { isSupabaseConfigured, getGameDataFromSupabase, saveGameDataToSupabase, getUserId, getSupabaseConfig, updateSupabaseCredentials, setSupabaseSyncDisabled } from './supabase';

export default function App() {
  const [loggedInUsername, setLoggedInUsername] = useState<string | null>(() => {
    return localStorage.getItem('derby_logged_in_username');
  });

  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginInputName, setLoginInputName] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  // State Initialization with LocalStorage Persistence
  const [horses, setHorses] = useState<Horse[]>(() => {
    const loggedIn = localStorage.getItem('derby_logged_in_username');
    const key = loggedIn ? `race_game_horses_${loggedIn}` : 'race_game_horses';
    const saved = localStorage.getItem(key);
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
    const loggedIn = localStorage.getItem('derby_logged_in_username');
    const key = loggedIn ? `race_game_balance_${loggedIn}` : 'race_game_balance';
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = parseInt(saved, 10);
      return isNaN(parsed) ? 100000 : parsed;
    }
    return 100000; // Default starts at 100,000 KRW (10만원)
  });

  const [history, setHistory] = useState<RaceRecord[]>(() => {
    const loggedIn = localStorage.getItem('derby_logged_in_username');
    const key = loggedIn ? `race_game_history_${loggedIn}` : 'race_game_history';
    const saved = localStorage.getItem(key);
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

  // States for interactive credentials form in modal - use raw variables so text is kept when disabled
  const [inputUrl, setInputUrl] = useState<string>(() => getSupabaseConfig().rawUrl);
  const [inputKey, setInputKey] = useState<string>(() => getSupabaseConfig().rawKey);
  const [testSuccess, setTestSuccess] = useState<boolean>(false);
  const [testLoading, setTestLoading] = useState<boolean>(false);

  // Initial load from Supabase if configured
  useEffect(() => {
    if (isSupabaseConfigured()) {
      setSupabaseLoading(true);
      getGameDataFromSupabase()
        .then((data) => {
          if (data) {
            setBalance(data.balance);
            setHistory(data.history);
          } else {
            // First time connecting or row is empty: immediately upload current local progress
            saveGameDataToSupabase(balance, history).catch((e) => console.warn('Mount sync warning:', e));
          }
          setSupabaseLoading(false);
          setSupabaseError(null);
        })
        .catch((err) => {
          setSupabaseError(err.message || 'Supabase 연동 실패');
          setSupabaseLoading(false);
        });
    }
  }, [loggedInUsername]);

  // Synchronize state changes back to Supabase if configured
  useEffect(() => {
    if (isSupabaseConfigured() && !supabaseLoading) {
      saveGameDataToSupabase(balance, history)
        .then(() => {
          setSupabaseError(null);
        })
        .catch((err: any) => {
          let errorMsg = err.message || 'Supabase 저장 실패';
          if (errorMsg.includes('Invalid API key') || errorMsg.includes('JWT')) {
            errorMsg = 'Supabase API Key (Anon Key)가 유효하지 않습니다. 설정을 확인해 주세요.';
          }
          setSupabaseError(errorMsg);
        });
    }
  }, [balance, history, supabaseLoading, loggedInUsername]);

  // Handle live testing and saving of Supabase configuration
  const handleTestAndSaveConfig = async () => {
    setTestLoading(true);
    setTestSuccess(false);
    setSupabaseError(null);

    try {
      if (!inputUrl.trim() || !inputKey.trim()) {
        throw new Error('Supabase URL과 Anon Key를 모두 입력해야 합니다.');
      }
      
      const cleanUrl = inputUrl.trim();
      const cleanKey = inputKey.trim();

      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        throw new Error('Supabase URL은 http:// 또는 https://로 시작해야 합니다.');
      }

      // Re-enable sync before testing
      setSupabaseSyncDisabled(false);

      // 1. Dynamic credentials update (persist via localstorage & re-instantiate client)
      updateSupabaseCredentials(cleanUrl, cleanKey);

      // 2. Immediate load test to verify if the key is valid
      const data = await getGameDataFromSupabase();
      if (data) {
        setBalance(data.balance);
        setHistory(data.history);
      } else {
        // If there is no existing record on Supabase yet, post the current local state immediately!
        await saveGameDataToSupabase(balance, history);
      }

      setTestSuccess(true);
      setSupabaseError(null);
      setSupabaseLoading(false);
    } catch (err: any) {
      console.error('Supabase 연결 검증 실패:', err);
      let errorMsg = err.message || 'Supabase 연결에 실패했습니다.';
      if (errorMsg.includes('Invalid API key') || errorMsg.includes('JWT')) {
        errorMsg = '유효하지 않은 API Key (Anon Key)입니다. 대시보드의 Project API keys에서 anon/public 키를 가져왔는지 확인해 주세요.';
      } else if (errorMsg.includes('Failed to fetch')) {
        errorMsg = '네트워크 연결 오류 또는 올바르지 않은 Supabase URL입니다.';
      }
      
      setSupabaseError(errorMsg);
      setTestSuccess(false);
    } finally {
      setTestLoading(false);
    }
  };

  const handleClearCustomConfig = () => {
    updateSupabaseCredentials(null, null);
    setSupabaseSyncDisabled(true); // also make sure sync is disabled
    setInputUrl('');
    setInputKey('');
    setTestSuccess(false);
    setSupabaseError(null);
    setSupabaseLoading(false);
  };

  const handleDisableSyncTemporarily = () => {
    setSupabaseSyncDisabled(true);
    setSupabaseError(null);
    setSupabaseLoading(false);
    setTestSuccess(false);
  };


  // Synchronizers to LocalStorage
  useEffect(() => {
    const key = loggedInUsername ? `race_game_horses_${loggedInUsername}` : 'race_game_horses';
    localStorage.setItem(key, JSON.stringify(horses));
  }, [horses, loggedInUsername]);

  useEffect(() => {
    const key = loggedInUsername ? `race_game_balance_${loggedInUsername}` : 'race_game_balance';
    localStorage.setItem(key, balance.toString());
  }, [balance, loggedInUsername]);

  useEffect(() => {
    const key = loggedInUsername ? `race_game_history_${loggedInUsername}` : 'race_game_history';
    localStorage.setItem(key, JSON.stringify(history));
  }, [history, loggedInUsername]);

  const handleLogin = async (username: string) => {
    const cleanUsername = username.trim();
    if (!cleanUsername) return;
    
    setLoginLoading(true);
    setLoginError(null);
    
    try {
      localStorage.setItem('derby_logged_in_username', cleanUsername);
      setLoggedInUsername(cleanUsername);
      
      const localBalanceKey = `race_game_balance_${cleanUsername}`;
      const localHistoryKey = `race_game_history_${cleanUsername}`;
      const localHorsesKey = `race_game_horses_${cleanUsername}`;
      
      const savedBalance = localStorage.getItem(localBalanceKey);
      const savedHistory = localStorage.getItem(localHistoryKey);
      const savedHorses = localStorage.getItem(localHorsesKey);
      
      let currentBalance = savedBalance ? parseInt(savedBalance, 10) : 100000;
      if (isNaN(currentBalance)) currentBalance = 100000;
      
      let currentHistory = [];
      if (savedHistory) {
        try { currentHistory = JSON.parse(savedHistory); } catch (e) {}
      }
      
      if (savedHorses) {
        try { setHorses(JSON.parse(savedHorses)); } catch (e) {}
      } else {
        setHorses(INITIAL_HORSES);
      }
      
      setBalance(currentBalance);
      setHistory(currentHistory);
      
      if (isSupabaseConfigured()) {
        setSupabaseLoading(true);
        // Load data from Supabase for this logged-in account
        const data = await getGameDataFromSupabase();
        if (data) {
          setBalance(data.balance);
          setHistory(data.history);
          localStorage.setItem(localBalanceKey, data.balance.toString());
          localStorage.setItem(localHistoryKey, JSON.stringify(data.history));
        } else {
          // If no data exists in Supabase, sync current local balance and history to Supabase
          await saveGameDataToSupabase(currentBalance, currentHistory);
        }
        setSupabaseError(null);
      }
      setShowLoginModal(false);
      setLoginInputName('');
    } catch (err: any) {
      console.warn('Login Supabase Sync Warning:', err);
      // Don't error out hard, we loaded local profile successfully
    } finally {
      setSupabaseLoading(false);
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('derby_logged_in_username');
    setLoggedInUsername(null);
    setSupabaseError(null);
    
    const savedBalance = localStorage.getItem('race_game_balance');
    let currentBalance = savedBalance ? parseInt(savedBalance, 10) : 100000;
    if (isNaN(currentBalance)) currentBalance = 100000;
    
    let currentHistory = [];
    const savedHistory = localStorage.getItem('race_game_history');
    if (savedHistory) {
      try { currentHistory = JSON.parse(savedHistory); } catch (e) {}
    }
    
    const savedHorses = localStorage.getItem('race_game_horses');
    if (savedHorses) {
      try { setHorses(JSON.parse(savedHorses)); } catch (e) {}
    } else {
      setHorses(INITIAL_HORSES);
    }
    
    setBalance(currentBalance);
    setHistory(currentHistory);
  };

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
            {/* User Session Widget */}
            {loggedInUsername ? (
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-md text-xs">
                <span className="text-slate-300 font-medium whitespace-nowrap">
                  👤 <strong className="text-amber-400">{loggedInUsername}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="bg-[#242930] hover:bg-slate-750 text-[10px] text-slate-300 hover:text-white px-2 py-0.5 border border-slate-700 rounded transition-all font-bold cursor-pointer"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setLoginInputName('');
                  setLoginError(null);
                  setShowLoginModal(true);
                }}
                className="bg-gradient-to-r from-amber-550 to-amber-600 hover:from-amber-450 hover:to-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-md text-xs transition-all shadow-md cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap"
              >
                <span>👤 로그인</span>
              </button>
            )}
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
            {supabaseError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-100 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow animate-fade-in">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0 animate-pulse" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-red-400 text-sm flex items-center gap-2">
                      <span>Supabase 데이터 베이스 연동 오류 및 실패</span>
                      <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-[10px] text-red-300 font-mono tracking-wider font-bold">Invalid API Key</span>
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                      입력 하신 Supabase API Key(Anon Key)가 올바르지 않거나 테이블 설정이 누락되어, 실시간 연동 및 자금 저장과 전적 업데이트 도중 오류가 발생 하였습니다:
                    </p>
                    <p className="font-mono text-xs text-red-300 bg-slate-950/80 px-2.5 py-1.5 rounded select-all break-all border border-red-500/10 inline-block mt-2">
                      Error: {supabaseError}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-2 shrink-0 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setTestSuccess(false);
                      setShowSupabaseInstructions(true);
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer text-center"
                  >
                    🛠️ 수동 설정 및 API Key 새로 입력
                  </button>
                  <button
                    type="button"
                    onClick={handleDisableSyncTemporarily}
                    className="px-4 py-2.5 bg-red-950/40 hover:bg-red-900/45 text-red-300 text-xs font-bold rounded-lg transition-colors border border-red-500/20 cursor-pointer text-center"
                  >
                    ❌ 임시 로컬 모드로 전환 (오류 해제)
                  </button>
                </div>
              </div>
            )}

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

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#161920] border border-slate-800 rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-left space-y-5 animate-scale-up">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <span className="text-2xl" role="img" aria-label="user">👤</span>
              <div>
                <h3 className="text-base font-bold text-slate-100 font-sans">계정 로그인</h3>
                <p className="text-[10px] text-slate-400 font-sans">데이터가 실시간 클라우드로 안전하게 연동됩니다.</p>
              </div>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (loginInputName.trim().length >= 2) {
                handleLogin(loginInputName);
              } else {
                setLoginError('아이디는 최소 2자 이상 입력해 주세요.');
              }
            }} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-sans animate-fade-in">
                  아이디 / 닉네임 입력
                </label>
                <input
                  type="text"
                  required
                  value={loginInputName}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-zA-Z0-9가-힣_-]/g, ''); // sanitize: alphanumeric + Korean, no space
                    setLoginInputName(val);
                    setLoginError(null);
                  }}
                  maxLength={15}
                  placeholder="예: gildong12"
                  className="w-full bg-slate-950 border border-slate-850 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-600"
                />
                <p className="text-[9px] text-slate-500 mt-1 font-sans">공백 없이 영문, 숫자, 한글만 입력이 가능합니다.</p>
              </div>

              {loginError && (
                <div className="text-[11px] text-red-400 font-semibold bg-red-500/10 border border-red-500/15 p-2 rounded-lg flex items-center gap-1.5 font-sans">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="text-[10px] text-slate-400 leading-relaxed bg-[#1D212A] p-3 rounded-xl border border-slate-800/60 font-sans space-y-2">
                <div>
                  📌 <strong className="text-amber-400">자금 연동 안내:</strong> 최초 입력 시 새 계정이 생성 및 연동되며, 클라우드에 기존 계정이 있는 경우 자동으로 보관된 자금과 시뮬레이터 전적을 불러옵니다.
                </div>
                {!isSupabaseConfigured() ? (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded text-[9.5px]">
                    ⚠️ <strong className="text-amber-200">중요 (기기/브라우저 이동 시):</strong> 현재 브라우저에 Supabase 접속 정보가 설정되어 있지 않습니다. 다른 브라우저에서도 데이터를 바로 유지하여 로그인하려면, 본인의 프로젝트 환경 변수(<code className="bg-slate-900 px-1 text-slate-300 font-mono">VITE_SUPABASE_URL</code>, <code className="bg-slate-900 px-1 text-slate-300 font-mono">VITE_SUPABASE_ANON_KEY</code>)를 빌드/배포 서버 설정에 기입하거나 우측 상단 <span>☁️ 클라우드 설정</span>을 통해 수동으로 연결해 준 뒤 로그인해야 합니다.
                  </div>
                ) : (
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded text-[9.5px]">
                    ✅ <strong className="text-emerald-200">Supabase 연결 상태:</strong> 접속 정보가 연동 중입니다. 로그인 시 클라우드에서 안전하게 데이터를 업로드/다운로드합니다.
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 py-2.5 border border-slate-800 hover:bg-slate-950 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-550 to-amber-600 hover:from-amber-450 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                >
                  {loginLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin animate-infinite" />
                      <span>로그인 중...</span>
                    </>
                  ) : (
                    <span>로그인 완료</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    클라우드 연동 가이드 및 수동 설정
                  </h3>
                  <p className="text-xs text-slate-400">GitHub 저장, Vercel 구동 및 Supabase 실시간 크레딧 동기화</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSupabaseInstructions(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-sm font-bold bg-slate-800/40 hover:bg-slate-800/80 px-2.5 py-1 rounded-lg"
              >
                닫기
              </button>
            </div>

            <div className="space-y-6 text-sm text-slate-300">
              
              {/* Part 1: Interactive Client Credentials Configuration */}
              <div className="space-y-3 bg-slate-950/40 border border-slate-800/80 rounded-xl p-5">
                <h4 className="font-bold text-amber-400 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <Database className="w-4 h-4 text-amber-400" />
                  Supabase API 연결 수동 설정 및 복구
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  API Key 오류나 잘못 설정된 정보가 있을 때, 아래에 본인의 Supabase 상세 정보를 바로 입력하고 테스트하실 수 있습니다. 이 설정은 브라우저에 임시/영구 안전하게 저장됩니다.
                </p>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Supabase Project URL
                    </label>
                    <input
                      type="text"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="https://your-project-id.supabase.co"
                      className="w-full bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Supabase Anon / Public API Key
                    </label>
                    <textarea
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600 resize-none"
                    />
                  </div>
                </div>

                {/* Local Feedback States and Error Banners */}
                {supabaseError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-start gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold">연결 검증 실패:</p>
                      <p className="opacity-90">{supabaseError}</p>
                    </div>
                  </div>
                )}

                {testSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg flex items-start gap-2 text-xs">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 animate-bounce" />
                    <div>
                      <p className="font-bold">연동 완료!</p>
                      <p className="opacity-90">Supabase 연결에 성공했습니다. 자금과 전적이 실시간 연동됩니다.</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1.5">
                  <button
                    type="button"
                    disabled={testLoading}
                    onClick={handleTestAndSaveConfig}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/40 text-slate-200 hover:text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {testLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>연결 상태 확인 중...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>입력 정보 저장 및 실시간 테스트</span>
                      </>
                    )}
                  </button>
                  
                  {(getSupabaseConfig().isCustom) && (
                    <button
                      type="button"
                      onClick={handleClearCustomConfig}
                      className="py-2.5 px-4 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 font-semibold text-xs rounded-lg transition-all"
                      title="수동 설정 삭제 및 환경 변수 우선 연동 상태로 복귀"
                    >
                      설정 초기화
                    </button>
                  )}
                </div>
              </div>

              {/* Part 2: GitHub & Vercel */}
              <div className="space-y-2.5">
                <h4 className="font-semibold text-amber-500 flex items-center gap-2">
                  <Github className="w-4 h-4 text-amber-400" />
                  GitHub 저장 및 Vercel 무료 배포 방법
                </h4>
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4 space-y-2 text-xs text-slate-300 leading-relaxed">
                  <p>
                    <strong className="text-white">🚀 GitHub 연동:</strong> AI Studio 우측 상단 톱니바퀴 설정 메뉴에서 <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-bold border border-slate-700">Export to GitHub</span>를 누르면 본인의 깃허브 레포지토리로 바로 저장됩니다.
                  </p>
                  <p>
                    <strong className="text-white">🌐 Vercel 구동:</strong> <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-0.5 font-bold">Vercel<ExternalLink className="w-3 h-3 inline" /></a>에 로그인한 뒤, 해당 Repository를 임포트(Import)하면 아무런 비용 없이 즉시 실시간 웹에 배포하여 무료 구동이 완료됩니다!
                  </p>
                </div>
              </div>

              {/* Part 3: SQL for DB Setup */}
              <div className="space-y-3">
                <h4 className="font-semibold text-emerald-400 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  Supabase 테이블 및 SQL 설정 정보
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
              </div>

              {/* Connected Credentials Info */}
              <div className="bg-[#1A1D24] border border-slate-800 rounded-lg p-3.5 flex items-center justify-between gap-4 text-xs font-mono">
                <div className="space-y-0.5 text-left">
                  <span className="text-slate-400 font-semibold font-sans">현재 연결 방식</span>
                  <p className="text-[11px] text-slate-300">
                    {getSupabaseConfig().isDisabled 
                      ? '동기화 일시 중지됨 (로컬 우선)' 
                      : getSupabaseConfig().isCustom 
                        ? '수동 입력 테스트 키 연동 중' 
                        : getSupabaseConfig().isEnvProvided 
                          ? '서버 환경 변수 VITE_ 기입 연동 중' 
                          : '로컬 브라우저 저장 모드 사용 중 (비연동)'}
                  </p>
                  <p className="text-slate-500 text-[10px]">계정 ID: {getUserId()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getSupabaseConfig().isDisabled && (
                    <button
                      type="button"
                      onClick={() => {
                        setSupabaseSyncDisabled(false);
                        setSupabaseError(null);
                        setSupabaseLoading(false);
                        setTestSuccess(false);
                      }}
                      className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/15 rounded text-[10px] font-bold transition-all cursor-pointer"
                    >
                      동기화 복구
                    </button>
                  )}
                  {isSupabaseConfigured() && !supabaseError ? (
                    <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-bold text-[10px]">
                      연동 활성화됨 (SYNCED)
                    </span>
                  ) : (
                    <span className="bg-slate-800 text-slate-400 px-2 py-1 rounded font-bold text-[10px]">
                      미연동 (LOCAL ONLY)
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
