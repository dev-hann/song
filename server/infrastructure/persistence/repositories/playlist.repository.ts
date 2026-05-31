import type { IPlaylistRepository, IFolderRepository } from '@/server/domain/ports/repositories';
import type { Playlist, PlaylistTrack, PlaylistFolder } from '@/types';
import { db } from '@/server/db';
import { playlists, playlistTracks, likes, playlistFolders } from '@/server/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { toPlaylistDTO, toPlaylistTrackDTO, toPlaylistFolderDTO } from '../mappers/dto';
import crypto from 'crypto';
import { evaluateSmartPlaylistRules } from '@/server/domain/rules/smart-playlist';

export const playlistRepository: IPlaylistRepository = {
  async getAll(userId): Promise<Playlist[]> {
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

    return rows.map((row) => toPlaylistDTO(row));
  },

  async getById(userId, id): Promise<Playlist | null> {
    const playlistRows = await db.select().from(playlists)
      .where(and(eq(playlists.id, id), eq(playlists.userId, userId)));
    if (playlistRows.length === 0) {return null;}
    const trackRows = await db.select().from(playlistTracks)
      .where(eq(playlistTracks.playlistId, id))
      .orderBy(playlistTracks.sortOrder, playlistTracks.addedAt);

    const tracks = trackRows.map(toPlaylistTrackDTO);
    return toPlaylistDTO({ ...playlistRows[0], trackCount: tracks.length }, tracks);
  },

  async getOrCreateLiked(userId): Promise<Playlist> {
    const rows = await db.select().from(playlists)
      .where(and(eq(playlists.userId, userId), eq(playlists.isSystem, true), eq(playlists.name, '좋아요한 곡')));

    if (rows.length > 0) {
      return playlistRepository.getById(userId, rows[0].id) as Promise<Playlist>;
    }

    const id = `liked_${userId}`;
    await db.insert(playlists).values({
      id,
      userId,
      name: '좋아요한 곡',
      description: '',
      isSystem: true,
    });

    const playlist = await playlistRepository.getById(userId, id);
    if (!playlist) {throw new Error('Failed to create liked playlist');}
    return playlist;
  },

  async create(userId, name, description = ''): Promise<Playlist> {
    const id = `pl_${crypto.randomUUID()}`;
    await db.insert(playlists).values({ id, userId, name, description });
    const playlist = await playlistRepository.getById(userId, id);
    if (!playlist) {throw new Error('Failed to create playlist');}
    return playlist;
  },

  async update(userId, id, data): Promise<Playlist | null> {
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
    return playlistRepository.getById(userId, id);
  },

  async delete(userId, id): Promise<boolean> {
    const rows = await db.select().from(playlists)
      .where(and(eq(playlists.id, id), eq(playlists.userId, userId)));
    if (rows.length === 0 || rows[0].isSystem) {return false;}

    await db.delete(playlistTracks).where(eq(playlistTracks.playlistId, id));
    await db.delete(playlists).where(eq(playlists.id, id));
    return true;
  },

  async addTrack(userId, playlistId, track): Promise<PlaylistTrack | null> {
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
  },

  async removeTrack(userId, playlistId, videoId): Promise<boolean> {
    const playlistRows = await db.select().from(playlists)
      .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));
    if (playlistRows.length === 0) {return false;}

    const result = await db.delete(playlistTracks)
      .where(and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.videoId, videoId)))
      .returning();

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    await db.update(playlists).set({ updatedAt: now }).where(eq(playlists.id, playlistId));

    return result.length > 0;
  },

  async reorderTracks(userId, playlistId, trackIds): Promise<boolean> {
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
  },

  async duplicate(userId, sourceId): Promise<Playlist | null> {
    const source = await playlistRepository.getById(userId, sourceId);
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
          source.tracks.map((t) => ({
            playlistId: newId,
            videoId: t.videoId,
            title: t.title,
            channel: t.channel,
            thumbnail: t.thumbnail,
            duration: t.duration,
            sortOrder: t.sortOrder,
            addedAt: now,
          })),
        );
      }
    });

    return playlistRepository.getById(userId, newId);
  },

  async getShared(shareId): Promise<Playlist | null> {
    const rows = await db.select().from(playlists)
      .where(and(eq(playlists.shareId, shareId), eq(playlists.isPublic, true)));
    if (rows.length === 0) {return null;}

    const row = rows[0];
    const trackRows = await db.select().from(playlistTracks)
      .where(eq(playlistTracks.playlistId, row.id))
      .orderBy(playlistTracks.sortOrder, playlistTracks.addedAt);

    const tracks = trackRows.map(toPlaylistTrackDTO);
    return toPlaylistDTO({ ...row, trackCount: tracks.length }, tracks);
  },

  async getSmartPlaylistTracks(userId, rules): Promise<PlaylistTrack[]> {
    const userLikes = await db.select().from(likes)
      .where(eq(likes.userId, userId))
      .orderBy(desc(likes.likedAt));

    const mappedTracks = userLikes.map((l) => ({
      title: l.title,
      channel: l.channel,
      duration: l.duration,
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
      duration: l.duration,
      sortOrder: i,
      addedAt: l.likedAt,
    }));
  },
};

export const folderRepository: IFolderRepository = {
  async getAll(userId): Promise<PlaylistFolder[]> {
    const rows = await db.select().from(playlistFolders)
      .where(eq(playlistFolders.userId, userId))
      .orderBy(playlistFolders.sortOrder, playlistFolders.createdAt);
    return rows.map(toPlaylistFolderDTO);
  },

  async create(userId, name): Promise<PlaylistFolder> {
    const maxOrderRows = await db.select({ maxOrder: sql<number | null>`MAX(sort_order)` })
      .from(playlistFolders)
      .where(eq(playlistFolders.userId, userId));
    const sortOrder = (maxOrderRows[0]?.maxOrder ?? -1) + 1;

    const id = `folder_${crypto.randomUUID()}`;
    await db.insert(playlistFolders).values({ id, userId, name, sortOrder });

    const rows = await db.select().from(playlistFolders).where(eq(playlistFolders.id, id));
    return toPlaylistFolderDTO(rows[0]);
  },

  async update(userId, id, data): Promise<PlaylistFolder | null> {
    const existing = await db.select().from(playlistFolders)
      .where(and(eq(playlistFolders.id, id), eq(playlistFolders.userId, userId)));
    if (existing.length === 0) {return null;}

    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) {updates.name = data.name;}
    if (data.sortOrder !== undefined) {updates.sortOrder = data.sortOrder;}

    await db.update(playlistFolders).set(updates).where(eq(playlistFolders.id, id));

    const rows = await db.select().from(playlistFolders).where(eq(playlistFolders.id, id));
    return rows.length > 0 ? toPlaylistFolderDTO(rows[0]) : null;
  },

  async delete(userId, id): Promise<boolean> {
    const existing = await db.select().from(playlistFolders)
      .where(and(eq(playlistFolders.id, id), eq(playlistFolders.userId, userId)));
    if (existing.length === 0) {return false;}

    await db.update(playlists).set({ folderId: null }).where(eq(playlists.folderId, id));
    await db.delete(playlistFolders).where(eq(playlistFolders.id, id));
    return true;
  },

  async movePlaylist(userId, playlistId, folderId): Promise<boolean> {
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
  },
};
