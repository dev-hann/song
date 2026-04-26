import { getInnertube } from './youtube.js';
import { getRecentHistory } from '../models/history.js';
import { getAllLikes } from '../models/like.js';
import { getFollowedChannels } from '../models/channel.js';
import { toSearchResultAudio, isAudioContent } from '../models/search.js';
import { extractRelatedVideos } from '../models/related.js';
import type { SearchResultAudio, PersonalizedRecommendationsResponse } from '@song/types';

export async function getRelatedVideos(
  videoId: string,
  excludeIds: string[] = [],
  limit = 5,
) {
  const innertube = await getInnertube();
  const info = await innertube.getInfo(videoId);
  const feed = (info as any).watch_next_feed;

  return extractRelatedVideos(feed, videoId, excludeIds, limit);
}

export async function getRecommendationsFromChannels(userId: string): Promise<SearchResultAudio[]> {
  const history = getRecentHistory(userId, 50);
  const likes = getAllLikes(userId);
  const followed = getFollowedChannels(userId);

  const channelCount = new Map<string, { name: string; count: number }>();
  for (const item of [...history, ...likes]) {
    const name = item.channel;
    if (!name) continue;
    const existing = channelCount.get(name);
    if (existing) existing.count++;
    else channelCount.set(name, { name, count: 1 });
  }

  const topChannels = [...channelCount.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const results: SearchResultAudio[] = [];
  const seen = new Set<string>();
  const innertube = await getInnertube();

  const channelNames = [
    ...topChannels.map((c) => c.name),
    ...followed.map((f) => f.channel_name),
  ];

  for (const channelName of channelNames) {
    if (results.length >= 5) break;
    try {
      const search = await innertube.search(channelName);
      const items = Array.isArray((search as any).results)
        ? (search as any).results
        : [];

      for (const item of items) {
        if (results.length >= 5) break;
        const audio = toSearchResultAudio(item);
        if (!audio || seen.has(audio.id)) continue;
        seen.add(audio.id);
        results.push(audio);
      }
    } catch {}
  }

  return results;
}

export async function getRecommendationsFromRecent(userId: string): Promise<SearchResultAudio[]> {
  const history = getRecentHistory(userId, 3);
  if (history.length === 0) return [];

  const allHistory = getRecentHistory(userId, 100);
  const allLikes = getAllLikes(userId);
  const excludeIds = new Set([
    ...allHistory.map((h) => h.video_id),
    ...allLikes.map((l) => l.video_id),
  ]);

  const results: SearchResultAudio[] = [];
  const seen = new Set<string>();

  for (const item of history) {
    if (results.length >= 5) break;
    try {
      const related = await getRelatedVideos(
        item.video_id,
        [...excludeIds, ...seen],
        5,
      );
      for (const audio of related.results) {
        if (results.length >= 5) break;
        if (seen.has(audio.id)) continue;
        seen.add(audio.id);
        results.push(audio);
      }
    } catch {}
  }

  return results;
}

export async function getPersonalizedRecommendations(userId: string): Promise<PersonalizedRecommendationsResponse> {
  const [fromChannels, fromRecent] = await Promise.all([
    getRecommendationsFromChannels(userId).catch(() => []),
    getRecommendationsFromRecent(userId).catch(() => []),
  ]);

  return { fromChannels, fromRecent };
}
