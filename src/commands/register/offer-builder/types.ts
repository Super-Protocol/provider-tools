export interface ISlotInfo {
  cpuCores: number;
  ram: number;
  vram: number;
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

export enum TeeOfferSubtype {
  Default = '0',
  TeeSubtypeSGX = '1',
  TeeSubtypeTDX = '2',
  TeeSubtypeSEV = '3',
  TeeSubtypeARM = '4',
}

export interface ICommonOfferInfo {
  name: string;
  description: string;
  teeType: string;
  subType: TeeOfferSubtype;
  properties: string;
}

export interface IOfferInfo extends ICommonOfferInfo {
  hardwareInfo: IHardwareInfo;
}
