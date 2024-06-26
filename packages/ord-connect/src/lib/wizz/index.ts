import {
  getAddressInfo,
  Network as NetworkEnum,
  validate,
} from "bitcoin-address-validation";
import { Psbt } from "bitcoinjs-lib";

import type {
  BrowserWalletNetwork,
  BrowserWalletSignResponse,
  WalletAddress,
} from "../types";

import { NETWORK_TO_WIZZ_NETWORK } from "./constants";
import {
  BrowserWalletExtractTxFromNonFinalizedPsbtError,
  BrowserWalletNotInstalledError,
  BrowserWalletRequestCancelledByUserError,
  BrowserWalletSigningError,
  OrditSDKError,
} from "./errors";
import type { WizzSignPSBTOptions } from "./types";

export type Network = "mainnet" | "testnet" | "regtest";

export type AddressFormat =
  | "legacy"
  | "p2sh-p2wpkh"
  | "p2wsh"
  | "segwit"
  | "taproot";
export type AddressType = "p2pkh" | "p2sh" | "p2wsh" | "p2wpkh" | "p2tr";

export const ADDRESS_TYPE_TO_FORMAT: Record<AddressType, AddressFormat> = {
  p2pkh: "legacy",
  p2sh: "p2sh-p2wpkh",
  p2wsh: "p2wsh",
  p2wpkh: "segwit",
  p2tr: "taproot",
} as const;

type MessageSignatureTypes = "bip322-simple" | "ecdsa";

type WizzError = { code?: number; message: string };
function getAddressFormatForRegTest(address: string): AddressFormat {
  try {
    const { type, network: validatedNetwork, bech32 } = getAddressInfo(address);
    if (
      (!bech32 && validatedNetwork !== "testnet") ||
      (bech32 && validatedNetwork !== "regtest")
    ) {
      // This type Error is intentional, we'll forward the top-level one anyway
      throw new Error("Invalid address");
    }
    return ADDRESS_TYPE_TO_FORMAT[type];
  } catch (_) {
    throw new OrditSDKError("Invalid address");
  }
}

export function getAddressFormat(
  address: string,
  network: Network,
): AddressFormat {
  // Separate regtest handling because bitcoin-address-validation treats non-bech32 addresses as testnet addresses,
  // which fail in the validate function.
  if (network === "regtest") {
    return getAddressFormatForRegTest(address);
  }

  if (!validate(address, network as NetworkEnum)) {
    throw new OrditSDKError("Invalid address");
  }

  const { type } = getAddressInfo(address);
  return ADDRESS_TYPE_TO_FORMAT[type];
}

/**
 * Checks if the browser wallet extension is installed.
 *
 * @returns `true` if installed, `false` otherwise.
 * @throws {OrditSDKError} Function is called outside a browser without `window` object
 */

function isInstalled() {
  if (typeof window === "undefined") {
    throw new OrditSDKError("Cannot call this function outside a browser");
  }
  return typeof window.wizz !== "undefined";
}

/**
 * Gets addresses from the browser wallet.
 *
 * @param network Network
 * @param readOnly Read only (when set to true, the wallet modal appears)
 * @returns An array of WalletAddress objects.
 * @throws {BrowserWalletNotInstalledError} Wallet is not installed
 * @throws {BrowserWalletRequestCancelledByUserError} Request was cancelled by user
 * @throws {OrditSDKError} Internal error
 */
async function getAddresses(
  network: BrowserWalletNetwork = "mainnet",
  readOnly?: boolean,
): Promise<WalletAddress[]> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError("Wizz not installed");
  }
  try {
    const connectedNetwork = await window.wizz.getNetwork();
    const targetNetwork = NETWORK_TO_WIZZ_NETWORK[network];
    if (connectedNetwork !== targetNetwork) {
      await window.wizz.switchNetwork(targetNetwork);
    }

    const accounts = readOnly
      ? await window.wizz.getAccounts()
      : await window.wizz.requestAccounts();
    const publicKey = await window.wizz.getPublicKey();

    const address = accounts[0];
    if (!address) {
      return [];
    }
    const format = getAddressFormat(address, network);
    return [
      {
        publicKey,
        address,
        format,
      },
    ];
  } catch (err) {
    if (err instanceof OrditSDKError) {
      // internal error caused by getAddressFormat
      throw err;
    }

    const wizzError = err as WizzError;
    if (wizzError?.code === 4001) {
      throw new BrowserWalletRequestCancelledByUserError();
    }
    throw new OrditSDKError(wizzError.message);
  }
}

/**
 * Signs a Partially Signed Bitcoin Transaction (PSBT).
 * To learn more, visit https://github.com/bitcoin/bitcoin/blob/master/doc/psbt.md
 *
 * @param psbt Partially Signed Bitcoin Transaction
 * @param options Options for signing
 * @returns An object containing `base64` and `hex` if the transaction is not extracted, or `hex` if the transaction is extracted.
 * @throws {BrowserWalletNotInstalledError} Wallet is not installed
 * @throws {BrowserWalletSigningError} Signing failed
 */
async function signPsbt(
  psbt: Psbt,
  { finalize = true, extractTx = true }: WizzSignPSBTOptions = {},
): Promise<BrowserWalletSignResponse> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError("Wizz not installed");
  }

  if (extractTx && !finalize) {
    throw new BrowserWalletExtractTxFromNonFinalizedPsbtError();
  }

  const psbtHex = psbt.toHex();

  let signedPsbtHex = "";
  try {
    signedPsbtHex = await window.wizz.signPsbt(psbtHex, {
      autoFinalized: finalize,
    });
  } catch (err) {
    // wizz does not use Error object prototype
    const wizzError = err as WizzError;
    if (wizzError?.code === 4001) {
      throw new BrowserWalletRequestCancelledByUserError();
    }
  }

  if (!signedPsbtHex) {
    throw new BrowserWalletSigningError("Failed to sign psbt hex using wizz");
  }

  const signedPsbt = Psbt.fromHex(signedPsbtHex);

  if (extractTx) {
    try {
      return {
        base64: null,
        hex: signedPsbt.extractTransaction().toHex(),
      };
    } catch (error) {
      // It is possible that not all inputs are finalized.
      // extractTransaction will fail if there are any.
      if (error instanceof Error && error.message === "Not finalized") {
        throw new BrowserWalletExtractTxFromNonFinalizedPsbtError();
      } else {
        throw new OrditSDKError("Failed to extract transaction from PSBT");
      }
    }
  } else {
    return {
      base64: signedPsbt.toBase64(),
      hex: signedPsbt.toHex(),
    };
  }
}

/**
 * Signs a message.
 *
 * @param message Message to be signed
 * @param type Signature type
 * @returns An object containing `base64` and `hex`.
 * @throws {BrowserWalletNotInstalledError} Wallet is not installed
 * @throws {BrowserWalletSigningError} Signing failed
 */
async function signMessage(
  message: string,
  type: MessageSignatureTypes = "ecdsa",
): Promise<BrowserWalletSignResponse> {
  if (!isInstalled()) {
    throw new BrowserWalletNotInstalledError("Wizz not installed");
  }

  let signature: string = "";
  try {
    signature = await window.wizz.signMessage(message, type);
  } catch (err) {
    // Unisat does not use Error object prototype
    const unisatError = err as WizzError;
    if (unisatError?.code === 4001) {
      throw new BrowserWalletRequestCancelledByUserError();
    }
  }

  if (!signature) {
    throw new BrowserWalletSigningError("Failed to sign message using wizz");
  }

  return {
    base64: signature,
    hex: Buffer.from(signature, "base64").toString("hex"),
  };
}

export { getAddresses, isInstalled, signMessage, signPsbt };

export * from "../types";
export * from "./types";
