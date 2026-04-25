import { z } from 'zod';
import { ExtendedAudioSchema } from '../models/audio.js';
import type { ErrorResponse as ErrorResponseType, StreamUrlResponse as StreamUrlResponseType } from '@song/types';

export const ErrorResponseSchema = z.object({
  error: z.string().min(1),
  code: z.string().optional(),
});

export type ErrorResponse = ErrorResponseType;

export const SearchParamsSchema = z.object({
  q: z.string().min(1, '검색어를 입력해주세요'),
  filter: z.enum(['video', 'channel', 'playlist']).default('video'),
});

export const AudioInfoResponseSchema = ExtendedAudioSchema;

export const DownloadParamsSchema = z.object({
  id: z.string().min(1, '비디오 ID가 필요합니다'),
});

export const DownloadResponseSchema = z.object({
  url: z.string().url(),
});

export type StreamUrlResponse = StreamUrlResponseType;
