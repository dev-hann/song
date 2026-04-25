export interface PlaylistTrack {
  id: number;
  video_id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
  sort_order: number;
  added_at: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  cover_image: string;
  is_system: number;
  track_count: number;
  created_at: string;
  updated_at: string;
  tracks?: PlaylistTrack[];
}

export interface CreatePlaylistRequest {
  name: string;
  description?: string;
}

export interface AddTrackRequest {
  video_id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
}
