const db = require('../config/db');

const calculateGroupStandings = async () => {
  // Lấy danh sách các trận vòng bảng
  const matchesRes = await db.query("SELECT * FROM matches WHERE competition_name LIKE 'Bảng%'");
  const matches = matchesRes.rows;

  const teamsMap = {};
  for (const m of matches) {
    const group = m.competition_name;
    if (!teamsMap[m.team1_name]) {
      teamsMap[m.team1_name] = { name: m.team1_name, flag: m.team1_flag, group, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 };
    }
    if (!teamsMap[m.team2_name]) {
      teamsMap[m.team2_name] = { name: m.team2_name, flag: m.team2_flag, group, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 };
    }

    if (m.status === 'FT') {
      const t1 = teamsMap[m.team1_name];
      const t2 = teamsMap[m.team2_name];

      t1.played++;
      t2.played++;
      t1.gf += m.team1_score;
      t1.ga += m.team2_score;
      t2.gf += m.team2_score;
      t2.ga += m.team1_score;

      if (m.team1_score > m.team2_score) {
        t1.won++;
        t1.pts += 3;
        t2.lost++;
      } else if (m.team1_score < m.team2_score) {
        t2.won++;
        t2.pts += 3;
        t1.lost++;
      } else {
        t1.drawn++;
        t1.pts += 1;
        t2.drawn++;
        t2.pts += 1;
      }
    }
  }

  const groups = {};
  for (const t of Object.values(teamsMap)) {
    if (!groups[t.group]) groups[t.group] = [];
    groups[t.group].push(t);
  }

  for (const groupName in groups) {
    groups[groupName].sort((a, b) => {
      const gdA = a.gf - a.ga;
      const gdB = b.gf - b.ga;
      return b.pts - a.pts || gdB - gdA || b.gf - a.gf;
    });
  }

  return { groups, matches };
};

const updateBracket = async () => {
  try {
    const { groups, matches } = await calculateGroupStandings();

    // 1. Tự động đẩy từ Vòng bảng lên Vòng 1/8 khi tất cả trận vòng bảng hoàn tất
    const allGroupMatchesFinished = matches.length > 0 && matches.every(m => m.status === 'FT');

    if (allGroupMatchesFinished) {
      console.log('[BRACKET] Tất cả các trận vòng bảng đã kết thúc. Tính toán đội đi tiếp...');
      const winners = [];
      const runnersUp = [];

      for (const groupName in groups) {
        const standings = groups[groupName];
        if (standings.length >= 2) {
          winners.push(standings[0]);
          runnersUp.push(standings[1]);
        }
      }

      const rankTeams = (list) => {
        return [...list].sort((a, b) => {
          const gdA = a.gf - a.ga;
          const gdB = b.gf - b.ga;
          return b.pts - a.pts || gdB - gdA || b.gf - a.gf;
        });
      };

      const rankedWinners = rankTeams(winners);
      const rankedRunnersUp = rankTeams(runnersUp);

      const r16MatchesRes = await db.query("SELECT id FROM matches WHERE competition_name = 'Vòng 1/8' ORDER BY id ASC");
      const r16Matches = r16MatchesRes.rows;

      if (r16Matches.length === 8) {
        for (let i = 0; i < 8; i++) {
          const matchId = r16Matches[i].id;
          const homeTeam = rankedWinners[i];
          const awayTeam = rankedRunnersUp[7 - i]; // Đội Nhất cao nhất đấu với Nhì thấp nhất

          if (homeTeam && awayTeam) {
            await db.query(
              'UPDATE matches SET team1_name = $1, team1_flag = $2, team2_name = $3, team2_flag = $4 WHERE id = $5',
              [homeTeam.name, homeTeam.flag, awayTeam.name, awayTeam.flag, matchId]
            );
          }
        }
        console.log('[BRACKET] Đã tự động cập nhật 8 trận đấu Vòng 1/8 từ kết quả Vòng bảng!');
      }
    }

    // 2. Tự động tiến cấp qua các vòng Knockout (Vòng 1/8 -> Tứ kết -> Bán kết -> Chung kết)
    const getMatchesByStage = async (stage) => {
      const res = await db.query('SELECT * FROM matches WHERE competition_name = $1 ORDER BY id ASC', [stage]);
      return res.rows;
    };

    const r16 = await getMatchesByStage('Vòng 1/8');
    const qf = await getMatchesByStage('Tứ kết');
    const sf = await getMatchesByStage('Bán kết');
    const final = await getMatchesByStage('Chung kết');

    const getWinner = (m) => {
      if (m.status !== 'FT') return null;
      if (m.team1_score > m.team2_score) {
        return { name: m.team1_name, flag: m.team1_flag };
      } else if (m.team2_score > m.team1_score) {
        return { name: m.team2_name, flag: m.team2_flag };
      }
      
      // Nếu hòa, xét loạt luân lưu
      const p1 = m.penalties_team1 ?? 0;
      const p2 = m.penalties_team2 ?? 0;
      if (p1 > p2) {
        return { name: m.team1_name, flag: m.team1_flag };
      } else if (p2 > p1) {
        return { name: m.team2_name, flag: m.team2_flag };
      }
      return { name: m.team1_name, flag: m.team1_flag }; // Dự phòng
    };

    // Tiến cấp Vòng 1/8 -> Tứ kết
    if (r16.length === 8 && qf.length === 4) {
      for (let i = 0; i < 8; i++) {
        const winner = getWinner(r16[i]);
        if (winner) {
          const qfIndex = Math.floor(i / 2);
          const isTeam1 = (i % 2 === 0);
          const qfMatchId = qf[qfIndex].id;
          if (isTeam1) {
            await db.query('UPDATE matches SET team1_name = $1, team1_flag = $2 WHERE id = $3', [winner.name, winner.flag, qfMatchId]);
          } else {
            await db.query('UPDATE matches SET team2_name = $1, team2_flag = $2 WHERE id = $3', [winner.name, winner.flag, qfMatchId]);
          }
        }
      }
    }

    // Tiến cấp Tứ kết -> Bán kết
    if (qf.length === 4 && sf.length === 2) {
      for (let i = 0; i < 4; i++) {
        const winner = getWinner(qf[i]);
        if (winner) {
          const sfIndex = Math.floor(i / 2);
          const isTeam1 = (i % 2 === 0);
          const sfMatchId = sf[sfIndex].id;
          if (isTeam1) {
            await db.query('UPDATE matches SET team1_name = $1, team1_flag = $2 WHERE id = $3', [winner.name, winner.flag, sfMatchId]);
          } else {
            await db.query('UPDATE matches SET team2_name = $1, team2_flag = $2 WHERE id = $3', [winner.name, winner.flag, sfMatchId]);
          }
        }
      }
    }

    // Tiến cấp Bán kết -> Chung kết
    if (sf.length === 2 && final.length === 1) {
      for (let i = 0; i < 2; i++) {
        const winner = getWinner(sf[i]);
        if (winner) {
          const finalMatchId = final[0].id;
          if (i === 0) {
            await db.query('UPDATE matches SET team1_name = $1, team1_flag = $2 WHERE id = $3', [winner.name, winner.flag, finalMatchId]);
          } else {
            await db.query('UPDATE matches SET team2_name = $1, team2_flag = $2 WHERE id = $3', [winner.name, winner.flag, finalMatchId]);
          }
        }
      }
    }

    console.log('⚡ [BRACKET] Đã tự động cập nhật tiến trình vòng loại trực tiếp.');
  } catch (error) {
    console.error('❌ [BRACKET ERROR]', error);
  }
};

module.exports = { updateBracket };
