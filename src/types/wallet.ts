export interface WalletProvider {
  id: string;
  name: string;
  description: string;
  iconBg: string;
  isInstalled?: boolean;
  recommended?: boolean;
}
