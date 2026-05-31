import type { IMelonProvider } from '@/server/domain/ports/providers';
import type { MelonChartItem } from '@/types';
import type { OnboardingArtist } from '@/types/onboarding';
import * as cheerio from 'cheerio';
import { MelonChartItemSchema } from '@/server/domain/entities/melon';

export type MelonChartType = 'realtime' | 'hot100' | 'daily';

export const MELON_ONBOARDING_GENRES = [
  { id: 'GN0100', name: '발라드' },
  { id: 'GN0200', name: '댄스' },
  { id: 'GN0300', name: '랩/힙합' },
  { id: 'GN0400', name: 'R&B/Soul' },
  { id: 'GN0500', name: '인디음악' },
  { id: 'GN2100', name: 'CCM' },
] as const;

const CHART_URLS: Record<MelonChartType, string> = {
  realtime: 'https://www.melon.com/chart/index.htm',
  hot100: 'https://www.melon.com/chart/hot100/index.htm',
  daily: 'https://www.melon.com/chart/day/index.htm',
};

const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const CACHE_TTL = 60 * 60 * 1000;
const cache = new Map<MelonChartType, { data: MelonChartItem[]; at: number }>();
const genreArtistCache = new Map<string, { data: OnboardingArtist[]; at: number }>();
const GENRE_CACHE_TTL = 24 * 60 * 60 * 1000;

function parseChart(html: string): MelonChartItem[] {
  const $ = cheerio.load(html);
  const items: MelonChartItem[] = [];

  $('tr.lst50, tr.lst100').each((_, el) => {
    const rank = $(el).find('.rank').first().text().trim();
    const title = $(el).find('.ellipsis.rank01 span a').first().text().trim();
    const artist = $(el).find('.ellipsis.rank02 a').first().text().trim();
    const album = $(el).find('.ellipsis.rank03 a').first().text().trim();
    const albumArt = $(el).find('img').first().attr('src') ?? '';

    if (title && rank) {
      let art = albumArt;
      if (art.includes('_500.jpg')) {
        art = art.replace('_500.jpg', '_500.jpg/melon/resize/200/quality/80/optimize');
      }
      items.push(MelonChartItemSchema.parse({
        rank: parseInt(rank) || items.length + 1,
        title,
        artist,
        album,
        albumArt: art,
      }));
    }
  });

  return items;
}

export function parseGenreArtists(html: string): OnboardingArtist[] {
  const $ = cheerio.load(html);
  const artistCounts = new Map<string, { count: number; albumArt: string }>();

  $('tr.lst50, tr.lst100').each((_, el) => {
    const artist = $(el).find('.ellipsis.rank02 a').first().text().trim();
    const albumArt = $(el).find('img').first().attr('src') ?? '';

    if (artist && artist !== 'Various Artists') {
      const existing = artistCounts.get(artist);
      if (existing) {
        existing.count++;
      } else {
        let art = albumArt;
        if (art.includes('_500.jpg')) {
          art = art.replace('_500.jpg', '_500.jpg/melon/resize/200/quality/80/optimize');
        }
        artistCounts.set(artist, { count: 1, albumArt: art });
      }
    }
  });

  return Array.from(artistCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([name, data]) => ({ name, albumArt: data.albumArt }));
}

async function getGenreArtists(gnrCode: string): Promise<OnboardingArtist[]> {
  const cached = genreArtistCache.get(gnrCode);
  if (cached && Date.now() - cached.at < GENRE_CACHE_TTL) {
    return cached.data;
  }

  const url = `https://www.melon.com/chart/index.htm?gnrCode=${gnrCode}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': DESKTOP_UA,
      'Accept-Language': 'ko-KR,ko;q=0.9',
    },
  });

  if (!res.ok) {return [];}

  const html = await res.text();
  const artists = parseGenreArtists(html);

  if (artists.length > 0) {
    genreArtistCache.set(gnrCode, { data: artists, at: Date.now() });
  }

  return artists;
}

export const melonProvider: IMelonProvider = {
  async getChart(type = 'realtime'): Promise<MelonChartItem[]> {
    const cached = cache.get(type);
    if (cached && Date.now() - cached.at < CACHE_TTL) {
      return cached.data;
    }

    const url = CHART_URLS[type];
    const res = await fetch(url, {
      headers: {
        'User-Agent': DESKTOP_UA,
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
    });

    if (!res.ok) {throw new Error(`Melon fetch failed (${type}): ${res.status}`);}

    const html = await res.text();
    const items = parseChart(html);

    if (items.length > 0) {
      cache.set(type, { data: items, at: Date.now() });
    }

    return items;
  },

  async getAllGenreArtists(): Promise<Array<{ id: string; name: string; artists: OnboardingArtist[] }>> {
    const results = await Promise.all(
      MELON_ONBOARDING_GENRES.map(async (genre) => {
        const artists = await getGenreArtists(genre.id).catch(() => []);
        return { id: genre.id, name: genre.name, artists };
      }),
    );
    return results;
  },
};
