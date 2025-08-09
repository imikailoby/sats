import type { Provider, Utxo, Balance } from "../types";
import { withTimeout } from "../utils/http";
import { ProviderError, TimeoutError } from "../core/errors";

/**
 * Create a provider that tries the given providers in order with simple backoff and timeout.
 * Backoff schedule: 0ms, 250ms, 500ms.
 */

export function createProviderChain(
  ...providersOrOptions: (Provider | { timeoutMs?: number; backoffMs?: number[] })[]
): Provider {
  // Options can be passed as the last argument
  let timeoutMs = 4000;
  let backoffMs: number[] = [0, 250, 500];
  const providers: Provider[] = [];

  providersOrOptions.forEach((item, idx) => {
    if (typeof (item as any).getAddressUtxos === "function") {
      providers.push(item as Provider);
    } else if (idx === providersOrOptions.length - 1) {
      const opts = item as { timeoutMs?: number; backoffMs?: number[] };
      if (typeof opts.timeoutMs === "number") timeoutMs = opts.timeoutMs;
      if (Array.isArray(opts.backoffMs) && opts.backoffMs.length > 0) backoffMs = opts.backoffMs;
    }
  });

  async function tryAll<R>(fn: (p: Provider) => Promise<R>): Promise<R> {
    let lastErr: unknown;
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const delay = backoffMs[Math.min(i, backoffMs.length - 1)] ?? 0;
      if (delay > 0) await new Promise((r) => {
        const t = setTimeout(r, delay);
        (t as any)?.unref?.();
      });
      try {
        return await withTimeout(fn(provider), timeoutMs);
      } catch (e) {
        lastErr = e instanceof TimeoutError ? e : new ProviderError(`provider[${i}] failed`, e);
      }
    }
    throw lastErr ?? new ProviderError("no providers available");
  }

  return {
    getAddressUtxos(addr: string): Promise<Utxo[]> {
      return tryAll((p) => p.getAddressUtxos(addr));
    },
    getAddressBalance(addr: string): Promise<Balance> {
      return tryAll((p) => p.getAddressBalance(addr));
    },
    broadcast(rawHex: string): Promise<{ txid: string }> {
      return tryAll((p) => (p.broadcast ? p.broadcast(rawHex) : Promise.reject(new ProviderError("broadcast not supported"))));
    },
  };
}