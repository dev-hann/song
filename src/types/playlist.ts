export interface PlaylistTrack {
  id: number;
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
  sortOrder: number;
  addedAt: string;
}

export interface SmartPlaylistRule {
  field: 'channel' | 'title' | 'minDuration' | 'maxDuration' | 'addedAfter' | 'addedBefore';
  operator: 'contains' | 'equals' | 'startsWith' | 'gt' | 'lt' | 'gte' | 'lte';
  value: string | number;
}

export interface SmartPlaylistRules {
  match: 'all' | 'any';
  conditions: SmartPlaylistRule[];
}

export interface PlaylistFolder {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  isSystem: boolean;
  trackCount: number;
  rules: SmartPlaylistRules | null;
  folderId: string | null;
  isPublic: boolean;
  shareId: string | null;
  createdAt: string;
  updatedAt: string;
  tracks?: PlaylistTrack[];
}

export interface CreatePlaylistRequest {
  name: string;
  description?: string;
}

export interface AddTrackRequest {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
}

export interface CreateFolderRequest {
  name: string;
}

export interface UpdateFolderRequest {
  name?: string;
  sortOrder?: number;
}

export interface MoveToFolderRequest {
  folderId: string | null;
}
