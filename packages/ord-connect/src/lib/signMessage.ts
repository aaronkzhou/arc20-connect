import { AddressFormat } from "@ordzaar/ordit-sdk";
import { signMessage as signOKXMessage } from "@ordzaar/ordit-sdk/okx";
import { signMessage as signUnisatMessage } from "@ordzaar/ordit-sdk/unisat";

import { Network, Wallet } from "../providers/OrdConnectProvider";

import { signMessage as signWizzMessage } from "./wizz";

interface SignMessageParams {
  message: string;
  wallet: Wallet;
  address: string;
  network: Network;
  format: AddressFormat;
}

/**
 * Sign message
 *
 * @param options Options
 * @returns base64 signature
 */
export default async function signMessage({
  message,
  wallet,
  network,
}: SignMessageParams): Promise<string | null> {
  if (wallet === Wallet.UNISAT) {
    const { base64 } = await signUnisatMessage(message, "bip322-simple");
    return base64;
  }

  if (wallet === Wallet.WIZZ) {
    const { base64 } = await signWizzMessage(message, "bip322-simple");
    return base64;
  }

  if (wallet === Wallet.OKX) {
    const { base64 } = await signOKXMessage(message, "bip322-simple", network);
    return base64;
  }

  throw new Error("Invalid wallet selected");
}
