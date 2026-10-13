import { makeAutoObservable } from 'mobx';
import { leroyApi } from '@shared/api/leroyApi';
import { ApiError } from '@shared/api/client';
import { copyText } from '@shared/lib/ton';
import type { TonBalanceView, TonProof } from '@shared/api/models';

/**
 * Client-side state of the TON Connect (Telegram Wallet / Gram Wallet)
 * integration. The heavy lifting (ton_proof verification, balances, payment
 * verification) happens on the server — this store only mirrors it.
 */
class TonWalletStore {
  /** TON Connect connection state. */
  isConnected = false;
  addressFriendly = '';
  addressRaw = '';
  walletName = '';

  /** true once the server cryptographically verified wallet ownership. */
  isVerified = false;
  verifying = false;
  verifyError = '';

  balanceLoading = false;
  balanceError = '';
  balance: TonBalanceView | null = null;
  lastUpdated: number | null = null;
  lastBalanceSource: 'cache' | 'refresh' = 'cache';

  copyFeedback = false;

  constructor() {
    makeAutoObservable(this);
  }

  /** Called by <TonConnectBridge/> whenever the TON Connect wallet changes. */
  syncFromTonConnect(
    connected: boolean,
    friendly: string,
    raw: string,
    walletName: string,
  ) {
    this.isConnected = connected;
    this.addressFriendly = friendly;
    this.addressRaw = raw;
    this.walletName = walletName;

    if (!connected) {
      this.reset();
      return;
    }
    this.isVerified = false;
    this.verifyError = '';
    // If previous balance was cached (same user, wallet reconnected) keep it
    // until the server refreshes.
    void this.loadBalance(false).catch(() => undefined);
  }

  reset() {
    this.isVerified = false;
    this.verifying = false;
    this.verifyError = '';
    this.balance = null;
    this.balanceError = '';
    this.lastUpdated = null;
    this.isConnected = false;
    this.addressFriendly = '';
    this.addressRaw = '';
    this.walletName = '';
  }

  /** Sends the ton_proof to the server and binds the wallet to the user. */
  async verifyProof(proof: TonProof, publicKey: string, address: string) {
    if (!proof || !publicKey || !address) return;
    if (this.verifying) return;
    this.verifying = true;
    this.verifyError = '';
    try {
      const res = await leroyApi.tonVerify({ address, publicKey, proof });
      this.isVerified = res.verified;
      if (res.verified) {
        await this.refreshBalance(true);
      }
    } catch (e) {
      this.isVerified = false;
      this.verifyError =
        e instanceof Error ? e.message : 'Не удалось подтвердить кошелёк';
    } finally {
      this.verifying = false;
    }
  }

  /** Fetches the real on-chain balance from the server. */
  async refreshBalance(force = false) {
    await this.loadBalance(force);
  }

  private async loadBalance(force: boolean) {
    // A forced refresh (right after ton_proof verification) must not be skipped
    // even if a background load is still in flight.
    if (this.balanceLoading && !force) return;
    if (!this.isConnected && !force) return;
    this.balanceLoading = true;
    this.balanceError = '';
    try {
      this.balance = await leroyApi.tonBalance(force);
      this.isVerified = true;
      this.lastUpdated = Date.now();
      this.lastBalanceSource = force ? 'refresh' : 'cache';
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        // Wallet is connected in the wallet app but not yet bound on our
        // server (ownership proof is still being verified).
        this.isVerified = false;
        this.balance = null;
      } else {
        this.balanceError =
          e instanceof Error ? e.message : 'Не удалось получить баланс';
      }
    } finally {
      this.balanceLoading = false;
    }
  }

  async copyAddress(): Promise<boolean> {
    const text = this.addressFriendly || this.balance?.addressFriendly || '';
    if (!text) return false;
    const ok = await copyText(text);
    if (ok) {
      this.copyFeedback = true;
      setTimeout(() => {
        this.copyFeedback = false;
      }, 1600);
    }
    return ok;
  }
}

export const tonWalletStore = new TonWalletStore();