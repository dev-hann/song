'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingGenres } from '@/queries/onboarding';
import { completeOnboarding } from '@/services/api/onboarding';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { OnboardingArtist } from '@/types/onboarding';

const MIN_GENRES = 2;
const MIN_ARTISTS = 3;

export default function OnboardingPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useOnboardingGenres();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(new Set());
  const [seeding, setSeeding] = useState(false);

  const genres = data?.genres ?? [];
  const artistByGenre = genres
    .filter((g) => selectedGenres.has(g.id))
    .map((g) => ({ ...g }));

  async function handleComplete() {
    setSeeding(true);
    try {
      await completeOnboarding(Array.from(selectedArtists));
    } catch {
    }
    router.replace('/home');
  }

  function handleSkip() {
    router.replace('/home');
  }

  if (seeding) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6">
        <div className="mb-6 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-lg font-medium text-foreground">취향에 맞는 음악을 찾고 있어요...</p>
        <p className="mt-2 text-sm text-muted">잠시만 기다려주세요</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-background px-6 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-center gap-2 py-6">
          <Skeleton className="h-2.5 w-2.5 rounded-full" />
          <Skeleton className="h-2.5 w-2.5 rounded-full" />
        </div>
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-20 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || genres.length === 0) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6">
        <p className="mb-6 text-lg font-medium text-foreground">일시적인 오류가 발생했습니다</p>
        <Button onClick={handleSkip}>시작하기</Button>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <div className="flex-shrink-0 px-6 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-center gap-2 py-6">
          <div className={`h-2.5 w-2.5 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-2.5 w-2.5 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        </div>
      </div>

      {step === 1 && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-shrink-0 px-6 pb-4">
            <h1 className="text-2xl font-bold text-foreground">어떤 음악을 좋아하세요?</h1>
            <p className="mt-1 text-sm text-muted">관심 있는 장르를 {MIN_GENRES}개 이상 선택해주세요</p>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-32">
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => {
                    setSelectedGenres((prev) => {
                      const next = new Set(prev);
                      if (next.has(genre.id)) {
                        next.delete(genre.id);
                      } else {
                        next.add(genre.id);
                      }
                      return next;
                    });
                  }}
                  className={`min-h-11 rounded-full px-5 text-sm font-medium transition-colors ${
                    selectedGenres.has(genre.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-surface text-foreground border border-border'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-shrink-0 px-6 pb-4">
            <button
              onClick={() => { setStep(1); }}
              className="mb-2 text-sm text-muted hover:text-foreground"
            >
              ← 장르 다시 선택
            </button>
            <h1 className="text-2xl font-bold text-foreground">어떤 아티스트를 좋아하세요?</h1>
            <p className="mt-1 text-sm text-muted">아티스트를 {MIN_ARTISTS}명 이상 선택해주세요</p>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-32">
            {artistByGenre.map((genre) => (
              <div key={genre.id} className="mb-5">
                <h2 className="mb-2 text-sm font-semibold text-muted">{genre.name}</h2>
                <div className="flex flex-col gap-1">
                  {genre.artists.map((artist) => (
                    <ArtistRow
                      key={artist.name}
                      artist={artist}
                      selected={selectedArtists.has(artist.name)}
                      onToggle={() => {
                        setSelectedArtists((prev) => {
                          const next = new Set(prev);
                          if (next.has(artist.name)) {
                            next.delete(artist.name);
                          } else {
                            next.add(artist.name);
                          }
                          return next;
                        });
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
        <div className="flex flex-col gap-2 px-6 py-4">
          {step === 1 && (
            <Button
              className="h-12 w-full text-base"
              disabled={selectedGenres.size < MIN_GENRES}
              onClick={() => { setStep(2); }}
            >
              다음 ({selectedGenres.size}개 선택)
            </Button>
          )}
          {step === 2 && (
            <Button
              className="h-12 w-full text-base"
              disabled={selectedArtists.size < MIN_ARTISTS}
              onClick={() => { handleComplete().catch(() => { /* handled */ }); }}
            >
              시작하기 ({selectedArtists.size}명 선택)
            </Button>
          )}
          <button
            onClick={handleSkip}
            className="py-2 text-center text-sm text-muted hover:text-foreground"
          >
            건너뛰기
          </button>
        </div>
      </div>
    </div>
  );
}

function ArtistRow({ artist, selected, onToggle }: {
  artist: OnboardingArtist;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex min-h-14 items-center gap-3 rounded-lg px-1 transition-colors hover:bg-surface"
    >
      <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
        selected ? 'border-primary bg-primary' : 'border-border'
      }`}>
        {selected && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      {artist.albumArt ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={artist.albumArt}
          alt={artist.name}
          className="h-12 w-12 flex-shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-surface text-lg font-medium text-muted">
          {artist.name.charAt(0)}
        </div>
      )}
      <span className="text-sm font-medium text-foreground">{artist.name}</span>
    </button>
  );
}
