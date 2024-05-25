type Unisat = {
  addListener: (eventName: string, callback: (arg: string) => void) => void;
  removeListener: (eventName: string, callback: (arg: string) => void) => void;
  getNetwork: () => Promise<UnisatNetwork>;
  switchNetwork: (targetNetwork: UnisatNetwork) => Promise<void>;
  requestAccounts: () => Promise<string[]>;
  getAccounts: () => Promise<string[]>;
  getPublicKey: () => Promise<string>;
  signPsbt: (hex: string) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
  sendBitcoin: (
    address: string,
    satoshis: number,
    options: { feeRate?: number },
  ) => Promise<string>;
  getBalance: () => Promise<{
    confirmed: number;
    total: number;
    unconfirmed: number;
  }>;
};

type Wizz = {
  getAccounts: () => Promise<string[]>;
  requestAccounts(): Promise<string[]>;
  getNetwork(): Promise<NetworkType>;
  getPublicKey(): Promise<string>;
  getInscriptions(
    cursor?: number,
    size?: number,
  ): Promise<InscriptionsResponse>;
  getInscriptionsByAddress(
    address: string,
    cursor?: number,
    size?: number,
  ): Promise<InscriptionsResponse>;
  signMessage(
    message: string,
    type?: string | SignMessageType,
  ): Promise<string>;
  signPsbt(psbtHex: string, options?: SignOptions): Promise<string>;
  signPsbts(psbtHexs: string[], options?: SignOptions): Promise<string[]>;
  getVersion(): Promise<string>;
  getBalance(): Promise<BalanceSummary>;
  getAssets(): Promise<WalletAssetBalance>;
  switchNetwork(network: NetworkType): Promise<NetworkType>;
  sendBitcoin(
    toAddress: string,
    satoshis: number,
    options?: {
      feeRate?: number;
    },
  ): Promise<string>;
  sendARC20(
    toAddress: string,
    arc20: string,
    satoshis: number,
    options?: {
      feeRate: number;
    },
  ): Promise<string>;
  sendAtomicals(
    toAddress: string,
    atomicalIds: string[],
    options?: {
      feeRate: number;
    },
  ): Promise<string>;
  requestMint(params: RequestMintParams): Promise<void>;
  pushTx({ rawtx }: { rawtx: string }): Promise<string>;
  pushPsbt(psbt: string): Promise<string>;
};

declare interface Window {
  chrome: {
    app: {
      isInstalled: boolean;
      InstallState: {
        DISABLED: "disabled";
        INSTALLED: "installed";
        NOT_INSTALLED: "not_installed";
      };
      RunningState: {
        CANNOT_RUN: "cannot_run";
        READY_TO_RUN: "ready_to_run";
        RUNNING: "running";
      };
    };
  };
  unisat: Unisat;
  satsConnect: any;
  wizz: Wizz;
}
