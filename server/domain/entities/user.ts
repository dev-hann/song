import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  picture: z.string().default(''),
  registeredAt: z.string(),
  lastLogin: z.string(),
  isActive: z.boolean().default(true),
});
