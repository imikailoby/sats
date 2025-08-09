import type { Provider, Utxo, Balance } from "../types";
import { getJson, postText } from "../utils/http";
import { BroadcastError, ProviderError } from "../core/errors";

/**
 * Create Esplora-compatible provider bound to baseUrl.
 * Uses GET/POST helpers with timeouts and maps to domain errors.
 */
export function esplora(baseUrl: string, opts: { timeoutMs?: number } = {}): Provider {
  const timeoutMs = opts.timeoutMs ?? 4000;
  const J = async (path: string) => getJson<any>(baseUrl, path, { timeoutMs });
  const T = async (path: string, body: string) => postText(baseUrl, path, body, { timeoutMs });

  return {
    async getAddressUtxos(addr: string): Promise<Utxo[]> {
      try {
        const utxos = await J(`/address/${addr}/utxo`);
        return utxos.map((u: any) => ({ txid: u.txid, vout: u.vout, value: u.value }));
      } catch (e) {
        throw new ProviderError(`esplora getAddressUtxos failed for ${baseUrl}`, e);
      }
    },
    async getAddressBalance(addr: string): Promise<Balance> {
      try {
        const a = await J(`/address/${addr}`);
        const s = a.chain_stats || a.mempool_stats || {};
        return { funded: s.funded_txo_sum || 0, spent: s.spent_txo_sum || 0 };
      } catch (e) {
        throw new ProviderError(`esplora getAddressBalance failed for ${baseUrl}`, e);
      }
    },
    async broadcast(rawHex: string) {
      try {
        const txid = await T(`/tx`, rawHex);
        return { txid };
      } catch (e) {
        throw new BroadcastError(`esplora broadcast failed for ${baseUrl}`, e);
      }
    },
  };
}