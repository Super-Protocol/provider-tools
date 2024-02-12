import { z } from 'zod';
import { PRIVATE_KEY_CHECK_REGEX } from '../constant';

export const LoggerConfigSchema = z.object({
  level: z.coerce.string().optional(),
});

export const BackendConfigSchema = z.object({
  accessToken: z.coerce.string(),
});

export const AccountConfigSchema = z.object({
  authority: z.string().regex(PRIVATE_KEY_CHECK_REGEX),
  action: z.string().regex(PRIVATE_KEY_CHECK_REGEX),
  tokenReceiver: z.string().regex(PRIVATE_KEY_CHECK_REGEX),
});
export type AccountConfig = z.infer<typeof AccountConfigSchema>;

export const MetadataConfigSchema = z.object({
  spctl: z
    .object({
      lastCheckForUpdates: z.number().optional(),
    })
    .optional(),
});
export const ConfigSchema = z.object({
  logger: LoggerConfigSchema.optional(),
  backend: BackendConfigSchema,
  account: AccountConfigSchema,
  metadata: MetadataConfigSchema.optional(),
});
export type Config = z.infer<typeof ConfigSchema>;
