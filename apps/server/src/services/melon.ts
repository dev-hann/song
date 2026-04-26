import * as cheerio from 'cheerio';
import type { MelonChartItem } from '@song/types';

export type MelonChartType = 'realtime' | 'hot100' | 'daily';

const CHART_URLS: Record<MelonChartType, string> = {
  realtime: 'https://www.melon.com/chart/index.htm',
  hot100: 'https://www.melon.com/chart/hot100/index.htm',
  daily: 'https://www.melon.com/chart/day/index.htm',
};

const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const CACHE_TTL = 60 * 60 * 1000;
const cache = new Map<MelonChartType, { data: MelonChartItem[]; at: number }>();

function parseChart(html: string): MelonChartItem[] {
  const $ = cheerio.load(html);
  const items: MelonChartItem[] = [];

  $('tr.lst50, tr.lst100').each((_, el) => {
    const rank = $(el).find('.rank').first().text().trim();
    const title = $(el).find('.ellipsis.rank01 span a').first().text().trim();
    const artist = $(el).find('.ellipsis.rank02 a').first().text().trim();
    const album = $(el).find('.ellipsis.rank03 a').first().text().trim();
    const albumArt = $(el).find('img').first().attr('src') || '';

    if (title && rank) {
      let art = albumArt;
      if (art && art.includes('_500.jpg')) {
        art = art.replace('_500.jpg', '_500.jpg/melon/resize/200/quality/80/optimize');
      }
      items.push({
        rank: parseInt(rank) || items.length + 1,
        title,
        artist,
        album,
        albumArt: art,
      });
    }
  });

  return items;
}

export async function getMelonChart(type: MelonChartType = 'realtime'): Promise<MelonChartItem[]> {
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

  if (!res.ok) throw new Error(`Melon fetch failed (${type}): ${res.status}`);

  const html = await res.text();
  const items = parseChart(html);

  if (items.length > 0) {
    cache.set(type, { data: items, at: Date.now() });
  }

  return items;
}
