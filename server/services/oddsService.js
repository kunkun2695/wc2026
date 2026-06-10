const axios = require('axios');
const db = require('../config/db');

// Helper to normalize team names
const mapTeamName = (name) => {
  if (!name) return '';
  const clean = name.trim().toLowerCase();
  
  const mapping = {
    'séc': 'CH Séc',
    'maróc': 'Morocco',
    'bosnia-herzegovina': 'Bosnia',
    'cape verde': 'Cabo Verde',
    'cabo verde': 'Cabo Verde',
  };
  
  return mapping[clean] || name.trim();
};

// Helper to parse handicap string to float
const parseHandicapVal = (text) => {
  if (!text) return 0;
  text = text.trim();
  if (text === '0') return 0;
  if (text.includes('/')) {
    const parts = text.split('/');
    const val1 = parseFloat(parts[0]);
    const val2 = parseFloat(parts[1]);
    return (val1 + val2) / 2;
  }
  return parseFloat(text) || 0;
};

// Helper to parse Over/Under string to float
const parseOuVal = (text) => {
  if (!text) return 0;
  text = text.trim().toLowerCase().replace('u', '');
  if (text.includes('/')) {
    const parts = text.split('/');
    const val1 = parseFloat(parts[0]);
    const val2 = parseFloat(parts[1]);
    return (val1 + val2) / 2;
  }
  return parseFloat(text) || 0;
};

const syncOdds = async () => {
  try {
    console.log('[ODDS SYNC] Fetching odds from kqbd.mobi...');
    const response = await axios.get('https://kqbd.mobi/keo-bong-da/world-cup', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const html = response.data;
    const blocks = html.split('<div class="box-info-table');
    let updatedCount = 0;
    
    for (let i = 1; i < blocks.length; i++) {
      const block = blocks[i];
      
      // Extract CLB names
      const clbMatches = [...block.matchAll(/<div class="(name-clb-green|name-clb-black)">([^<]+)<\/div>/g)];
      if (clbMatches.length < 2) continue;
      
      const team1Class = clbMatches[0][1];
      const team1NameRaw = clbMatches[0][2].trim();
      const team2Class = clbMatches[1][1];
      const team2NameRaw = clbMatches[1][2].trim();
      
      const team1Name = mapTeamName(team1NameRaw);
      const team2Name = mapTeamName(team2NameRaw);
      
      // Determine favorite team
      let favoriteTeam = null;
      if (team1Class === 'name-clb-green') {
        favoriteTeam = team1Name;
      } else if (team2Class === 'name-clb-green') {
        favoriteTeam = team2Name;
      }
      
      // Extract handicap
      const ratioHandicapMatch = block.match(/<div class="ratio-handicap">([\s\S]*?)(?=<div class="ratio-over-under">)/);
      let handicapText = '';
      let handicapValue = 0;
      
      if (ratioHandicapMatch) {
        const handicapBlock = ratioHandicapMatch[1];
        const redMatches = [...handicapBlock.matchAll(/<div class="ratio-red">([\s\S]*?)<\/div>/g)];
        if (redMatches.length >= 2) {
          const val1 = redMatches[0][1].replace(/<span>|<\/span>/g, '').trim();
          const val2 = redMatches[1][1].replace(/<span>|<\/span>/g, '').trim();
          
          if (val1 && val1 !== '0') {
            handicapText = val1;
            handicapValue = parseHandicapVal(val1);
            favoriteTeam = team1Name;
          } else if (val2 && val2 !== '0') {
            handicapText = val2;
            handicapValue = parseHandicapVal(val2);
            favoriteTeam = team2Name;
          } else {
            handicapText = '0';
            handicapValue = 0;
            favoriteTeam = null;
          }
        }
      }
      
      // Extract Over/Under
      const ratioOuMatch = block.match(/<div class="ratio-over-under">([\s\S]*?)(?=<div class="ratio-1x2">)/);
      let ouText = '';
      let ouValue = 0;
      
      if (ratioOuMatch) {
        const ouBlock = ratioOuMatch[1];
        const redMatches = [...ouBlock.matchAll(/<div class="ratio-red">([\s\S]*?)<\/div>/g)];
        if (redMatches.length > 0) {
          const val = redMatches[0][1].replace(/<span>|<\/span>/g, '').trim();
          if (val) {
            ouText = val;
            ouValue = parseOuVal(val);
          }
        }
      }
      
      // Update DB
      const result = await db.query(
        `UPDATE matches 
         SET handicap_favorite = $1, 
             handicap_value = $2, 
             handicap_text = $3, 
             ou_value = $4, 
             ou_text = $5 
         WHERE (team1_name = $6 AND team2_name = $7) 
            OR (team1_name = $7 AND team2_name = $6)
         RETURNING id, team1_name, team2_name`,
        [favoriteTeam, handicapValue, handicapText, ouValue, ouText, team1Name, team2Name]
      );
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        console.log(`[ODDS SYNC] Match: ${row.team1_name} vs ${row.team2_name} | Fav: ${favoriteTeam}, Handicap: ${handicapText} (${handicapValue}), O/U: ${ouText} (${ouValue})`);
        updatedCount++;
      }
    }
    
    console.log(`[ODDS SYNC] Hoàn tất! Đã đồng bộ kèo cho ${updatedCount} trận đấu.`);
    return updatedCount;
  } catch (error) {
    console.error('[ODDS SYNC] Lỗi đồng bộ kèo:', error.message);
    throw error;
  }
};

module.exports = { syncOdds };
