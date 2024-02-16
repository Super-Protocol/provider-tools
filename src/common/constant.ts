import { name, description, version } from '../../package.json';
import * as Path from 'path';

export const APP_DESCRIPTION = description;
export const APP_NAME = name;
export const APP_VERSION = version;
export const CONFIG_DEFAULT_FILENAME = Path.join(__dirname, '../..', 'config.json');
export const JWT_CHECK_REGEX = /(^[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*$)/;
export const PRIVATE_KEY_CHECK_REGEX = /\b(?:0x)?[0-9a-fA-F]{64}\b/g;
export const SPCTL_BACKEND_URL_DEFAULT = 'https://bff.testnet.superprotocol.com/graphql';
export const SPCTL_BLOCKCHAIN_URL_DEFAULT = 'https://mumbai.polygon.superprotocol.com/hesoyam';
export const SPCTL_SMART_CONTRACT_ADDRESS_DEFAULT = '0xA7Ff565f26b93926e4e6465Eb81d48EfF456848b';
export const SPCTL_CRYPTO_ALGO_DEFAULT = 'ECIES';
export const SPCTL_ENCODING_DEFAULT: BufferEncoding = 'base64';
export const SPCTL_PCCS_SERVICE_DEFAULT = 'https://pccs.superprotocol.io';
export const SPCTL_STORAGE_TYPE_DEFAULT = 'STORJ';
export const TOOL_DIRECTORY_PATH = Path.join(__dirname, '../..', 'tool');
export const SPCTL_LOCATION_PATH = Path.join(TOOL_DIRECTORY_PATH, 'spctl');
export const SPCTL_LATEST_RELEASE_URL =
  'https://api.github.com/repos/Super-Protocol/ctl/releases/latest';
export const SPCTL_MIN_COMPATIBLE_VERSION = `0.8.8-beta.0`;
export const MIN_TEE_SUM_FOR_PROVIDER_ACCOUNT = '9000000000000000000';
export const MIN_MATIC_SUM_FOR_PROVIDER_ACCOUNT = '200000000000000000';
export const DEFAULT_PROVIDER_NAME = `auto generated provider by ${APP_NAME}`;
