# arc20-connect

<img src="preview_wallets.png" alt="Preview" />

## Introduction

**arc20-connect** is a React component library that allows you to easily integrate Bitcoin atomicals & Inscriptions via [Sado Protocol Connections](https://sado.space) with your decentralized application (dApp). We stand as the pioneering walletkit to support arc20-aware transactions.

## Wallet Feature Support

| Wallet | Ordinal-safety | Inscription-safety |
| ------ | -------------- | ------------------ |
| Unisat | ✅             | ✅                 |
| Wizz   | ✅             | ✅                 |
| OKX    | ✅             | ✅                 |

## Quick Start

Just two simple steps:

1.  Add dependency:

    ```bash
    pnpm install arc20-connect
    ```

2.  Import ord-connect into your dApp:

    ```javascript
    import { Network, ArcConnectProvider, ArcConnectKit } from "arc20-connect";

    export default function YourReactComponent() {
      return (
        <ArcConnectProvider initialNetwork={Network.TESTNET}>
          <ArcConnectKit />
        </ArcConnectProvider>
      );
    }
    ```

## Contribute

The following instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You'll need to have `pnpm` installed on your system. If it's not yet installed, you can get it via npm using:

```bash
npm install -g pnpm
```

### Development

To develop ord-connect, navigate to the ord-connect directory, install the necessary packages and serve the project:

```bash
cd packages/arc20-connect
pnpm install
pnpm dev
```

The sample playground component is located at `packages/arc20-connect/src/main.tsx`.

Changes made to the code will be reflected immediately.

## Local Integration Testing

For inter-repo local testing:

1. Link the global package to the local project:

   ```bash
   pnpm link packages/arc20-connect --global
   ```

2. `cd` to any repo of your choosing (e.g., arc20).

3. The remaining steps are identical to [Quick Start](#quick-start).

Happy coding! For any issues or feature requests, please raise an issue in the GitHub repository.
