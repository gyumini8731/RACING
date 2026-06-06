/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HorseRank = 'legend' | 'myth' | 'hero' | 'rare' | 'common';

export interface Horse {
  id: string;
  name: string;
  rank: HorseRank;
  baseSpeed: number; // The average speed modifier
  speedVariance: number; // Speed randomness factor
  color: string; // Tail/body display color
  emoji: string; // Emoji representation of the horse
  winCount: number;
  totalRaces: number;
}

export type GamePhase = 'lobby' | 'betting' | 'racing' | 'result';

export interface Bet {
  horseId: string;
  amount: number;
}

export interface RaceRecord {
  id: string;
  date: string;
  participatingHorses: {
    id: string;
    name: string;
    rank: HorseRank;
    avatar: string;
  }[];
  bet: Bet;
  finalRankings: string[]; // List of Horse IDs in finish order
  payout: number;
  profit: number;
}
