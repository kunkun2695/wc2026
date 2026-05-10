const path = require('path');
const dotenv = require('dotenv');

// Simulation of what index.js does
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('VAPID_PUBLIC_KEY:', process.env.VAPID_PUBLIC_KEY ? 'EXISTS' : 'MISSING');
console.log('VAPID_PRIVATE_KEY:', process.env.VAPID_PRIVATE_KEY ? 'EXISTS' : 'MISSING');
console.log('VITE_VAPID_PUBLIC_KEY:', process.env.VITE_VAPID_PUBLIC_KEY ? 'EXISTS' : 'MISSING');
console.log('PORT:', process.env.PORT);
