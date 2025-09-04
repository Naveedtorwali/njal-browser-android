
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Web3Modal } from '@walletconnect/modal-react-native';
import { ethers } from 'ethers';

const WC_PROJECT_ID = "ab7dc7af208caa797184d16c35012c41";
const INFURA_ID = "2f5c6e3d182d4abf8ae19ecd7d6b370e";

export default function App() {
  const [url, setUrl] = useState("https://example.com");
  const [sessionObj, setSessionObj] = useState(null);
  const [balance, setBalance] = useState(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("0.001");

  const connectWallet = async () => {
    try {
      const modal = new Web3Modal({ projectId: WC_PROJECT_ID });
      const result = await modal.connect(); // result may contain session and/or client
      // try to extract account
      let account = null;
      if (result && result.session && result.session.namespaces && result.session.namespaces.eip155) {
        const accounts = result.session.namespaces.eip155.accounts;
        if (accounts && accounts.length) account = accounts[0].split(':').pop();
      } else if (result && result.accounts && result.accounts.length) { // older shape
        account = result.accounts[0];
      }
      setSessionObj(result);
      if (account) {
        // Use Infura Sepolia for balance (testnet)
        const provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/' + INFURA_ID);
        const bal = await provider.getBalance(account);
        setBalance(ethers.utils.formatEther(bal));
      }
    } catch (e) { console.error(e); Alert.alert('Connect failed', ''+e); }
  };

  // send transaction using WalletConnect session request if available.
  const sendTransaction = async () => {
    if (!sessionObj) return Alert.alert('Not connected', 'Please connect a wallet first.');
    try {
      // build tx
      const tx = { to: recipient, value: ethers.utils.parseEther(amount).toHexString() };
      // Attempt 1: if sessionObj has 'request' method (some clients expose it)
      if (typeof sessionObj.request === 'function') {
        const res = await sessionObj.request({ method: 'eth_sendTransaction', params: [tx] });
        Alert.alert('Transaction sent', res || 'tx request sent');
        return;
      }
      // Attempt 2: if sessionObj.session.client available (WalletConnect v2 signClient)
      if (sessionObj && sessionObj.session && sessionObj.session.topic && sessionObj.client) {
        // use client.request if present
        const request = { topic: sessionObj.session.topic, chainId: 'eip155:11155111', request: { method: 'eth_sendTransaction', params: [tx] } };
        const resp = await sessionObj.client.request(request);
        Alert.alert('Transaction sent', JSON.stringify(resp));
        return;
      }
      // Fallback: instruct user to use wallet app to send
      Alert.alert('Unsupported', 'Automatic sending not supported for this wallet session. Use your wallet app to create the transaction.');
    } catch (e) { console.error(e); Alert.alert('Send failed', ''+e); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
        <TextInput value={url} onChangeText={setUrl} style={styles.input} />
        <Button title="Go" onPress={() => {}} />
        <Button title={sessionObj ? 'Connected' : 'Connect'} onPress={connectWallet} />
      </View>
      {balance && <Text style={styles.balanceText}>Balance: {balance} ETH (Sepolia)</Text>}
      <View style={{padding:8}}>
        <TextInput placeholder="Recipient address" value={recipient} onChangeText={setRecipient} style={{borderWidth:1,padding:6,marginBottom:6}} />
        <TextInput placeholder="Amount (ETH)" value={amount} onChangeText={setAmount} style={{borderWidth:1,padding:6,marginBottom:6}} />
        <Button title="Send ETH (testnet)" onPress={sendTransaction} />
      </View>
      <WebView source={{ uri: url }} style={{ flex: 1 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topbar: { flexDirection: 'row', padding: 5, alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, marginRight: 5, padding: 4 },
  balanceText: { padding: 10, fontSize: 16, fontWeight: 'bold' }
});
