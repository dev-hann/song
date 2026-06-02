export interface LyricsLine {
  startTimeMs: number;
  endTimeMs: number;
  text: string;
}

export interface Lyrics {
  videoId: string;
  language: string;
  lines: LyricsLine[];
}
