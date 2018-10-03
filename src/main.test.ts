import { findAlbums } from './main';

process.env.SPOTIFY_PLAYLIST_ID = '4tx6xou5Wtg9ailTkMdQ87';

test('test findAlbum()', async () => {
  const results = await findAlbums('4tx6xou5Wtg9ailTkMdQ87');
  expect(results).toEqual([
    {
      link: 'https://www.swampmusic.com/p4539-ac-dc-razors-edge-fi.html',
      name: "AC/DC - Razor's edge",
    },
  ]);
});
