import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { providers, createProviderChain } from '../src/index.js';

describe('e2e: provider chain failover & timeout (mocked fetch)', () => {
    jest.setTimeout(15_000);

    const FAIL = 'https://fail.example/api';
    const HANG = 'https://hang.example/api';
    const OK = 'https://ok.example/api';

    const addr = 'tb1qtesttesttesttesttesttesttesttest0u3v4';

    const okUtxos = [{ txid: 'a'.repeat(64), vout: 1, value: 12345 }];
    const okBalance = { chain_stats: { funded_txo_sum: 12345, spent_txo_sum: 0 } };
    const okBroadcastTxid = 'b'.repeat(64);

    const origFetch = globalThis.fetch as any;

    function makeMockFetch() {
        return jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const url = typeof input === 'string' ? input : input.toString();

            if (url.startsWith(FAIL)) {
                return Promise.reject(new Error('network error on FAIL provider'));
            }

            if (url.startsWith(HANG)) {
                return new Promise((resolve) => {
                    const t = setTimeout(() => resolve(new Response('{}', { status: 200 })), 60_000);
                    (t as any)?.unref?.();
                });
            }

            if (url.startsWith(OK)) {
                if (url.endsWith(`/address/${addr}/utxo`)) {
                    return Promise.resolve(new Response(JSON.stringify(okUtxos), { status: 200 }));
                }
                if (url.endsWith(`/address/${addr}`)) {
                    return Promise.resolve(new Response(JSON.stringify(okBalance), { status: 200 }));
                }
                if (url.endsWith('/tx') && (init?.method === 'POST')) {
                    return Promise.resolve(new Response(okBroadcastTxid, { status: 200 }));
                }
                return Promise.resolve(new Response('{}', { status: 200 }));
            }

            return Promise.reject(new Error('unexpected URL in test: ' + url));
        }) as unknown as typeof fetch;
    }

    beforeAll(() => {
        globalThis.fetch = makeMockFetch();
    });

    afterAll(() => {
        globalThis.fetch = origFetch;
    });

    it('falls over from first (failing) to second (ok) provider', async () => {
        const chain = createProviderChain(
            providers.esplora(FAIL, { timeoutMs: 100 }),
            providers.esplora(OK, { timeoutMs: 100 }),
            { timeoutMs: 100, backoffMs: [0, 1, 2] }
        );

        const utxos = await chain.getAddressUtxos(addr);
        expect(utxos).toEqual(okUtxos);

        const bal = await chain.getAddressBalance(addr);
        expect(bal).toEqual({ funded: 12345, spent: 0 });

        const res = await chain.broadcast?.('deadbeef');
        expect(res).toEqual({ txid: okBroadcastTxid });

        const mock = globalThis.fetch as any;
        const failCalls = (mock.mock.calls ?? []).filter(([u]: [any]) => String(u).startsWith(FAIL));
        expect(failCalls.length).toBeGreaterThan(0);
    });

    it('respects timeout: first provider hangs, second succeeds', async () => {
        const chain = createProviderChain(
            providers.esplora(HANG, { timeoutMs: 50 }),
            providers.esplora(OK, { timeoutMs: 100 }),
            { timeoutMs: 100, backoffMs: [0, 1, 2] }
        );

        const utxos = await chain.getAddressUtxos(addr);
        expect(utxos).toEqual(okUtxos);

        const bal = await chain.getAddressBalance(addr);
        expect(bal).toEqual({ funded: 12345, spent: 0 });

        const res = await chain.broadcast?.('cafebabe');
        expect(res).toEqual({ txid: okBroadcastTxid });

        const mock = globalThis.fetch as any;
        const hangCalls = (mock.mock.calls ?? []).filter(([u]: [any]) => String(u).startsWith(HANG));
        expect(hangCalls.length).toBeGreaterThan(0);
    });
});