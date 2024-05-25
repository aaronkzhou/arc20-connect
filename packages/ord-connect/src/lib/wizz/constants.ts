import type { BrowserWalletNetwork } from "../types";

type WizzNetwork = "livenet" | "testnet";

export const NETWORK_TO_WIZZ_NETWORK: Record<
  BrowserWalletNetwork,
  WizzNetwork
> = {
  mainnet: "livenet",
  testnet: "testnet",
} as const;
