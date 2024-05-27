export type AddressType = "p2pkh" | "p2sh" | "p2wsh" | "p2wpkh" | "p2tr";
export type Network = "mainnet" | "testnet";

export type BrowserWalletNetwork = Extract<Network, "mainnet" | "testnet">;

export type AddressFormat =
  | "legacy"
  | "p2sh-p2wpkh"
  | "p2wsh"
  | "segwit"
  | "taproot";

export type Address = {
  /**
   * Address
   */
  address: string;

  /**
   * Address format
   */
  format: AddressFormat;

  /**
   * Public key
   */
  publicKey: string;

  /**
   * x-coordinate of the public key, when taproot is used
   */
  xKey?: string;
};

export type WalletAddress = {
  publicKey: string;
  address: string;
  format: AddressFormat;
};

export interface BrowserWalletSignPSBTOptions {
  /**
   * Finalize the inputs of a PSBT.
   *
   * If the transaction is fully signed, it will produce a PSBT which can be extracted.
   */
  finalize?: boolean;

  /**
   * Extract and return the complete transaction in normal network serialization instead of the PSBT.
   */
  extractTx?: boolean;
}

export interface BrowserWalletSignResponse {
  hex: string;
  base64: string | null;
}
