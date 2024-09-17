import { IOfferInfo } from './types';
import { buildPart as buildHardwareInfo } from './harwware-info.builder';
import { buildPart as buildCommonInfo } from './common-info.builder';
import { IRemoteHardwareInfo } from '../../../services/ssh';

export interface IOfferBuilderParams {
  hardwareInfo: IRemoteHardwareInfo;
}
export const build = async (params: IOfferBuilderParams): Promise<IOfferInfo> => {
  const hardwareInfo = await buildHardwareInfo(params);
  const commonInfo = buildCommonInfo();

  return {
    ...commonInfo,
    hardwareInfo,
  };
};
