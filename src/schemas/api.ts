import { z } from 'zod';
import { ExtendedAudioSchema } from '@/models/audio';

export const ErrorResponseSchema = z.object({
  error: z.string().min(1, 'Error message is required'),
  code: z.string().optional()
});

export const SearchParamsSchema = z.object({
  q: z.string().min(1, 'Query parameter "q" is required'),
  filter: z.enum(['video', 'channel', 'playlist']).default('video')
});

export const AudioInfoResponseSchema = ExtendedAudioSchema;

export const DownloadParamsSchema = z.object({
  id: z.string().min(1, 'Audio ID parameter "id" is required')
});

export const DownloadResponseSchema = z.object({
  url: z.string().url()
});
