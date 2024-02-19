export interface IProvider {
  name: string;
  description?: string;
  tokenReceiver: string;
  actionAccount: string;
  metadata: string;
}

export interface IOfferInfo {
  name: string;
  description?: string;
  teeType: number;
  properties: number;
  tlb: string;
  argsPublicKey: string;
  hardwareInfo: {
    slotInfo: {
      cpuCores: number;
      gpuCores: number;
      ram: number;
      diskUsage: number;
    };
    optionInfo: {
      bandwidth: number;
      traffic: number;
      externalPort: number;
    };
  };
}
