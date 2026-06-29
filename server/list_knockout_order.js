const axios = require('axios');
const FOOTBALL_DATA_API_KEY = '545cbd97d6964d96bdc65580d348674b';

async function test() {
  try {
    const response = await axios.get('https://api.football-data.org/v4/competitions/WC/matches', {
      headers: { 
        'X-Auth-Token': FOOTBALL_DATA_API_KEY,
        'Connection': 'close'
      },
      timeout: 15000
    });
    const matches = response.data.matches;
    const r16 = matches.filter(m => m.stage === 'LAST_16');
    console.log("R16 Match Count:", r16.length);
    console.log("R16 Matches:", JSON.stringify(r16.map((m, idx) => ({
      index: idx,
      id: m.id,
      home: m.homeTeam?.name,
      away: m.awayTeam?.name
    })), null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

test();
