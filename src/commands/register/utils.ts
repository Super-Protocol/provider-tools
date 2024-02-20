import { ProviderType } from './types';

export const getProviderType = (options: Record<ProviderType, boolean>): ProviderType => {
  const providerTypes: ProviderType[] = ['value', 'tee'];
  const providerType = providerTypes.find((type) => options[type]);

  if (!providerType) {
    throw new Error('Could not detect provider type');
  }

  return providerType;
};
