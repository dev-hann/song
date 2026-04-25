export interface Audio {
  id: string;
  type: 'video';
  title: string;
  description: string;
  duration: number;
  viewCount: number;
  published?: string;
  thumbnail: string;
  channel: {
    id?: string;
    name: string;
    thumbnail?: string;
  };
}

export interface ExtendedAudio extends Audio {
  uploadDate?: Date;
}

export interface StreamUrlResponse {
  url: string;
}
