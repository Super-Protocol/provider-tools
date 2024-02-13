import { name, description, version } from '../../package.json';
import * as Path from 'path';

export const APP_DESCRIPTION = description;
export const APP_NAME = name;
export const APP_VERSION = version;
export const CONFIG_DEFAULT_FILENAME = './config.json';
export const JWT_CHECK_REGEX = /(^[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*$)/;
export const PRIVATE_KEY_CHECK_REGEX = /\b(?:0x)?[0-9a-fA-F]{64}\b/g;
export const SPCTL_BACKEND_URL_DEFAULT = 'https://bff.testnet.superprotocol.com/graphql';
export const SPCTL_BLOCKCHAIN_URL_DEFAULT = 'https://mumbai.polygon.superprotocol.com/hesoyam';
export const SPCTL_SMART_CONTRACT_ADDRESS_DEFAULT = '0xA7Ff565f26b93926e4e6465Eb81d48EfF456848b';
export const SPCTL_CRYPTO_ALGO_DEFAULT = 'ECIES';
export const SPCTL_ENCODING_DEFAULT: BufferEncoding = 'base64';
export const SPCTL_PCCS_SERVICE_DEFAULT = 'https://pccs.superprotocol.io';
export const SPCTL_STORAGE_TYPE_DEFAULT = 'STORJ';
export const TOOL_DIRECTORY_PATH = './tool';
export const SPCTL_LOCATION_PATH = Path.join(TOOL_DIRECTORY_PATH, 'spctl');
export const SPCTL_DOWNLOAD_URL_PREFIX =
  'https://github.com/Super-Protocol/ctl/releases/download/v0.8.6/spctl-';
export const MIN_TEE_SUM_FOR_PROVIDER_ACCOUNT = '100000000000000000000';
export const MIN_MATIC_SUM_FOR_PROVIDER_ACCOUNT = '100000000000000000000';
