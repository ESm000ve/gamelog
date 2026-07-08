const https = require('https');

const req = https.request('https://api.igdb.com/v4/games', {
  method: 'POST',
  headers: {
    'Client-ID': process.env.VITE_IGDB_CLIENT_ID || 'fake',
    'Authorization': `Bearer ${process.env.IGDB_ACCESS_TOKEN || 'fake'}`
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
req.write('where platforms = (48) & name ~ *"te"*; fields name; sort total_rating_count desc; limit 5;');
req.end();
