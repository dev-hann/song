import { likeRepository } from '@/server/infrastructure/persistence/repositories/like.repository';
import { historyRepository } from '@/server/infrastructure/persistence/repositories/history.repository';
import { playlistRepository, folderRepository } from '@/server/infrastructure/persistence/repositories/playlist.repository';
import { channelRepository } from '@/server/infrastructure/persistence/repositories/channel.repository';
import { userRepository } from '@/server/infrastructure/persistence/repositories/user.repository';
import { youTubeProvider } from '@/server/infrastructure/external/youtube/provider';
import { melonProvider } from '@/server/infrastructure/external/melon/provider';

import { createGetLikes, createAddLike, createRemoveLike, createCheckLike } from './use-cases/likes';
import { createGetHistory, createAddHistory, createClearHistory } from './use-cases/history';
import {
  createGetPlaylists, createGetPlaylist, createGetOrCreateLikedPlaylist,
  createCreatePlaylist, createUpdatePlaylist, createDeletePlaylist,
  createAddTrack, createRemoveTrack, createReorderTracks,
  createDuplicatePlaylist, createGetSharedPlaylist, createGetSmartPlaylistTracks,
  createGetFolders, createCreateFolder, createUpdateFolder, createDeleteFolder,
  createMovePlaylistToFolder,
} from './use-cases/playlists';
import { createGetFollowedChannels, createGetChannel, createFollowChannel, createUnfollowChannel } from './use-cases/channels';
import { createSearchYouTube, createSearchMoreYouTube, createGetAudioInfo, createGetStreamUrl } from './use-cases/audio';
import { createGetRelatedVideos, createGetPersonalizedRecommendations } from './use-cases/recommendations';
import { createGetHomeData } from './use-cases/home';
import { createGetLyrics } from './use-cases/lyrics';

export const useCases = {
  likes: {
    getAll: createGetLikes(likeRepository),
    add: createAddLike(likeRepository),
    remove: createRemoveLike(likeRepository),
    check: createCheckLike(likeRepository),
  },
  history: {
    get: createGetHistory(historyRepository),
    add: createAddHistory(historyRepository),
    clear: createClearHistory(historyRepository),
  },
  playlists: {
    getAll: createGetPlaylists(playlistRepository),
    getById: createGetPlaylist(playlistRepository),
    getOrCreateLiked: createGetOrCreateLikedPlaylist(playlistRepository),
    create: createCreatePlaylist(playlistRepository),
    update: createUpdatePlaylist(playlistRepository),
    delete: createDeletePlaylist(playlistRepository),
    addTrack: createAddTrack(playlistRepository),
    removeTrack: createRemoveTrack(playlistRepository),
    reorder: createReorderTracks(playlistRepository),
    duplicate: createDuplicatePlaylist(playlistRepository),
    getShared: createGetSharedPlaylist(playlistRepository),
    getSmartTracks: createGetSmartPlaylistTracks(playlistRepository),
  },
  folders: {
    getAll: createGetFolders(folderRepository),
    create: createCreateFolder(folderRepository),
    update: createUpdateFolder(folderRepository),
    delete: createDeleteFolder(folderRepository),
    movePlaylist: createMovePlaylistToFolder(folderRepository),
  },
  channels: {
    getFollowed: createGetFollowedChannels(channelRepository),
    get: createGetChannel(channelRepository, youTubeProvider),
    follow: createFollowChannel(channelRepository),
    unfollow: createUnfollowChannel(channelRepository),
  },
  audio: {
    search: createSearchYouTube(youTubeProvider),
    searchMore: createSearchMoreYouTube(youTubeProvider),
    getInfo: createGetAudioInfo(youTubeProvider),
    getStreamUrl: createGetStreamUrl(youTubeProvider),
  },
  recommendations: {
    getRelated: createGetRelatedVideos(youTubeProvider),
    getPersonalized: createGetPersonalizedRecommendations(likeRepository, historyRepository, channelRepository, youTubeProvider, melonProvider),
  },
  home: {
    get: createGetHomeData(melonProvider, historyRepository, likeRepository, channelRepository, youTubeProvider),
  },
  lyrics: {
    get: createGetLyrics(youTubeProvider),
  },
};

export { userRepository, likeRepository, historyRepository, playlistRepository, folderRepository, channelRepository, youTubeProvider, melonProvider };
