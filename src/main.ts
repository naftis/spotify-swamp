import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';
import { uniqBy } from 'lodash';
import fetch from 'node-fetch';
import * as Spotify from 'node-spotify-api';
import * as qs from 'qs';

dotenv.config();

process.on('unhandledRejection', r => console.log(r));

const spotify = new Spotify({
  id: process.env.SPOTIFY_API_ID,
  secret: process.env.SPOTIFY_API_SECRET,
});

function avoidRateLimitation() {
  return new Promise(resolve => setTimeout(resolve, 1500));
}

interface IAlbum {
  artist: string;
  name: string;
}

async function getAlbums(spotifyApi: any): Promise<IAlbum[]> {
  const response = await spotifyApi.request(
    `https://api.spotify.com/v1/playlists/${
      process.env.SPOTIFY_PLAYLIST_ID
    }?limit=500`
  );

  const albums: IAlbum[] = response.tracks.items.map((item: any) => ({
    artist: item.track.album.artists[0].name,
    name: item.track.album.name,
  }));

  const uniqueAlbums = uniqBy(albums, album => JSON.stringify(album));
  return uniqueAlbums;
}

interface IResult {
  link: string;
  name: string;
}

async function searchSwamp(searchText: string) {
  const search = { product_search_words: searchText };
  const request = await fetch(
    'https://www.swampmusic.com/product-search-fi.html',
    {
      body: qs.stringify(search),
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language':
          'en-FI,en;q=0.9,fi-FI;q=0.8,fi;q=0.7,en-US;q=0.6,it;q=0.5',
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: '3b46_customer_se=e842201990b0ce03ff9cedc80ff4411b',
        Origin: 'https://www.swampmusic.com',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
        referrer: 'https://www.swampmusic.com/product-search-fi.html',
      },
      method: 'POST',
    }
  );

  const response = await request.text();
  const dom = cheerio.load(response);

  const items = dom('.product_list_item_title_short');
  const albums: IResult[] = items
    .map((x, element) => ({
      link: cheerio(element)
        .children('a')
        .attr('href'),
      name: cheerio(element).text(),
    }))
    .get() as any;

  return albums;
}

async function findAlbums() {
  const albums = await getAlbums(spotify);

  const foundResults: IResult[] = [];

  for (const album of albums) {
    const searchText = `${album.artist} ${album.name}`;
    const searchResults = await searchSwamp(searchText);

    for (const result of searchResults) {
      if (!result.name.toLowerCase().includes(album.artist.toLowerCase())) {
        continue;
      }

      const alreadyFound = foundResults.some(
        foundResult => foundResult.link === result.link
      );

      if (alreadyFound) {
        continue;
      }

      foundResults.push(result);

      console.log(result.name);
      console.log(result.link);
      console.log();
    }

    await avoidRateLimitation();
  }
}

findAlbums();
