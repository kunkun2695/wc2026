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
    const filtered = matches.filter(m => 
      m.homeTeam?.name?.includes('Germany') || m.awayTeam?.name?.includes('Germany') ||
      m.homeTeam?.name?.includes('Netherlands') || m.awayTeam?.name?.includes('Netherlands')
    );
    console.log(JSON.stringify(filtered.map(m => ({
      id: m.id,
      stage: m.stage,
      home: m.homeTeam.name,
      away: m.awayTeam.name,
      status: m.status
    })), null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

test();
