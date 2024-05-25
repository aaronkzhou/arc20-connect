import { Psbt } from "bitcoinjs-lib";
import { signPsbt as signOKXPsbt } from "@ordzaar/ordit-sdk/okx";
import { signPsbt as signUnisatPsbt } from "@ordzaar/ordit-sdk/unisat";

import { Network, Wallet } from "../providers/OrdConnectProvider";

import { signPsbt as signWizzPsbt } from "./wizz";

export interface SignPsbtOptionsParams {
  finalize?: boolean;
  extractTx?: boolean;
  signingIndexes?: number[];
  sigHash?: number;
}

interface SignPsbtParams {
  address: string;
  wallet: Wallet;
  network: Network;
  psbt: Psbt;
  options?: SignPsbtOptionsParams;
}

export interface SerializedPsbt {
  hex: string;
  base64: string | null;
}

/**
 * @description accept wallet type and calls the right ordit function to sign the psbt.
 * @param wallet
 * @param network
 * @param psbt
 * @param options
 */
export default async function signPsbt({
  address,
  wallet,
  network,
  psbt,
  options,
}: SignPsbtParams): Promise<SerializedPsbt> {
  const finalize = options?.finalize ?? true;
  const extractTx = options?.extractTx ?? true;
  const getAllInputIndices = () =>
    psbt.data.inputs.map((value, index) => index);

  if (wallet === Wallet.UNISAT) {
    const signedUnisatPsbt = await signUnisatPsbt(psbt, {
      finalize,
      extractTx,
    });
    return signedUnisatPsbt;
  }

  if (wallet === Wallet.WIZZ) {
    const signedWizzPsbt = await signWizzPsbt(psbt, {
      finalize,
      extractTx,
    });
    return signedWizzPsbt;
  }

  if (wallet === Wallet.OKX) {
    const signedOKXPsbt = await signOKXPsbt(psbt, {
      finalize,
      extractTx,
      network,
      inputsToSign: [
        {
          address,
          signingIndexes: options?.signingIndexes ?? getAllInputIndices(), // If signingIndexes is not provided, just sign everything
          sigHash: options?.sigHash,
        },
      ],
    });
    return signedOKXPsbt;
  }

  // else throw error
  throw new Error("Invalid wallet selected");
}
