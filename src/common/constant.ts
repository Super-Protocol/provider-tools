import { name, description, version } from '../../package.json';

export const APP_NAME = name;
export const APP_DESCRIPTION = description;
export const APP_VERSION = version;
export const CONFIG_DEFAULT_FILENAME = './config.json';
export const JWT_CHECK_REGEX = /(^[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*$)/;
export const PRIVATE_KEY_CHECK_REGEX = /\b(?:0x)?[0-9a-fA-F]{64}\b/g;
