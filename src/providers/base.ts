import type { Provider, Utxo, Balance } from "../types";
import { withTimeout } from "../utils/http";
import { ProviderError, TimeoutError } from "../core/errors";

/**
 * Create a provider that tries the given providers in order with simple backoff and timeout.
 * Backoff schedule: 0ms, 250ms, 500ms.
 */

export function createProviderChain(...providers: Provider[]): Provider {
  async function tryAll<R>(fn: (p: Provider) => Promise<R>): Promise<R> {
    const delays = [0, 250, 500];
    let lastErr: unknown;
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const d = delays[Math.min(i, delays.length - 1)];
      if (d > 0) await new Promise((r) => setTimeout(r, d));
      try {
        return await withTimeout(fn(provider), 4000);
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