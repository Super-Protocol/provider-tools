import { ISpctlService } from './spctl';
import { ILogger } from '../common/logger';

const checkTeeOfferReady = async (params: {
  offerId: string;
  service: ISpctlService;
  logger?: ILogger;
}): Promise<boolean> => {
  const { offerId, service, logger } = params;
  try {
    const offerInfo = await service.getOfferInfo(offerId, 'tee');

    return Boolean(offerInfo?.tlb);
  } catch (err) {
    logger?.debug({ err }, `Failed to get offer info ${offerId}`);
    return false;
  }
};

export type CheckTeeOffersReadyItemResult = { id: string; ready: boolean };
export type CheckTeeOffersReadyResult = CheckTeeOffersReadyItemResult[];
export const checkTeeOffersReady = async (params: {
  offerIds: string[];
  service: ISpctlService;
  logger?: ILogger;
}): Promise<CheckTeeOffersReadyResult> => {
  const { offerIds } = params;
  const result = await Promise.allSettled(
    offerIds.map((offerId) =>
      checkTeeOfferReady({
        ...params,
        offerId,
      }),
    ),
  );

  return result.map((result, index): CheckTeeOffersReadyItemResult => {
    if (result.status === 'fulfilled') {
      return {
        id: offerIds[index],
        ready: Boolean(result.value),
      };
    } else {
      return {
        id: offerIds[index],
        ready: false,
      };
    }
  });
};
