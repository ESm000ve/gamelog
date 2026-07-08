import { igdbFetch } from './server/igdb.ts';
(async () => {
  const res = await igdbFetch('games', `
    where id = 26758;
    fields name,first_release_date;
  `);
  console.log(res);
})();
