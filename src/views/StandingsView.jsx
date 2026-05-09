import React from 'react';

const StandingsView = ({ teams, matches }) => {
  // Logic tính toán bảng xếp hạng
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  const calculateStandings = (groupName) => {
    const groupTeams = teams.filter(t => t.group_name === groupName);
    
    return groupTeams.map(team => {
      let played = 0, won = 0, drawn = 0, lost = 0, gf = 0, ga = 0, pts = 0;

      matches.forEach(m => {
        if (m.status === 'FT') {
          if (m.team1_name === team.name) {
            played++;
            gf += m.team1_score;
            ga += m.team2_score;
            if (m.team1_score > m.team2_score) { won++; pts += 3; }
            else if (m.team1_score === m.team2_score) { drawn++; pts += 1; }
            else lost++;
          } else if (m.team2_name === team.name) {
            played++;
            gf += m.team2_score;
            ga += m.team1_score;
            if (m.team2_score > m.team1_score) { won++; pts += 3; }
            else if (m.team2_score === m.team1_score) { drawn++; pts += 1; }
            else lost++;
          }
        }
      });

      return { ...team, played, won, drawn, lost, gf, ga, gd: gf - ga, pts };
    }).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  };

  return (
    <div className="standings-container animate-fade">
      <header className="page-header">
        <div className="trophy-icon">🏆</div>
        <h1 className="font-outfit">Bản đồ giải đấu</h1>
        <h2 className="font-outfit subtitle">Vòng Bảng</h2>
      </header>

      <div className="groups-grid">
        {groups.map((group, idx) => {
          const groupStandings = calculateStandings(group);
          return (
            <div key={group} className="glass-panel group-card animate-fade" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="group-title">
                <span>Bảng {group}</span>
                <span className="team-count">4 Đội</span>
              </div>
              
              <table className="standings-table">
                <thead>
                  <tr>
                    <th className="standings-header" style={{ textAlign: 'left' }}>Đội</th>
                    <th className="standings-header">P</th>
                    <th className="standings-header">GD</th>
                    <th className="standings-header">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {groupStandings.map((team, rank) => (
                    <tr key={team.id} className="team-row">
                      <td className="team-cell">
                        <div className="team-info">
                          <span className="team-rank">{rank + 1}</span>
                          <span className="team-flag">{team.flag}</span>
                          <span className="team-name">
                            {team.name}
                            {rank < 2 && <span className="qualified-badge">Qualified</span>}
                          </span>
                        </div>
                      </td>
                      <td className="team-cell stat-cell">{team.played}</td>
                      <td className="team-cell stat-cell">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                      <td className="team-cell points-cell">{team.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .standings-container {
          padding-bottom: 80px;
        }
        .page-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .trophy-icon {
          font-size: 3rem;
          margin-bottom: 10px;
          filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.5));
        }
        .subtitle {
          font-size: 2.5rem;
          background: var(--gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 900;
        }
        .groups-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }
        .team-count {
          font-size: 0.8rem;
          color: var(--text-dim);
          font-weight: 400;
        }
        @media (max-width: 600px) {
          .groups-grid {
            grid-template-columns: 1fr;
          }
          .subtitle {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default StandingsView;
