export interface FollowedChannel {
  channel_id: string;
  channel_name: string;
  channel_thumbnail: string;
  subscriber_count: string;
  followed_at: string;
}

export interface ChannelInfo {
  id: string;
  name: string;
  thumbnail: string;
  subscriber_count: string;
  following: boolean;
  videos: ChannelVideo[];
}

export interface ChannelVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  channel: {
    name: string;
    thumbnail?: string;
  };
}
