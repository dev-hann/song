import type { Audio, SearchResultAudio, Like, HistoryItem, PlaylistTrack, ChannelVideo } from '@/types';

export function searchResultToAudio(r: SearchResultAudio): Audio {
  return {
    id: r.id,
    type: 'video',
    title: r.title,
    description: '',
    duration: r.duration,
    viewCount: 0,
    thumbnail: r.thumbnail,
    channel: { name: r.channel.name, thumbnail: r.channel.thumbnail },
  };
}

export function likeToAudio(l: Like): Audio {
  return {
    id: l.videoId,
    type: 'video',
    title: l.title,
    description: '',
    duration: l.duration,
    viewCount: 0,
    thumbnail: l.thumbnail,
    channel: { name: l.channel },
  };
}

export function historyToAudio(h: HistoryItem): Audio {
  return {
    id: h.videoId,
    type: 'video',
    title: h.title,
    description: '',
    duration: h.duration,
    viewCount: 0,
    thumbnail: h.thumbnail,
    channel: { name: h.channel },
  };
}

export function playlistTrackToAudio(t: PlaylistTrack): Audio {
  return {
    id: t.videoId,
    type: 'video',
    title: t.title,
    description: '',
    duration: t.duration,
    viewCount: 0,
    thumbnail: t.thumbnail,
    channel: { name: t.channel },
  };
}

export function channelVideoToAudio(v: ChannelVideo): Audio {
  return {
    id: v.id,
    type: 'video',
    title: v.title,
    description: '',
    duration: v.duration,
    viewCount: 0,
    thumbnail: v.thumbnail,
    channel: { name: v.channel.name, thumbnail: v.channel.thumbnail },
  };
}

export function toAudio(
  track: SearchResultAudio | Like | HistoryItem | PlaylistTrack | ChannelVideo,
): Audio {
  if ('videoId' in track) {
    if ('playedAt' in track) {return historyToAudio(track);}
    if ('likedAt' in track) {return likeToAudio(track);}
    if ('sortOrder' in track) {return playlistTrackToAudio(track);}
    return likeToAudio(track);
  }
  return searchResultToAudio(track);
}

export type FlatTrackSource = { id: string; title: string; channel: string; thumbnail: string; duration: number };

export function flatTrackToAudio(t: FlatTrackSource): Audio {
  return {
    id: t.id,
    type: 'video',
    title: t.title,
    description: '',
    duration: t.duration,
    viewCount: 0,
    thumbnail: t.thumbnail,
    channel: { name: t.channel },
  };
}
