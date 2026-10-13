import { useEffect } from 'react';
import {
  useTonAddress,
  useTonConnectUI,
  useTonWallet,
} from '@tonconnect/ui-react';
import { leroyApi } from '@shared/api/leroyApi';
import { tonWalletStore } from '@shared/stores/tonWalletStore';

/**
 * Mounted once inside <TonConnectUIProvider/>. Keeps the mobx tonWalletStore
 * in sync with TON Connect and wires a server-issued one-time nonce into the
 * connect request so wallets sign it as part of ton_proof.
 */
export default function TonConnectBridge() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const friendly = useTonAddress();
  const raw = useTonAddress(false);

  // Prepare connect request params: ask the server for a fresh nonce.
  useEffect(() => {
    let cancelled = false;
    tonConnectUI.setConnectRequestParameters({ state: 'loading' });
    leroyApi
      .tonNonce()
      .then(({ payload }) => {
        if (cancelled) return;
        tonConnectUI.setConnectRequestParameters({
          state: 'ready',
          value: { tonProof: payload },
        });
      })
      .catch(() => {
        if (!cancelled) {
          // No nonce — wallets can still connect, just without ton_proof.
          tonConnectUI.setConnectRequestParameters(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tonConnectUI]);

  // Mirror connection state into the store.
  useEffect(() => {
    const name =
      wallet?.device?.appName ??
      (wallet?.provider ? wallet.provider.replace(/-/g, ' ') : '') ??
      '';
    tonWalletStore.syncFromTonConnect(!!wallet, friendly, raw, name);
  }, [wallet, friendly, raw]);

  // On connect, submit ton_proof for server-side ownership verification.
  useEffect(() => {
    const tp = wallet?.connectItems?.tonProof;
    if (!tp || !('proof' in tp) || !wallet.account) return;
    const publicKey = (tp as { publicKey?: string }).publicKey;
    if (!publicKey) return;
    void tonWalletStore.verifyProof(tp.proof, publicKey, wallet.account.address);
  }, [wallet]);

  return null;
}