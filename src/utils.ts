/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats a number to Korean Won currency format (e.g., 100,000원)
 */
export function formatWon(value: number): string {
  if (value >= 10000) {
    const man = Math.floor(value / 10000);
    const rest = value % 10000;
    if (rest === 0) {
      return `${man.toLocaleString()}만원`;
    }
    return `${man.toLocaleString()}만 ${rest.toLocaleString()}원`;
  }
  return `${value.toLocaleString()}원`;
}

/**
 * Gets a random selection of N elements from an array
 */
export function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Returns Korean ranking suffix (e.g., 1등, 2등)
 */
export function getRankSuffix(rank: number): string {
  return `${rank}등`;
}
