export interface IProvider {
  name: string;
  description?: string;
  tokenReceiver: string;
  actionAccount: string;
  metadata: string;
}
