export interface Like {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
  likedAt: string;
}

export interface LikeCheckResponse {
  videoId: string;
  liked: boolean;
}
