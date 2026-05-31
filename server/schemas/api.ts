import { z } from 'zod';
import { ExtendedAudioSchema } from '../models/audio';

export const SearchParamsSchema = z.object({
  q: z.string().min(1, '검색어를 입력해주세요'),
  filter: z.enum(['video', 'channel', 'playlist']).default('video'),
});

export const AudioInfoResponseSchema = ExtendedAudioSchema;
