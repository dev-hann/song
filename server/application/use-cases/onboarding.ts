import type { IYouTubeProvider, IMelonProvider } from '@/server/domain/ports/providers';
import type { ILikeRepository, IChannelRepository, IUserRepository } from '@/server/domain/ports/repositories';

export function createGetOnboardingStatus(
  userRepo: IUserRepository,
) {
  return async (userId: string): Promise<boolean> => {
    const user = await userRepo.findById(userId);
    if (!user) {return true;}
    return !user.onboardingCompleted;
  };
}

export function createGetOnboardingGenres(melon: IMelonProvider) {
  return () => melon.getAllGenreArtists();
}

export function createCompleteOnboarding(
  likeRepo: ILikeRepository,
  channelRepo: IChannelRepository,
  youtube: IYouTubeProvider,
  userRepo: IUserRepository,
) {
  return async (userId: string, artistNames: string[]): Promise<void> => {
    if (artistNames.length > 0) {
      await Promise.all(
        artistNames.map((name) => seedArtistTracks(userId, name, likeRepo, channelRepo, youtube)),
      );
    }
    await userRepo.markOnboardingCompleted(userId);
  };
}

const SEED_TRACKS_PER_ARTIST = 3;

async function seedArtistTracks(
  userId: string,
  artistName: string,
  likeRepo: ILikeRepository,
  channelRepo: IChannelRepository,
  youtube: IYouTubeProvider,
): Promise<void> {
  const tracks = await youtube.searchTracks(artistName, SEED_TRACKS_PER_ARTIST);

  for (const track of tracks) {
    await likeRepo.add(userId, {
      videoId: track.id,
      title: track.title,
      channel: track.channel.name,
      thumbnail: track.thumbnail,
      duration: track.duration,
    });
  }

  if (tracks.length > 0) {
    const firstTrack = tracks[0];
    await channelRepo.follow(userId, {
      channelId: `onboarding_${firstTrack.channel.name}`,
      channelName: firstTrack.channel.name,
      channelThumbnail: firstTrack.channel.thumbnail ?? '',
    });
  }
}
