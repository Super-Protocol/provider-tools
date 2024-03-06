import { z } from 'zod';
import {
  PRIVATE_KEY_CHECK_REGEX,
  SPCTL_BACKEND_URL_DEFAULT,
  SPCTL_BLOCKCHAIN_URL_DEFAULT,
  SPCTL_CRYPTO_ALGO_DEFAULT,
  SPCTL_ENCODING_DEFAULT,
  SPCTL_PCCS_SERVICE_DEFAULT,
  SPCTL_STORAGE_TYPE_DEFAULT,
} from '../constant';

export enum KnownTool {
  SPCTL = 'spctl',
  PROVIDER = 'provider_tools',
}

export const LoggerConfigSchema = z.object({
  level: z.coerce.string().optional(),
});

export const MetadataToolConfigSchema = z.object({
  lastCheckForUpdates: z.number(),
});

export const MetadataConfigSchema = z
  .object({
    [KnownTool.SPCTL]: MetadataToolConfigSchema.optional(),
    [KnownTool.PROVIDER]: MetadataToolConfigSchema.optional(),
  })
  .optional();

export type MetadataConfig = z.infer<typeof MetadataConfigSchema>;

export const SpctlConfigSchema = z.object({
  backend: z.object({
    url: z.coerce.string().url().default(SPCTL_BACKEND_URL_DEFAULT),
    accessToken: z.string(),
  }),
  blockchain: z.object({
    rpcUrl: z.string().default(SPCTL_BLOCKCHAIN_URL_DEFAULT),
    smartContractAddress: z.string(),
    accountPrivateKey: z.string(),
    authorityAccountPrivateKey: z.string().optional(),
  }),
  storage: z
    .object({
      type: z.string().default(SPCTL_STORAGE_TYPE_DEFAULT),
      bucket: z.string().default(''),
      prefix: z.string().default(''),
      writeAccessToken: z.string().default(''),
      readAccessToken: z.string().default(''),
    })
    .default({}),
  workflow: z.object({
    resultEncryption: z.object({
      algo: z.string().default(SPCTL_CRYPTO_ALGO_DEFAULT),
      key: z.string(),
      encoding: z.string().default(SPCTL_ENCODING_DEFAULT),
    }),
  }),
  tii: z.object({ pccsServiceApiUrl: z.string().default(SPCTL_PCCS_SERVICE_DEFAULT) }).default({}),
  metadata: z.object({ lastCheckForUpdates: z.number().optional() }).optional(),
});
export type SpctlConfig = z.infer<typeof SpctlConfigSchema>;

export const AccountConfigSchema = z.object({
  authority: z.string().regex(PRIVATE_KEY_CHECK_REGEX),
  action: z.string().regex(PRIVATE_KEY_CHECK_REGEX),
  tokenReceiver: z.string().regex(PRIVATE_KEY_CHECK_REGEX),
});
export type AccountConfig = z.infer<typeof AccountConfigSchema>;

export const ProviderInfoSchema = z.object({
  name: z.coerce.string(),
  description: z.coerce.string().optional(),
});
export type ProviderInfoConfig = z.infer<typeof ProviderInfoSchema>;

export const SshConfigSchema = z.object({
  pathToPrivateKey: z.coerce.string().min(1),
  user: z.coerce.string().min(1).default('root'),
  port: z.coerce.number().int().gt(0).default(22),
  host: z.coerce.string().min(1),
  requiredPassphrase: z.coerce.boolean().default(false),
});
export type SshConfig = z.infer<typeof SshConfigSchema>;

export const ProviderOfferSchema = z.object({
  id: z.coerce.string(),
  argsPrivateKey: z.coerce.string(),
  modifiedAt: z.number().optional(),
});
export type ProviderOffer = z.infer<typeof ProviderOfferSchema>;

const ProviderValueOfferSchema = z.object({
  id: z.string(),
  argsPrivateKey: z.coerce.string(),
  encryption: z.object({
    algo: z.string(),
    encoding: z.string(),
    cipher: z.string(),
    iv: z.string(),
    mac: z.string(),
    key: z.string(),
  }),
  resource: z.object({
    type: z.string(),
    storageType: z.string(),
    filepath: z.string(),
    credentials: z.object({
      token: z.string(),
      bucket: z.string(),
      prefix: z.string(),
    }),
  }),
});
export type ProviderValueOffer = z.infer<typeof ProviderValueOfferSchema>;

export const ProviderOffersSchema = z.array(ProviderOfferSchema).default([]);
export const ProviderValueOffersSchema = z.array(ProviderValueOfferSchema).default([]);

export const ConfigSchema = z.object({
  logger: LoggerConfigSchema.optional(),
  spctl: SpctlConfigSchema,
  account: AccountConfigSchema,
  metadata: MetadataConfigSchema.optional(),
  providerInfo: ProviderInfoSchema.optional(),
  providerOffers: ProviderOffersSchema,
  providerDataOffers: ProviderValueOffersSchema,
  providerSolutionOffers: ProviderValueOffersSchema,
  sshConfig: SshConfigSchema.optional(),
});
export type Config = z.infer<typeof ConfigSchema>;
