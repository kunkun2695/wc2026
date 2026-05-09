export const matches = [
  {
    id: 1,
    team1: { name: "USA", flag: "🇺🇸", score: 2 },
    team2: { name: "Vietnam", flag: "🇻🇳", score: 1 },
    status: "LIVE",
    time: "75'",
    group: "Group A",
    date: "2026-06-11"
  },
  {
    id: 2,
    team1: { name: "Mexico", flag: "🇲🇽", score: 0 },
    team2: { name: "France", flag: "🇫🇷", score: 0 },
    status: "UPCOMING",
    time: "20:00",
    group: "Group B",
    date: "2026-06-11"
  },
  {
    id: 3,
    team1: { name: "Canada", flag: "🇨🇦", score: 3 },
    team2: { name: "Nigeria", flag: "🇳🇬", score: 2 },
    status: "FINISHED",
    time: "FT",
    group: "Group C",
    date: "2026-06-10"
  },
  {
    id: 4,
    team1: { name: "Argentina", flag: "🇦🇷", score: 1 },
    team2: { name: "Japan", flag: "🇯🇵", score: 1 },
    status: "LIVE",
    time: "45'",
    group: "Group D",
    date: "2026-06-11"
  },
  {
    id: 5,
    team1: { name: "Brazil", flag: "🇧🇷", score: 0 },
    team2: { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", score: 0 },
    status: "UPCOMING",
    time: "Tomorrow",
    group: "Group E",
    date: "2026-06-12"
  }
];

export const groups = [
  {
    name: "Group A",
    standings: [
      { team: "USA", flag: "🇺🇸", played: 1, won: 1, drawn: 0, lost: 0, gf: 2, ga: 1, pts: 3 },
      { team: "Vietnam", flag: "🇻🇳", played: 1, won: 0, drawn: 0, lost: 1, gf: 1, ga: 2, pts: 0 },
      { team: "Italy", flag: "🇮🇹", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 },
      { team: "Morocco", flag: "🇲🇦", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 }
    ]
  }
];
