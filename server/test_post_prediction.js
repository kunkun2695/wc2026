const axios = require('axios');

async function testPostPrediction() {
  try {
    // 1. Login
    console.log("Logging in...");
    const loginRes = await axios.post('http://localhost:5005/api/users/login', {
      username: 'Longth',
      password: '123456'
    });
    
    const token = loginRes.data.token;
    console.log("Login successful! Token:", token);
    
    // 2. Post prediction
    console.log("Posting prediction...");
    const predRes = await axios.post('http://localhost:5005/api/predictions', {
      match_id: 77,
      home_score: 1,
      away_score: 0
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log("Post response status:", predRes.status);
    console.log("Post response data:", predRes.data);
    
    // 3. Fetch predictions
    const getRes = await axios.get('http://localhost:5005/api/predictions/my', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log("My predictions:", getRes.data);
    
  } catch (err) {
    if (err.response) {
      console.error("API Error Response:", err.response.status, err.response.data);
    } else {
      console.error("Error message:", err.message);
    }
  }
}

testPostPrediction();
