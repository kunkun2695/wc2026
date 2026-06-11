const axios = require('axios');

const FOOTBALL_DATA_API_KEY = '545cbd97d6964d96bdc65580d348674b';

async function testApi() {
  try {
    console.log("Fetching matches from football-data.org...");
    const response = await axios.get('https://api.football-data.org/v4/matches', {
      headers: { 'X-Auth-Token': FOOTBALL_DATA_API_KEY }
    });
    
    console.log("Total matches returned:", response.data.matches.length);
    
    // Group by competition name
    const competitions = {};
    for (const m of response.data.matches) {
      const compName = m.competition?.name || 'Unknown';
      const compCode = m.competition?.code || 'Unknown';
      competitions[`${compName} (${compCode})`] = (competitions[`${compName} (${compCode})`] || 0) + 1;
    }
    
    console.log("Competitions found:", competitions);
    
    // Print a few sample matches
    console.log("\nSample matches (first 3):");
    console.log(JSON.stringify(response.data.matches.slice(0, 3), null, 2));
    
  } catch (err) {
    console.error("API Error:", err.message);
  }
}

testApi();
