import { z } from 'zod';
import type { Playlist as PlaylistType, PlaylistTrack as PlaylistTrackType, SmartPlaylistRules } from '@/types';
import { db } from '@/server/db';
import { playlists, playlistTracks, likes, playlistFolders } from '@/server/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { toPlaylistDTO, toPlaylistTrackDTO, toPlaylistFolderDTO } from './dto';
import crypto from 'crypto';

export const PlaylistTrackSchema = z.object({
  id: z.number(),
  videoId: z.string(),
  title: z.string(),
  channel: z.string(),
  thumbnail: z.string(),
  duration: z.number(),
  sortOrder: z.number(),
  addedAt: z.string(),
});

export const SmartPlaylistRuleSchema = z.object({
  field: z.enum(['channel', 'title', 'minDuration', 'maxDuration', 'addedAfter', 'addedBefore']),
  operator: z.enum(['contains', 'equals', 'startsWith', 'gt', 'lt', 'gte', 'lte']),
  value: z.union([z.string(), z.number()]),
});

export const SmartPlaylistRulesSchema = z.object({
  match: z.enum(['all', 'any']),
  conditions: z.array(SmartPlaylistRuleSchema).min(1),
});

export const PlaylistSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  coverImage: z.string(),
  isSystem: z.boolean(),
  trackCount: z.number(),
  rules: SmartPlaylistRulesSchema.nullable(),
  folderId: z.string().nullable(),
  isPublic: z.boolean(),
  shareId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  tracks: z.array(PlaylistTrackSchema).optional(),
});

export type Playlist = PlaylistType;
export type PlaylistTrack = PlaylistTrackType;

export async function getAllPlaylists(userId: string): Promise<PlaylistType[]> {
  const rows = await db
    .select({
      id: playlists.id,
      userId: playlists.userId,
      name: playlists.name,
      description: playlists.description,
      coverImage: playlists.coverImage,
      isSystem: playlists.isSystem,
      trackCount: sql<number>`COALESCE((SELECT COUNT(*) FROM playlist_tracks WHERE playlist_id = ${playlists.id}), 0)`,
      rules: playlists.rules,
      folderId: playlists.folderId,
      isPublic: playlists.isPublic,
      shareId: playlists.shareId,
      createdAt: playlists.createdAt,
      updatedAt: playlists.updatedAt,
    })
    .from(playlists)
    .where(eq(playlists.userId, userId))
    .orderBy(desc(playlists.isSystem), desc(playlists.updatedAt));

  return rows.map((row) => toPlaylistDTO(row as typeof playlists.$inferSelect));
}

export async function getPlaylistById(userId: string, id: string): Promise<PlaylistType | null> {
  const playlistRows = await db.select().from(playlists)
    .where(and(eq(playlists.id, id), eq(playlists.userId, userId)));
  const playlistRow = playlistRows[0];
  if (playlistRows.length === 0) {return null;}
  const trackRows = await db.select().from(playlistTracks)
    .where(eq(playlistTracks.playlistId, id))
    .orderBy(playlistTracks.sortOrder, playlistTracks.addedAt);

  const tracks = trackRows.map(toPlaylistTrackDTO);
  return toPlaylistDTO({ ...playlistRow, trackCount: tracks.length }, tracks);
}

export async function createPlaylist(userId: string, name: string, description = ''): Promise<PlaylistType> {
  const id = `pl_${crypto.randomUUID()}`;

  await db.insert(playlists).values({
    id,
    userId,
    name,
    description,
  });

  const playlist = await getPlaylistById(userId, id);
  if (!playlist) {throw new Error('Failed to create playlist');}
  return playlist;
}

export async function getOrCreateLikedPlaylist(userId: string): Promise<PlaylistType> {
  const rows = await db.select().from(playlists)
    .where(and(eq(playlists.userId, userId), eq(playlists.isSystem, true), eq(playlists.name, '좋아요한 곡')));

  if (rows.length > 0) {
    return getPlaylistById(userId, rows[0].id) as Promise<PlaylistType>;
  }

  const id = `liked_${userId}`;
  await db.insert(playlists).values({
    id,
    userId,
    name: '좋아요한 곡',
    description: '',
    isSystem: true,
  });

  const playlist = await getPlaylistById(userId, id);
  if (!playlist) {throw new Error('Failed to create liked playlist');}
  return playlist;
}

export async function updatePlaylist(
  userId: string,
  id: string,
  data: { name?: string; description?: string; coverImage?: string; rules?: SmartPlaylistRules | null; folderId?: string | null; isPublic?: boolean },
): Promise<PlaylistType | null> {
  const existing = await db.select().from(playlists)
    .where(and(eq(playlists.id, id), eq(playlists.userId, userId)));
  if (existing.length === 0) {return null;}

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const updates: Record<string, unknown> = { updatedAt: now };
  if (data.name) {updates.name = data.name;}
  if (data.description !== undefined) {updates.description = data.description;}
  if (data.coverImage !== undefined) {updates.coverImage = data.coverImage;}
  if (data.rules !== undefined) {updates.rules = data.rules;}
  if (data.folderId !== undefined) {updates.folderId = data.folderId;}
  if (data.isPublic !== undefined) {
    updates.isPublic = data.isPublic;
    if (data.isPublic && !existing[0].shareId) {
      updates.shareId = crypto.randomUUID();
    } else if (!data.isPublic) {
      updates.shareId = null;
    }
  }

  await db.update(playlists).set(updates).where(eq(playlists.id, id));

  return getPlaylistById(userId, id);
}

export async function deletePlaylist(userId: string, id: string): Promise<boolean> {
  const rows = await db.select().from(playlists)
    .where(and(eq(playlists.id, id), eq(playlists.userId, userId)));
  if (rows.length === 0 || rows[0].isSystem) {return false;}

  await db.delete(playlistTracks).where(eq(playlistTracks.playlistId, id));
  await db.delete(playlists).where(eq(playlists.id, id));
  return true;
}

export async function addTrackToPlaylist(
  userId: string,
  playlistId: string,
  track: {
    videoId: string;
    title: string;
    channel: string;
    thumbnail: string;
    duration: number;
  },
): Promise<PlaylistTrackType | null> {
  const playlistRows = await db.select().from(playlists)
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));
  if (playlistRows.length === 0) {return null;}

  const existing = await db.select({ id: playlistTracks.id })
    .from(playlistTracks)
    .where(and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.videoId, track.videoId)));
  if (existing.length > 0) {return null;}

  const maxOrderRows = await db.select({ maxOrder: sql<number | null>`MAX(sort_order)` })
    .from(playlistTracks)
    .where(eq(playlistTracks.playlistId, playlistId));
  const sortOrder = (maxOrderRows[0]?.maxOrder ?? -1) + 1;

  const result = await db.insert(playlistTracks).values({
    playlistId,
    videoId: track.videoId,
    title: track.title,
    channel: track.channel,
    thumbnail: track.thumbnail,
    duration: track.duration,
    sortOrder,
  }).returning({ id: playlistTracks.id });

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  await db.update(playlists).set({ updatedAt: now }).where(eq(playlists.id, playlistId));

  const trackRows = await db.select().from(playlistTracks).where(eq(playlistTracks.id, result[0].id));
  return trackRows.length > 0 ? toPlaylistTrackDTO(trackRows[0]) : null;
}

export async function removeTrackFromPlaylist(
  userId: string,
  playlistId: string,
  videoId: string,
): Promise<boolean> {
  const playlistRows = await db.select().from(playlists)
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));
  if (playlistRows.length === 0) {return false;}

  const result = await db.delete(playlistTracks)
    .where(and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.videoId, videoId)))
    .returning();

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  await db.update(playlists).set({ updatedAt: now }).where(eq(playlists.id, playlistId));

  return result.length > 0;
}

export async function reorderPlaylistTracks(
  userId: string,
  playlistId: string,
  trackIds: number[],
): Promise<boolean> {
  const playlistRows = await db.select().from(playlists)
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));
  if (playlistRows.length === 0) {return false;}

  await db.transaction(async (tx) => {
    for (let i = 0; i < trackIds.length; i++) {
      await tx.update(playlistTracks)
        .set({ sortOrder: i })
        .where(and(eq(playlistTracks.id, trackIds[i]), eq(playlistTracks.playlistId, playlistId)));
    }
  });

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  await db.update(playlists).set({ updatedAt: now }).where(eq(playlists.id, playlistId));

  return true;
}

export async function duplicatePlaylist(
  userId: string,
  sourceId: string,
): Promise<PlaylistType | null> {
  const source = await getPlaylistById(userId, sourceId);
  if (!source) {return null;}

  const newId = `pl_${crypto.randomUUID()}`;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  await db.transaction(async (tx) => {
    await tx.insert(playlists).values({
      id: newId,
      userId,
      name: `${source.name} (사본)`,
      description: source.description,
      coverImage: source.coverImage,
      isSystem: false,
      trackCount: source.trackCount,
      createdAt: now,
      updatedAt: now,
    });

    if (source.tracks && source.tracks.length > 0) {
      await tx.insert(playlistTracks).values(
        source.tracks.map((track) => ({
          playlistId: newId,
          videoId: track.videoId,
          title: track.title,
          channel: track.channel,
          thumbnail: track.thumbnail,
          duration: track.duration,
          sortOrder: track.sortOrder,
          addedAt: now,
        })),
      );
    }
  });

  return getPlaylistById(userId, newId);
}

function evaluateRule(track: { title: string; channel: string; duration: number; addedAt: string }, rule: { field: string; operator: string; value: string | number }): boolean {
  let fieldValue: string | number;
  switch (rule.field) {
    case 'channel': fieldValue = track.channel; break;
    case 'title': fieldValue = track.title; break;
    case 'minDuration': fieldValue = track.duration; break;
    case 'maxDuration': fieldValue = track.duration; break;
    case 'addedAfter': fieldValue = track.addedAt; break;
    case 'addedBefore': fieldValue = track.addedAt; break;
    default: return false;
  }

  switch (rule.operator) {
    case 'contains': return typeof fieldValue === 'string' && typeof rule.value === 'string' && fieldValue.toLowerCase().includes(rule.value.toLowerCase());
    case 'equals': return fieldValue === rule.value;
    case 'startsWith': return typeof fieldValue === 'string' && typeof rule.value === 'string' && fieldValue.toLowerCase().startsWith(rule.value.toLowerCase());
    case 'gt': return fieldValue > rule.value;
    case 'lt': return fieldValue < rule.value;
    case 'gte': return fieldValue >= rule.value;
    case 'lte': return fieldValue <= rule.value;
    default: return false;
  }
}

export function evaluateSmartPlaylistRules(
  tracks: { title: string; channel: string; duration: number; addedAt: string }[],
  rules: SmartPlaylistRules,
): { title: string; channel: string; duration: number; addedAt: string }[] {
  if (rules.match === 'all') {
    return tracks.filter((t) => rules.conditions.every((r) => evaluateRule(t, r)));
  }
  return tracks.filter((t) => rules.conditions.some((r) => evaluateRule(t, r)));
}

export async function getSmartPlaylistTracks(
  userId: string,
  rules: SmartPlaylistRules,
): Promise<PlaylistTrackType[]> {
  const userLikes = await db.select().from(likes)
    .where(eq(likes.userId, userId))
    .orderBy(desc(likes.likedAt));

  const mappedTracks = userLikes.map((l) => ({
    title: l.title,
    channel: l.channel,
    duration: l.duration ?? 0,
    addedAt: l.likedAt,
  }));

  const filtered = evaluateSmartPlaylistRules(mappedTracks, rules);

  const likedTracks = userLikes.filter((l) =>
    filtered.some((f) => f.title === l.title && f.channel === l.channel),
  );

  return likedTracks.map((l, i) => ({
    id: -(i + 1),
    videoId: l.videoId,
    title: l.title,
    channel: l.channel,
    thumbnail: l.thumbnail ?? '',
    duration: l.duration ?? 0,
    sortOrder: i,
    addedAt: l.likedAt ?? '',
  }));
}

export async function getSharedPlaylist(shareId: string): Promise<PlaylistType | null> {
  const rows = await db.select().from(playlists)
    .where(and(eq(playlists.shareId, shareId), eq(playlists.isPublic, true)));
  if (rows.length === 0) {return null;}

  const row = rows[0];
  const trackRows = await db.select().from(playlistTracks)
    .where(eq(playlistTracks.playlistId, row.id))
    .orderBy(playlistTracks.sortOrder, playlistTracks.addedAt);

  const tracks = trackRows.map(toPlaylistTrackDTO);
  return toPlaylistDTO({ ...row, trackCount: tracks.length }, tracks);
}

export async function getAllFolders(userId: string): Promise<import('@/types').PlaylistFolder[]> {
  const rows = await db.select().from(playlistFolders)
    .where(eq(playlistFolders.userId, userId))
    .orderBy(playlistFolders.sortOrder, playlistFolders.createdAt);
  return rows.map(toPlaylistFolderDTO);
}

export async function createFolder(userId: string, name: string): Promise<import('@/types').PlaylistFolder> {
  const maxOrderRows = await db.select({ maxOrder: sql<number | null>`MAX(sort_order)` })
    .from(playlistFolders)
    .where(eq(playlistFolders.userId, userId));
  const sortOrder = (maxOrderRows[0]?.maxOrder ?? -1) + 1;

  const id = `folder_${crypto.randomUUID()}`;
  await db.insert(playlistFolders).values({ id, userId, name, sortOrder });

  const rows = await db.select().from(playlistFolders).where(eq(playlistFolders.id, id));
  return toPlaylistFolderDTO(rows[0]);
}

export async function updateFolder(userId: string, id: string, data: { name?: string; sortOrder?: number }): Promise<import('@/types').PlaylistFolder | null> {
  const existing = await db.select().from(playlistFolders)
    .where(and(eq(playlistFolders.id, id), eq(playlistFolders.userId, userId)));
  if (existing.length === 0) {return null;}

  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) {updates.name = data.name;}
  if (data.sortOrder !== undefined) {updates.sortOrder = data.sortOrder;}

  await db.update(playlistFolders).set(updates).where(eq(playlistFolders.id, id));

  const rows = await db.select().from(playlistFolders).where(eq(playlistFolders.id, id));
  return rows.length > 0 ? toPlaylistFolderDTO(rows[0]) : null;
}

export async function deleteFolder(userId: string, id: string): Promise<boolean> {
  const existing = await db.select().from(playlistFolders)
    .where(and(eq(playlistFolders.id, id), eq(playlistFolders.userId, userId)));
  if (existing.length === 0) {return false;}

  await db.update(playlists).set({ folderId: null }).where(eq(playlists.folderId, id));
  await db.delete(playlistFolders).where(eq(playlistFolders.id, id));
  return true;
}

export async function movePlaylistToFolder(userId: string, playlistId: string, folderId: string | null): Promise<boolean> {
  const existing = await db.select().from(playlists)
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));
  if (existing.length === 0) {return false;}

  if (folderId) {
    const folder = await db.select().from(playlistFolders)
      .where(and(eq(playlistFolders.id, folderId), eq(playlistFolders.userId, userId)));
    if (folder.length === 0) {return false;}
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  await db.update(playlists).set({ folderId, updatedAt: now }).where(eq(playlists.id, playlistId));
  return true;
}
