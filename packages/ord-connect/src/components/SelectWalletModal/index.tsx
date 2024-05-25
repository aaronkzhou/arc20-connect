import { Fragment, ReactNode, useCallback, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  BrowserWalletNotInstalledError,
  BrowserWalletRequestCancelledByUserError,
} from "@ordzaar/ordit-sdk";
import { getAddresses as getOKXAddresses } from "@ordzaar/ordit-sdk/okx";
import { getAddresses as getUnisatAddresses } from "@ordzaar/ordit-sdk/unisat";

import CloseModalIcon from "../../assets/close-modal.svg";
import OKXWalletIcon from "../../assets/okx-wallet.svg";
import UnisatWalletIcon from "../../assets/unisat-wallet.svg";
import WizzWalletIcon from "../../assets/wizz.svg";
import { getAddresses as getWizzAddresses } from "../../lib/wizz";
import { useOrdConnect, Wallet } from "../../providers/OrdConnectProvider";
import { isMobileUserAgent } from "../../utils/mobile-detector";
import { waitForUnisatExtensionReady } from "../../utils/unisat";

import { WalletButton } from "./WalletButton";

interface SelectWalletModalProp {
  isOpen: boolean;
  closeModal: () => void;
  renderAvatar?: (address: string, size: "large" | "small") => ReactNode;
}

const WALLET_CHROME_EXTENSION_URL: Record<Wallet, string> = {
  [Wallet.MAGICEDEN]: "https://wallet.magiceden.io/",
  [Wallet.UNISAT]: "https://unisat.io/download", // their www subdomain doesn't work
  [Wallet.XVERSE]: "https://www.xverse.app/download",
  [Wallet.LEATHER]: "https://leather.io/install-extension",
  [Wallet.OKX]: "https://www.okx.com/web3",
  [Wallet.WIZZ]: "https://wizzwallet.io",
};

export function SelectWalletModal({
  isOpen,
  closeModal,
  renderAvatar,
}: SelectWalletModalProp) {
  const {
    updateAddress,
    network,
    updateWallet,
    updatePublicKey,
    updateFormat,
    wallet,
    format,
    address,
    publicKey,
    disconnectWallet,
  } = useOrdConnect();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const isMobile = isMobileUserAgent();

  const onError = useCallback(
    (
      walletProvider: Wallet,
      err:
        | BrowserWalletNotInstalledError
        | BrowserWalletRequestCancelledByUserError
        | Error,
    ) => {
      if (err instanceof BrowserWalletNotInstalledError) {
        window.open(
          WALLET_CHROME_EXTENSION_URL[walletProvider],
          "_blank",
          "noopener,noreferrer",
        );
      }
      setErrorMessage(err.message ?? err.toString());
      console.error(`Error while connecting to ${walletProvider} wallet`, err);
      disconnectWallet();
    },
    [disconnectWallet],
  );

  const onConnectUnisatWallet = useCallback(
    async ({ readOnly }: { readOnly?: boolean } = {}) => {
      try {
        // Reset error message
        setErrorMessage("");
        const unisat = await getUnisatAddresses(network, readOnly);

        if (!unisat || unisat.length < 1) {
          disconnectWallet();
          throw new Error("Unisat via Ordit returned no addresses.");
        }

        // Unisat only returns one wallet by default
        const unisatWallet = unisat[0];
        updateAddress({
          payments: unisatWallet.address,
        });
        updatePublicKey({
          payments: unisatWallet.publicKey,
        });
        updateWallet(Wallet.UNISAT);
        updateFormat({
          payments: unisatWallet.format,
        });

        closeModal();
        return true;
      } catch (err) {
        onError(Wallet.UNISAT, err as Error);
        return false;
      }
    },
    [
      closeModal,
      disconnectWallet,
      network,
      onError,
      updateAddress,
      updateFormat,
      updatePublicKey,
      updateWallet,
    ],
  );

  const onConnectWizzWallet = useCallback(
    async ({ readOnly }: { readOnly?: boolean } = {}) => {
      try {
        // Reset error message
        setErrorMessage("");
        const wizz = await getWizzAddresses(network, readOnly);

        if (!wizz || wizz.length < 1) {
          disconnectWallet();
          throw new Error("Unisat via Ordit returned no addresses.");
        }

        // Unisat only returns one wallet by default
        const wizzWallet = wizz[0];
        updateAddress({
          payments: wizzWallet.address,
        });
        updatePublicKey({
          payments: wizzWallet.publicKey,
        });
        updateWallet(Wallet.WIZZ);
        updateFormat({
          payments: wizzWallet.format,
        });

        closeModal();
        return true;
      } catch (err) {
        onError(Wallet.WIZZ, err as Error);
        return false;
      }
    },
    [
      closeModal,
      disconnectWallet,
      network,
      onError,
      updateAddress,
      updateFormat,
      updatePublicKey,
      updateWallet,
    ],
  );

  const onConnectOKXWallet = useCallback(async () => {
    try {
      setErrorMessage("");
      const okx = await getOKXAddresses(network);
      if (!okx || okx.length < 1) {
        disconnectWallet();
        throw new Error("OKX via Ordit returned no addresses.");
      }

      const okxWallet = okx[0];
      updateAddress({
        payments: okxWallet.address,
      });
      updatePublicKey({
        payments: okxWallet.publicKey,
      });
      updateWallet(Wallet.OKX);
      updateFormat({
        payments: okxWallet.format,
      });
      closeModal();
      return true;
    } catch (err) {
      onError(Wallet.OKX, err as Error);
      return false;
    }
  }, [
    closeModal,
    disconnectWallet,
    network,
    onError,
    updateAddress,
    updateFormat,
    updatePublicKey,
    updateWallet,
  ]);

  // Reconnect address change listener if there there is already a connected wallet
  useEffect(() => {
    if (wallet !== Wallet.UNISAT) {
      return undefined;
    }

    let isMounted = true;
    let isConnectSuccessful = false;
    const listener = () => onConnectUnisatWallet();

    if (address && publicKey && format) {
      const connectToUnisatWalletOnReady = async () => {
        const isUnisatExtensionReady = await waitForUnisatExtensionReady();
        if (!isMounted) {
          return;
        }
        if (!isUnisatExtensionReady) {
          disconnectWallet();
          return;
        }

        isConnectSuccessful = await onConnectUnisatWallet({ readOnly: true });
        if (!isMounted) {
          return;
        }

        if (isConnectSuccessful) {
          window.unisat.addListener("accountsChanged", listener);
        }
      };
      connectToUnisatWalletOnReady();
    }

    return () => {
      isMounted = false;
      if (isConnectSuccessful) {
        window.unisat.removeListener("accountsChanged", listener);
      }
    };
  }, [wallet, onConnectUnisatWallet, disconnectWallet]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="ord-connect-font ord-connect-wallet-modal"
        onClose={closeModal}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <section className="backdrop" />
        </Transition.Child>

        <section className="outer-container">
          <div className="inner-container">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="panel">
                <section className="panel-title-container">
                  <Dialog.Title as="h3" className="panel-title">
                    Choose Bitcoin wallet to connect
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="close-button"
                  >
                    <img src={CloseModalIcon} alt="close modal" />
                  </button>
                </section>

                <section className="panel-content-container">
                  <section className="panel-content-inner-container">
                    {!isMobile && ( // TODO: remove this once unisat supported on mobile devices
                      <>
                        <WalletButton
                          wallet={Wallet.UNISAT}
                          subtitle="Coming soon on mobile browsing"
                          onConnect={onConnectUnisatWallet}
                          icon={UnisatWalletIcon}
                          setErrorMessage={setErrorMessage}
                          isDisabled={isMobile} // disable unisat on mobile until it is supported
                          isMobileDevice={isMobile}
                          renderAvatar={renderAvatar}
                        />
                        <hr className="horizontal-separator" />
                      </>
                    )}
                    <WalletButton
                      wallet={Wallet.WIZZ}
                      subtitle="Coming soon on mobile browsing"
                      onConnect={onConnectWizzWallet}
                      icon={WizzWalletIcon}
                      setErrorMessage={setErrorMessage}
                      isDisabled={isMobile} // disable unisat on mobile until it is supported
                      isMobileDevice={isMobile}
                      renderAvatar={renderAvatar}
                    />
                    {!isMobile && (
                      <>
                        <hr className="horizontal-separator" />
                        <WalletButton
                          wallet={Wallet.OKX}
                          subtitle="Available on OKX"
                          onConnect={onConnectOKXWallet}
                          icon={OKXWalletIcon}
                          setErrorMessage={setErrorMessage}
                          isMobileDevice={isMobile}
                          renderAvatar={renderAvatar}
                        />
                      </>
                    )}
                  </section>
                  <p className="error-message">{errorMessage}</p>
                </section>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </section>
      </Dialog>
    </Transition>
  );
}
