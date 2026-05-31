export interface OnboardingGenre {
  id: string;
  name: string;
  artists: OnboardingArtist[];
}

export interface OnboardingArtist {
  name: string;
  albumArt: string;
}

export interface OnboardingGenresResponse {
  genres: OnboardingGenre[];
}

export interface OnboardingStatusResponse {
  needsOnboarding: boolean;
}

export interface OnboardingRequest {
  artistNames: string[];
}
