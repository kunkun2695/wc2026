export const calculateStandings = (matches, teams) => {
  const standings = {};
  
  // Khởi tạo bảng điểm cho tất cả các đội
  teams.forEach(team => {
    standings[team.name] = { 
      name: team.name, flag: team.flag, group: team.group_name,
      p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 
    };
  });

  // Tính toán dựa trên các trận đấu
  matches.forEach(m => {
    if ((m.status === 'FINISHED' || m.status === 'LIVE') && standings[m.team1_name] && standings[m.team2_name]) {
      const t1 = standings[m.team1_name];
      const t2 = standings[m.team2_name];
      
      t1.p += 1; t2.p += 1;
      t1.gf += m.team1_score; t1.ga += m.team2_score;
      t2.gf += m.team2_score; t2.ga += m.team1_score;
      t1.gd = t1.gf - t1.ga; t2.gd = t2.gf - t2.ga;

      if (m.team1_score > m.team2_score) {
        t1.w += 1; t1.pts += 3; t2.l += 1;
      } else if (m.team1_score < m.team2_score) {
        t2.w += 1; t2.pts += 3; t1.l += 1;
      } else {
        t1.d += 1; t1.pts += 1; t2.d += 1; t2.pts += 1;
      }
    }
  });

  // Nhóm theo bảng
  const groups = ['A','B','C','D','E','F','G','H','I','J','K','L'].map(g => {
    const groupTeams = Object.values(standings)
      .filter(t => t.group === g)
      .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
    return { name: `Bảng ${g}`, teams: groupTeams };
  });

  // 8 đội hạng 3 tốt nhất
  const thirdPlaced = groups.map(g => g.teams[2]).filter(Boolean)
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  const best8ThirdIds = thirdPlaced.slice(0, 8).map(t => t.name);

  return { groups, best8ThirdIds };
};
