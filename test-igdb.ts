import { igdbFetch } from './server/igdb.ts';
(async () => {
  const res = await igdbFetch('games', 'search "mario"; where platforms = (19); fields name;');
  console.log(JSON.stringify(res, null, 2));
})();
