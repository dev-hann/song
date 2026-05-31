export interface FollowedChannel {
  channelId: string;
  channelName: string;
  channelThumbnail: string;
  subscriberCount: string;
  followedAt: string;
}

export interface ChannelInfo {
  id: string;
  name: string;
  thumbnail: string;
  subscriberCount: string;
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
