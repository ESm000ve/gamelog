const https = require('https');

async function main() {
  const tokenRes = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'id.twitch.tv',
      path: `/oauth2/token?client_id=3a0dr2wt7kt0sylxudftp15hgslipy&client_secret=rse2pvv4c6830qn6u60a28gjj7rjn9&grant_type=client_credentials`,
      method: 'POST'
    }, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.end();
  });

  console.log("Token:", tokenRes.access_token);

  const query = `
    where platforms = (4) & (category = null | category = (0, 8, 9, 10, 11));
    fields name, category;
    limit 10;
  `;

  console.log("Query:", query);

  const gamesRes = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.igdb.com',
      path: '/v4/games',
      method: 'POST',
      headers: {
        'Client-ID': '3a0dr2wt7kt0sylxudftp15hgslipy',
        'Authorization': `Bearer ${tokenRes.access_token}`,
        'Accept': 'application/json',
      }
    }, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch(e) { resolve(d); }
      });
    });
    req.on('error', reject);
    req.write(query);
    req.end();
  });

  console.log("Response:", gamesRes);
}
main().catch(console.error);
