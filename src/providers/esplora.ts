import type { Provider, Utxo, Balance } from "../types";

export function esplora(baseUrl: string): Provider {
    const J = async (path: string) => {
        const r = await fetch(baseUrl + path);
        if (!r.ok) throw new Error(`esplora ${r.status} ${baseUrl + path}`);
        return r.json();
    };
    const T = async (path: string, body: string) => {
        const r = await fetch(baseUrl + path, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body
        });
        if (!r.ok) throw new Error(`broadcast ${r.status} ${await r.text()}`);
        return r.text();
    };
    return {
        async getAddressUtxos(addr: string): Promise<Utxo[]> {
            const utxos = await J(`/address/${addr}/utxo`);
            return utxos.map((u: any) => ({ txid: u.txid, vout: u.vout, value: u.value }));
        },
        async getAddressBalance(addr: string): Promise<Balance> {
            const a = await J(`/address/${addr}`);
            const s = a.chain_stats || a.mempool_stats || {};
            return { funded: s.funded_txo_sum || 0, spent: s.spent_txo_sum || 0 };
        },
        async broadcast(rawHex: string) {
            const txid = await T(`/tx`, rawHex);
            return { txid };
        }
    };
}