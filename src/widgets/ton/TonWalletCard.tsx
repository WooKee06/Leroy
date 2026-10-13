import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  TonConnectButton,
  useIsConnectionRestored,
  useTonConnectUI,
} from '@tonconnect/ui-react';
import { FiCopy, FiRefreshCw, FiCheck, FiLogOut, FiLoader } from 'react-icons/fi';
import { tonWalletStore } from '@shared/stores/tonWalletStore';
import { shortenAddress, formatUpdatedAt } from '@shared/lib/ton';
import styles from './TonWalletCard.module.scss';

const NETWORK_LABEL =
  import.meta.env.VITE_TON_NETWORK === 'mainnet' ? 'Mainnet' : 'Testnet';

function TonWalletCard() {
  const [tonConnectUI] = useTonConnectUI();
  const isRestored = useIsConnectionRestored();
  const [copied, setCopied] = useState(false);

  const store = tonWalletStore;
  const address = store.addressFriendly || store.balance?.addressFriendly || '';

  const handleCopy = async () => {
    const ok = await store.copyAddress();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  const handleDisconnect = () => {
    void tonConnectUI.disconnect();
  };

  // Still restoring the saved session from storage.
  if (!isRestored) {
    return (
      <div className={styles.card}>
        <div className={styles.loadingRow}>
          <FiLoader size={18} className={styles.spinIcon} />
          <span>Подключаем кошелёк…</span>
        </div>
      </div>
    );
  }

  if (!store.isConnected) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <div className={styles.title}>Кошелёк TON</div>
            <div className={styles.subtitle}>
              Подключите Telegram Wallet (Gram Wallet), чтобы видеть баланс и
              оплачивать заказы в криптовалюте
            </div>
          </div>
          <span className={styles.networkBadge}>{NETWORK_LABEL}</span>
        </div>
        <div className={styles.connect}>
          <TonConnectButton />
        </div>
        <p className={styles.hint}>
          Подтверждение владения кошельком (ton_proof) проверяется на нашем
          сервере. Фраза восстановления никуда не отправляется.
        </p>
      </div>
    );
  }

  const balance = store.balance;
  const jettons = balance?.jettons ?? [];

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <div className={styles.title}>
            {store.walletName || 'Кошелёк TON'}
          </div>
          {store.isVerified ? (
            <div className={styles.verifiedBadge}>
              <FiCheck size={12} /> подтверждён
            </div>
          ) : (
            <div className={styles.verifyingBadge}>
              <FiLoader size={12} className={styles.spinIcon} /> проверка
              владения…
            </div>
          )}
        </div>
        <span className={styles.networkBadge}>{NETWORK_LABEL}</span>
      </div>

      <div className={styles.addressRow}>
        <span className={styles.address}>{shortenAddress(address, 10, 8)}</span>
        <button className={styles.iconBtn} onClick={handleCopy} title="Копировать адрес">
          {copied ? <FiCheck size={15} /> : <FiCopy size={15} />}
        </button>
      </div>

      <div className={styles.balanceBlock}>
        {store.balanceLoading && !balance ? (
          <div className={styles.balanceLoading}>
            <FiLoader size={18} className={styles.spinIcon} />
            <span>Загружаем баланс из блокчейна…</span>
          </div>
        ) : store.balanceError ? (
          <div className={styles.balanceError}>{store.balanceError}</div>
        ) : balance ? (
          <>
            <div className={styles.balanceRow}>
              <div className={styles.balanceMain}>
                <span className={styles.balanceValue}>
                  {Number(balance.balance).toLocaleString('ru-RU', {
                    maximumFractionDigits: 9,
                  })}
                </span>
                <span className={styles.balanceSymbol}>TON</span>
              </div>
              <button
                className={styles.iconBtn}
                onClick={() => void store.refreshBalance(true)}
                title="Обновить баланс"
                disabled={store.balanceLoading}
              >
                <FiRefreshCw size={15} className={store.balanceLoading ? styles.spinIcon : ''} />
              </button>
            </div>

            {jettons.length > 0 && (
              <div className={styles.jettons}>
                {jettons.map((j) => (
                  <div key={j.address} className={styles.jettonRow}>
                    <span>
                      {j.name} ({j.symbol})
                    </span>
                    <span className={styles.jettonValue}>
                      {j.balance} {j.symbol}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {store.lastUpdated && (
              <div className={styles.updatedAt}>
                Обновлено {formatUpdatedAt(store.lastUpdated)}
              </div>
            )}
          </>
        ) : (
          <div className={styles.balanceEmpty}>Баланс недоступен</div>
        )}
      </div>

      {store.verifyError && (
        <div className={styles.verifyError}>{store.verifyError}</div>
      )}

      <button className={styles.disconnect} onClick={handleDisconnect}>
        <FiLogOut size={15} /> Отключить кошелёк
      </button>
    </div>
  );
}

export default observer(TonWalletCard);