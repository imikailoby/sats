import type { Provider, Utxo, Balance } from "../types";

function withTimeout<T>(p: Promise<T>, ms = 4000): Promise<T> {
    return new Promise((res, rej) => {
        const t = setTimeout(() => rej(new Error("timeout")), ms);
        p.then(v => { clearTimeout(t); res(v); })
            .catch(e => { clearTimeout(t); rej(e); });
    });
}

export function createProviderChain(...providers: Provider[]): Provider {
    async function tryAll<R>(fn: (p: Provider) => Promise<R>): Promise<R> {
        let lastErr: any;
        for (const p of providers) {
            try { return await withTimeout(fn(p)); }
            catch (e) { lastErr = e; }
        }
        throw lastErr ?? new Error("no providers available");
    }
    return {
        getAddressUtxos(addr: string): Promise<Utxo[]> {
            return tryAll(p => p.getAddressUtxos(addr));
        },
        getAddressBalance(addr: string): Promise<Balance> {
            return tryAll(p => p.getAddressBalance(addr));
        },
        broadcast(rawHex: string): Promise<{ txid: string }> {
            return tryAll(p => p.broadcast ? p.broadcast(rawHex) : Promise.reject(new Error("no broadcast")));
        }
    };
}