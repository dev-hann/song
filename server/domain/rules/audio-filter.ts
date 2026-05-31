export function isAudioContent(duration: number): boolean {
  return duration >= 30 && duration <= 900;
}
