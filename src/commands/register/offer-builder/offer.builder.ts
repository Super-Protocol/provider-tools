import { IOfferInfo } from './types';
import { IBuildHardwareInfoParams, buildPart as buildHardwareInfo } from './harwware-info.builder';
import { buildPart as buildCommonInfo } from './common-info.builder';

export interface IOfferBuilderParams {
  service: IBuildHardwareInfoParams['service'];
}
export const build = async (params: IOfferBuilderParams): Promise<IOfferInfo> => {
  const hardwareInfo = await buildHardwareInfo({ service: params.service });
  const commonInfo = buildCommonInfo();

  return {
    ...commonInfo,
    hardwareInfo,
  };
};
