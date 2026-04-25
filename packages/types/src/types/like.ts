export interface Like {
  video_id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
  liked_at: string;
}

export interface LikeCheckResponse {
  video_id: string;
  liked: boolean;
}
