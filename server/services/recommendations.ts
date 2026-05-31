import { getInnertube } from './youtube';
import { getRecentHistory } from '../models/history';
import { getAllLikes } from '../models/like';
import { getFollowedChannels } from '../models/channel';
import { toSearchResultAudio } from '../models/search';
import { extractRelatedVideos } from '../models/related';
import type { SearchResultAudio, PersonalizedRecommendationsResponse } from '@/types';

export async function getRelatedVideos(
  videoId: string,
  excludeIds: string[] = [],
  limit = 5,
) {
  const innertube = await getInnertube();
  const info = await innertube.getInfo(videoId);
  const feed = (info as unknown as Record<string, unknown>).watch_next_feed;

  return extractRelatedVideos(feed, videoId, excludeIds, limit);
}

export async function getRecommendationsFromChannels(userId: string): Promise<SearchResultAudio[]> {
  const history = await getRecentHistory(userId, 50);
  const likes = await getAllLikes(userId);
  const followed = await getFollowedChannels(userId);

  const channelCount = new Map<string, { name: string; count: number }>();
  for (const item of [...history, ...likes]) {
    const name = item.channel;
    if (!name) {continue;}
    const existing = channelCount.get(name);
    if (existing) {existing.count++;}
    else {channelCount.set(name, { name, count: 1 });}
  }

  const topChannels = [...channelCount.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const results: SearchResultAudio[] = [];
  const seen = new Set<string>();
  const innertube = await getInnertube();

  const channelNames = [
    ...topChannels.map((c) => c.name),
    ...followed.map((f) => f.channelName),
  ];

  const searchPromises = channelNames.map(async (channelName) => {
    try {
      const search = await innertube.search(channelName);
      const searchResult = search as unknown as Record<string, unknown>;
      const items: unknown[] = Array.isArray(searchResult.results)
        ? searchResult.results as unknown[]
        : [];
      return items.map(toSearchResultAudio).filter((a): a is SearchResultAudio => a != null && !seen.has(a.id));
    } catch {
      return [];
    }
  });

  const batchResults = await Promise.all(searchPromises);
  for (const batch of batchResults) {
    for (const audio of batch) {
      if (results.length >= 5) {break;}
      if (!seen.has(audio.id)) {
        seen.add(audio.id);
        results.push(audio);
      }
    }
    if (results.length >= 5) {break;}
  }

  return results;
}

export async function getRecommendationsFromRecent(userId: string): Promise<SearchResultAudio[]> {
  const history = await getRecentHistory(userId, 3);
  if (history.length === 0) {return [];}

  const allHistory = await getRecentHistory(userId, 100);
  const allLikes = await getAllLikes(userId);
  const excludeIds = new Set([
    ...allHistory.map((h) => h.videoId),
    ...allLikes.map((l) => l.videoId),
  ]);

  const results: SearchResultAudio[] = [];
  const seen = new Set<string>();

  for (const item of history) {
    if (results.length >= 5) {break;}
    try {
      const related = await getRelatedVideos(
        item.videoId,
        [...excludeIds, ...seen],
        5,
      );
      for (const audio of related.results) {
        if (results.length >= 5) {break;}
        if (seen.has(audio.id)) {continue;}
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
