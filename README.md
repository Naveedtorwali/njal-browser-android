
# Njal Browser Android (with send tx via WalletConnect)

This project uses WalletConnect modal-react-native and Infura Sepolia testnet by default for safe testing.

Configured IDs:
- WalletConnect Project ID: ab7dc7af208caa797184d16c35012c41
- Infura Project ID: 2f5c6e3d182d4abf8ae19ecd7d6b370e (used for Sepolia RPC)

Notes on transaction sending:
- The app attempts to send transactions by calling the wallet session's request methods.
- WalletConnect implementations differ. If your wallet supports eth_sendTransaction over the connected session, the tx will be submitted.
- If not supported, the app will prompt you to complete the transaction in the wallet app manually.
- Always test with Sepolia testnet first (this app uses Sepolia RPC).

Build:
1. npm install
2. npm start
3. eas build -p android --profile preview
