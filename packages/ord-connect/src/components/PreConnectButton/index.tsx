import type { OrdConnectKitProp } from "../OrdConnectKit";

interface PreConnectButtonProp extends OrdConnectKitProp {
  openModal: () => void;
}

export function PreConnectButton({ openModal }: PreConnectButtonProp) {
  return (
    <button
      type="button"
      onClick={openModal}
      data-testid="connect-wallet-button"
      className="ord-connect-font ord-connect-wallet-button"
    >
      <span />
    </button>
  );
}
