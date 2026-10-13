const NANO = 1_000_000_000n;

/** Converts nanoTON to a trimmed decimal TON string (no rounding errors). */
export function nanoToTon(nano: string | number | bigint): string {
  const n = typeof nano === 'bigint' ? nano : BigInt(nano);
  const whole = n / NANO;
  const frac = n % NANO;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(9, '0').replace(/0+$/, '');
  return `${whole}.${fracStr}`;
}

/** "EQ…abc123" for display. */
export function shortenAddress(address: string, head = 6, tail = 6): string {
  if (!address) return '';
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}

export function formatUpdatedAt(ts: number | string | null): string {
  if (!ts) return '';
  const date = typeof ts === 'number' ? new Date(ts) : new Date(ts);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Waits for a TON payment to be confirmed on-chain by the server. */
export async function waitForPayment(
  fetchStatus: () => Promise<{ status: string }>,
  opts: { expiresAt?: string; maxWaitMs?: number } = {},
): Promise<'completed' | 'pending' | 'expired' | 'failed' | 'cancelled'> {
  const deadlineExp = opts.expiresAt ? Date.parse(opts.expiresAt) : Infinity;
  const maxWait = opts.maxWaitMs ?? 8 * 60_000;
  const hardDeadline = Date.now() + maxWait;
  let pollCount = 0;

  while (Date.now() < Math.min(hardDeadline, deadlineExp)) {
    await sleep(pollCount < 10 ? 3500 : 8000);
    pollCount += 1;
    const status = await fetchStatus().catch(() => null);
    if (!status) continue;
    if (status.status === 'completed') return 'completed';
    if (status.status === 'expired') return 'expired';
    if (status.status === 'cancelled') return 'cancelled';
    if (status.status === 'failed') return 'failed';
  }
  return 'pending';
}