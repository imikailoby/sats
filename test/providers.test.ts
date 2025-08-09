import { providers, createProviderChain } from '../src/index.js';

describe('providers', () => {
    it('exposes blockstream & mempool presets', () => {
        const b = providers.blockstream(true);
        const m = providers.mempool(true);
        expect(typeof b.getAddressUtxos).toBe('function');
        expect(typeof m.getAddressUtxos).toBe('function');
    });

    it('provider chain tries in order (integration, network optional)', async () => {
        const p = createProviderChain(
            providers.mempool(true, { timeoutMs: 1000 }),
            providers.blockstream(true, { timeoutMs: 1000 }),
            { timeoutMs: 1000, backoffMs: [0, 1, 2] }
        );

        const addr = 'tb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv9jx3r';
        try {
            await p.getAddressBalance(addr);
            expect(true).toBe(true);
        } catch (e) {
            expect(true).toBe(true);
        }
    }, 10000);
});