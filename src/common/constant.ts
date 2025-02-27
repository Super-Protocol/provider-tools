import path from 'path';
import os from 'os';
import dotenv from 'dotenv';
import { name, description, version } from '../../package.json';

const getEnvFilePath = (): string => {
  const level = process.env.NODE_ENV === 'development' ? 2 : 3;
  const subpath = '..,'.repeat(level).split(',').filter(Boolean);

  return path.resolve(__dirname, ...subpath, '.env');
};

dotenv.config({ path: getEnvFilePath() });

const execDir = (): string =>
  process.env.NODE_ENV === 'development' ? process.cwd() : path.dirname(process.execPath);
export const NODE_ENV_DEV = 'development';
export const APP_DESCRIPTION = description;
export const APP_NAME = name;
export const APP_VERSION = version;
export const CONFIG_DEFAULT_FILENAME = path.resolve(execDir(), 'provider-tools-config.json');
export const SPCTL_CONFIG_FILENAME = 'spctl-config.json';
export const JWT_CHECK_REGEX = /(^[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*$)/;
export const PRIVATE_KEY_CHECK_REGEX = /^(?:0x)?[0-9a-fA-F]{64}$/;
export const SPCTL_BACKEND_URL_DEFAULT =
  process.env.SPCTL_BACKEND_URL_DEFAULT ?? 'https://bff.dev.superprotocol.com/graphql';
export const SPCTL_BLOCKCHAIN_URL_DEFAULT =
  process.env.SPCTL_BLOCKCHAIN_URL_DEFAULT ?? 'https://amoy.polygon.superprotocol.com/hesoyam';
export const SPCTL_SMART_CONTRACT_ADDRESS_DEFAULT =
  process.env.SPCTL_SMART_CONTRACT_ADDRESS_DEFAULT ?? '0x6D5C1F3Ccda361c0EFCf028Bc99Ca2783Be766ce';
export const SPCTL_CRYPTO_ALGO_DEFAULT = 'ECIES';
export const SPCTL_ENCODING_DEFAULT: BufferEncoding = 'base64';
export const SPCTL_PCCS_SERVICE_DEFAULT = 'https://pccs.superprotocol.io';
export const SPCTL_STORAGE_TYPE_DEFAULT = 'STORJ';
export const TOOL_HOME_PATH = path.resolve(os.homedir(), '.provider-tools');
export const SPCTL_SUFFIX = os.platform() === 'win32' ? '.exe' : '';
export const VERSION_MATCH = '{{version}}';
export const OS_MATCH = '{{os}}';
export const ARCH_MATCH = '{{arch}}';
export const REPO_MATCH = '{{repo}}';
export const TOOL_NAME_MATCH = '{{tool}}';
export const SPCTL_TOOL_REPO_NAME = 'ctl';
export const PROVIDER_TOOLS_REPO_NAME = 'provider-tools';
export const REPO_DOWNLOAD_URL_TEMPLATE = `https://github.com/Super-Protocol/${REPO_MATCH}/releases/download/v${VERSION_MATCH}/${TOOL_NAME_MATCH}-${OS_MATCH}-${ARCH_MATCH}`;
export const LATEST_RELEASE_URL_TEMPLATE = `https://api.github.com/repos/Super-Protocol/${REPO_MATCH}/releases/latest`;
export const MIN_TEE_SUM_FOR_PROVIDER_ACCOUNT = '200000000000000000000';
export const MIN_MATIC_SUM_FOR_PROVIDER_ACCOUNT = '500000000000000000';
export const DEFAULT_PROVIDER_NAME = `auto generated provider by ${APP_NAME}`;
export const DEFAULT_DEPLOY_CONFIG_FILE_NAME = 'deploy-config.yaml';
export const DEPLOY_CONFIG_PROVIDER_OFFER_DEVICE_ID = '{{ device-id }}';
export const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;
export const DEFAULT_DEPLOY_DESTINATION_FOLDER_PATH = '/sp/manifests';
export const DEFAULT_DESTINATION_DEPLOY_CONFIG_FILE_NAME =
  'configmap.execution-controller-tee-prov.yaml';
export const MB_TO_BYTES_MULTIPLIER = 1000000;
export const RUNNER_SH_URL =
  process.env.RUNNER_SH_URL ||
  'https://raw.githubusercontent.com/Super-Protocol/provider-tools/main/runner-assets/runner.sh';
export const DOCKER_COMPOSE_URL =
  process.env.DOCKER_COMPOSE_URL ||
  'https://raw.githubusercontent.com/Super-Protocol/provider-tools/main/runner-assets/docker-compose.yaml';
export const DEFAULT_SLEEP_INTERVAL = 1000;
export const DEFAULT_SLEEP_MULTIPLIER = 2;
export const DEFAULT_RETRY_COUNT = 5;
export const TEE_OFFERS: string[] = JSON.parse(process.env.TEE_OFFERS || '["1"]');
export const PROVIDER_PROVISIONER_OFFER = process.env.PROVIDER_PROVISIONER_OFFER;
export const BASE_IMAGE_OFFER = process.env.BASE_IMAGE_OFFER;
export const STORAGE_OFFER = process.env.STORAGE_OFFER;
export const MINUTES_IN_WEEK = 10080;
