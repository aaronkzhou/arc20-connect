import { ReactNode, useCallback, useState } from "react";
import Avatar from "boring-avatars";

import ChevronRightIcon from "../../assets/chevron-right.svg";
import LoadingIcon from "../../assets/loading.svg";
import { useOrdConnect, Wallet } from "../../providers/OrdConnectProvider";
import { truncateMiddle } from "../../utils/text-helper";

const WALLET_TO_NAME: Record<Wallet, string> = {
  [Wallet.MAGICEDEN]: "Magic Eden",
  [Wallet.UNISAT]: "UniSat",
  [Wallet.XVERSE]: "Xverse",
  [Wallet.LEATHER]: "Leather",
  [Wallet.OKX]: "OKX",
  [Wallet.WIZZ]: "WIZZ",
} as const;

interface WalletButtonProp {
  wallet: Wallet;
  subtitle: string;
  onConnect: () => Promise<boolean>;
  icon: string;
  setErrorMessage: (msg: string) => void;
  isDisabled?: boolean;
  isMobileDevice?: boolean;
  renderAvatar?: (address: string, size: "large" | "small") => ReactNode;
}

export function WalletButton({
  wallet,
  subtitle,
  onConnect,
  icon,
  setErrorMessage,
  isDisabled,
  isMobileDevice,
  renderAvatar,
}: WalletButtonProp) {
  const { wallet: _connectedWallet, address: _connectedAddress } =
    useOrdConnect();

  // Introduce an initial state because otherwise while the modal is closing,
  // the connected address is suddenly updated in the dialog
  const [{ connectedWallet, connectedAddress }] = useState({
    connectedWallet: _connectedWallet,
    connectedAddress: _connectedAddress,
  });

  const [loading, setLoading] = useState(false);
  const walletName = WALLET_TO_NAME[wallet];

  const handleWalletConnectClick = useCallback(async () => {
    setLoading(true);
    const result = await Promise.race([
      onConnect()
        .then(() => setLoading(false))
        .catch(() => setLoading(false)),
      new Promise<string>((resolve) => {
        setTimeout(() => resolve("timeout"), 5000);
      }),
    ]);
    if (result === "timeout") {
      setErrorMessage(
        "No wallet pop-up? The extension is not responding. Try reloading your browser.",
      );
    } else {
      setLoading(false);
    }
  }, [onConnect, setErrorMessage]);

  return (
    <button
      type="button"
      className="wallet-option-button"
      onClick={handleWalletConnectClick}
      disabled={isDisabled}
    >
      <div className="option-wrapper">
        <img className="wallet-icon" src={icon} alt="" />
        <div className="wallet-option">
          <span className="wallet-option-label">{walletName}</span>
          <span
            className="wallet-option-subtitle"
            style={{ display: isMobileDevice ? "block" : "none" }}
          >
            {subtitle}
          </span>
        </div>
        {connectedWallet === wallet && connectedAddress.payments ? (
          <div className="wallet-option-connected-address">
            {renderAvatar ? (
              renderAvatar(connectedAddress.payments, "small")
            ) : (
              <Avatar
                size={16}
                variant="beam"
                name={connectedAddress.payments}
                colors={["#1C2DCB", "#F226B8"]}
              />
            )}
            <span className="label">
              {truncateMiddle(connectedAddress.payments)}
            </span>
          </div>
        ) : null}
        {loading ? (
          <img
            src={LoadingIcon}
            width={24}
            alt={`${walletName} extension is loading`}
          />
        ) : (
          <img
            src={ChevronRightIcon}
            alt="Chevron Right"
            width={24}
            height={24}
            className="chveron-btn"
          />
        )}
      </div>
    </button>
  );
}
