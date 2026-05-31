// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { parseGenreArtists } from '../provider';

function makeChartHtml(artists: { name: string; art: string }[]): string {
  const rows = artists
    .map(
      (a, i) => `
    <tr class="lst50">
      <td class="rank">${i + 1}</td>
      <td class="ellipsis rank02"><a>${a.name}</a></td>
      <td><img src="${a.art}" /></td>
    </tr>`,
    )
    .join('');
  return `<table><tbody>${rows}</tbody></table>`;
}

describe('parseGenreArtists', () => {
  it('extracts unique artists sorted by frequency', () => {
    const html = makeChartHtml([
      { name: 'AKMU (악뮤)', art: 'https://cdnimg.melon.co.kr/cm2/album/images/133/12/398/13312398_500.jpg' },
      { name: 'AKMU (악뮤)', art: 'https://cdnimg.melon.co.kr/cm2/album/images/133/12/398/13312398_500.jpg' },
      { name: '아이유', art: 'https://cdnimg.melon.co.kr/cm2/album/images/114/04/142/11404142_500.jpg' },
      { name: 'NewJeans', art: 'https://cdnimg.melon.co.kr/cm2/album/images/110/11/565/11011565_500.jpg' },
    ]);

    const result = parseGenreArtists(html);

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('AKMU (악뮤)');
    expect(result[1].name).toBe('아이유');
    expect(result[2].name).toBe('NewJeans');
  });

  it('returns at most 10 artists', () => {
    const artists = Array.from({ length: 15 }, (_, i) => ({
      name: `Artist ${i + 1}`,
      art: 'https://example.com/art.jpg',
    }));
    const html = makeChartHtml(artists);

    const result = parseGenreArtists(html);

    expect(result).toHaveLength(10);
  });

  it('filters out Various Artists', () => {
    const html = makeChartHtml([
      { name: 'AKMU (악뮤)', art: 'https://example.com/a.jpg' },
      { name: 'Various Artists', art: 'https://example.com/b.jpg' },
    ]);

    const result = parseGenreArtists(html);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('AKMU (악뮤)');
  });

  it('optimizes album art URL', () => {
    const html = makeChartHtml([
      { name: '아이유', art: 'https://cdnimg.melon.co.kr/cm2/album/images/114/04/142/11404142_500.jpg' },
    ]);

    const result = parseGenreArtists(html);

    expect(result[0].albumArt).toContain('/melon/resize/200/quality/80/optimize');
  });

  it('returns empty array for HTML with no chart rows', () => {
    const html = '<html><body><table><tbody></tbody></table></body></html>';

    const result = parseGenreArtists(html);

    expect(result).toHaveLength(0);
  });

  it('handles lst100 class rows as well', () => {
    const html = `
      <table><tbody>
        <tr class="lst100">
          <td class="rank">51</td>
          <td class="ellipsis rank02"><a>BTS</a></td>
          <td><img src="https://example.com/bts.jpg" /></td>
        </tr>
      </tbody></table>`;

    const result = parseGenreArtists(html);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('BTS');
  });
});
