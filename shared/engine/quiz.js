// Speed-ranked multiplayer quiz scoring (spec §8.4). Fastest correct = 10; wrong/timeout = 0.
export const QUIZ_POINTS = {
  2: [10, 6],
  3: [10, 7, 4],
  4: [10, 8, 5, 2],
  5: [10, 8, 6, 3, 1],
  6: [10, 8, 6, 4, 2, 0],
}

// rank is 1-based position among CORRECT answers ordered fastest→slowest; null = wrong/timeout.
export function quizScore(playerCount, rank) {
  const n = Math.max(2, Math.min(6, playerCount))
  const table = QUIZ_POINTS[n]
  if (!rank || rank < 1 || rank > table.length) return 0
  return table[rank - 1]
}
