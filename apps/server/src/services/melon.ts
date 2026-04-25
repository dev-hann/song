import * as cheerio from 'cheerio';

const CHART_URL = 'https://www.melon.com/chart/index.htm';
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

interface MelonChartItem {
  rank: number;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
}

let cachedChart: MelonChartItem[] | null = null;
let cachedAt = 0;
const CACHE_TTL = 60 * 60 * 1000;

export async function getMelonChart(): Promise<MelonChartItem[]> {
  if (cachedChart && Date.now() - cachedAt < CACHE_TTL) {
    return cachedChart;
  }

  const res = await fetch(CHART_URL, {
    headers: {
      'User-Agent': DESKTOP_UA,
      'Accept-Language': 'ko-KR,ko;q=0.9',
    },
  });

  if (!res.ok) throw new Error(`Melon fetch failed: ${res.status}`);

  const html = await res.text();
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

  if (items.length > 0) {
    cachedChart = items;
    cachedAt = Date.now();
  }

  return items;
}
