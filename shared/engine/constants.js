export const STATS = ['matches', 'goals', 'assists', 'tackles', 'saves', 'cleanSheets']

export const STAT_LABELS = {
  matches: 'MATCHES',
  goals: 'GOALS',
  assists: 'ASSISTS',
  tackles: 'TACKLES',
  saves: 'SAVES',
  cleanSheets: 'CLEAN SHEETS',
}

// Upper bounds used only for scaling the UI stat bars (0–100%).
export const STAT_MAX = {
  matches: 200,
  goals: 130,
  assists: 70,
  tackles: 250,
  saves: 350,
  cleanSheets: 90,
}

export const RARITY_POINTS = { legendary: 100, epic: 75, rare: 50, common: 25 }
