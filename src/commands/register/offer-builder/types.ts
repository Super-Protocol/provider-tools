export interface ISlotInfo {
  cpuCores: number;
  ram: number;
  diskUsage: number;
  gpuCores: number;
}

export interface IOptionInfo {
  bandwidth: number;
  traffic: number;
  externalPort: number;
}

export interface IHardwareInfo {
  slotInfo: ISlotInfo;
  optionInfo: IOptionInfo;
}

export interface ICommonOfferInfo {
  name: string;
  description: string;
  teeType: string;
  properties: string;
  tlb: string;
}
export interface IOfferInfo extends ICommonOfferInfo {
  hardwareInfo: IHardwareInfo;
}
