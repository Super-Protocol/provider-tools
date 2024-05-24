import path from 'path';
import fs from 'fs/promises';
import { SpctlOfferType } from '../../services/spctl';
import { OfferType } from '../types';

export const toSpctlOfferType = (offerType: OfferType): SpctlOfferType => {
  if (offerType === 'tee') {
    return 'tee';
  }

  return 'value';
};

const getRunnerAssetsPath = (): string => {
  const level = process.env.NODE_ENV === 'development' ? 3 : 4;
  const subpath = '..,'.repeat(level).split(',').filter(Boolean);

  return path.resolve(__dirname, ...subpath, 'runner-assets');
};

export const getRunnerAsset = (assetName: string): Promise<string> => {
  return fs.readFile(path.join(getRunnerAssetsPath(), assetName), 'utf-8');
};
