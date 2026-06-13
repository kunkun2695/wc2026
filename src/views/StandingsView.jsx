import React from 'react';
import { Trophy, ShieldCheck, HelpCircle } from 'lucide-react';

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
      <header className="page-header-std">
        <div className="trophy-glow-wrapper">
          <Trophy className="trophy-icon-std" size={48} />
        </div>
        <h1 className="font-outfit std-title">BẢNG XẾP HẠNG VÒNG BẢNG</h1>
        <p className="std-subtitle">Top 2 đội mỗi bảng sẽ giành vé tiến vào Vòng 32 đội</p>
      </header>

      <div className="groups-grid-std">
        {groups.map((group, idx) => {
          const groupStandings = calculateStandings(group);
          return (
            <div key={group} className="group-card-std">
              <div className="group-header-std">
                <span className="group-name-label">BẢNG {group}</span>
                <span className="group-badge-std">VÒNG BẢNG</span>
              </div>
              
              <table className="standings-table-std">
                <thead>
                  <tr>
                    <th className="th-team">ĐỘI BÓNG</th>
                    <th className="th-stat">TRẬN</th>
                    <th className="th-stat">HS</th>
                    <th className="th-stat th-pts">ĐIỂM</th>
                  </tr>
                </thead>
                <tbody>
                  {groupStandings.map((team, rank) => {
                    const isQualified = rank < 2;
                    return (
                      <tr key={team.id} className={`team-row-std ${isQualified ? 'is-qualified' : ''}`}>
                        <td className="td-team">
                          <div className="team-info-std">
                            <span className={`rank-number-std ${isQualified ? 'qualified' : ''}`}>
                              {rank + 1}
                            </span>
                            <span className="team-flag-std">{team.flag}</span>
                            <span className="team-name-std">
                              {team.name}
                              {isQualified && (
                                <span className="qualified-tag-std" title="Giành vé đi tiếp">
                                  <ShieldCheck size={10} /> Đi tiếp
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="td-stat">{team.played}</td>
                        <td className={`td-stat gd-stat-std ${team.gd > 0 ? 'plus' : team.gd < 0 ? 'minus' : ''}`}>
                          {team.gd > 0 ? `+${team.gd}` : team.gd}
                        </td>
                        <td className="td-stat td-pts-value">{team.pts}</td>
                      </tr>
                    );
                  })}
                  {groupStandings.length === 0 && (
                    <tr>
                      <td colSpan="4" className="empty-group-row">
                        Đang cập nhật danh sách bảng đấu...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .standings-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px 100px 20px;
        }
        .page-header-std {
          text-align: center;
          margin-bottom: 45px;
        }
        .trophy-glow-wrapper {
          width: 76px;
          height: 76px;
          background: rgba(255, 215, 0, 0.08);
          border: 1px solid rgba(255, 215, 0, 0.2);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 18px;
          box-shadow: 0 8px 20px rgba(255, 215, 0, 0.1);
        }
        .trophy-icon-std {
          color: #ffd700;
          filter: drop-shadow(0 0 8px #ffd700);
        }
        .std-title {
          font-size: 2rem;
          font-weight: 900;
          color: white;
          letter-spacing: -1px;
          margin-bottom: 6px;
        }
        .std-subtitle {
          color: #94a3b8;
          font-size: 0.85rem;
          font-weight: 600;
        }

        /* Group cards grid layout */
        .groups-grid-std {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        
        @media (max-width: 1024px) {
          .groups-grid-std {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 700px) {
          .groups-grid-std {
            grid-template-columns: 1fr;
          }
        }

        .group-card-std {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.5) 0%, rgba(30, 41, 59, 0.3) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 20px;
          transition: all 0.3s ease;
        }
        .group-card-std:hover {
          transform: translateY(-3px);
          border-color: rgba(0, 210, 255, 0.2);
          box-shadow: 0 10px 25px rgba(0,0,0,0.4);
        }

        .group-header-std {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .group-name-label {
          font-weight: 900;
          color: white;
          font-size: 1rem;
          letter-spacing: 0.5px;
        }
        .group-badge-std {
          font-size: 0.6rem;
          font-weight: 900;
          color: #00d2ff;
          background: rgba(0, 210, 255, 0.08);
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid rgba(0, 210, 255, 0.15);
        }

        /* Standings table styling */
        .standings-table-std {
          width: 100%;
          border-collapse: collapse;
        }
        
        .th-team { text-align: left; font-size: 0.65rem; color: #475569; padding: 6px 4px; font-weight: 900; letter-spacing: 0.5px; }
        .th-stat { text-align: center; font-size: 0.65rem; color: #475569; padding: 6px 4px; font-weight: 900; width: 42px; }
        .th-pts { color: #ffd700; width: 48px; }

        .team-row-std {
          border-bottom: 1px solid rgba(255, 255, 255, 0.02);
          transition: all 0.15s ease;
        }
        .team-row-std:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        
        .team-row-std.is-qualified {
          background: rgba(52, 211, 153, 0.01);
        }

        .td-team { padding: 10px 4px; text-align: left; }
        .td-stat { padding: 10px 4px; text-align: center; font-size: 0.85rem; font-weight: 700; color: #94a3b8; }
        .td-pts-value { font-weight: 900; color: #ffd700; font-size: 0.95rem; }

        .team-info-std {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        
        .rank-number-std {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-weight: 800;
          background: rgba(255, 255, 255, 0.03);
          color: #475569;
        }
        .rank-number-std.qualified {
          background: rgba(52, 211, 153, 0.1);
          color: #34d399;
          border: 1px solid rgba(52, 211, 153, 0.2);
        }

        .team-flag-std {
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .team-name-std {
          font-weight: 700;
          color: white;
          font-size: 0.85rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: flex;
          flex-direction: column;
        }

        .qualified-tag-std {
          font-size: 0.55rem;
          font-weight: 800;
          color: #34d399;
          display: flex;
          align-items: center;
          gap: 2px;
          margin-top: 1px;
          text-transform: uppercase;
        }
        
        .gd-stat-std.plus { color: #34d399; }
        .gd-stat-std.minus { color: #ef4444; }

        .empty-group-row {
          text-align: center;
          padding: 20px 0;
          font-size: 0.8rem;
          color: #475569;
          font-weight: 600;
        }
        
        @media (max-width: 600px) {
          .standings-container { padding: 80px 15px 100px 15px; }
          .group-card-std { padding: 15px; }
        }
      ` }} />
    </div>
  );
};

export default StandingsView;
