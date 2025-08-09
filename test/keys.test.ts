import { generateMnemonic, fromMnemonic } from '../src/keys.js';

describe('keys', () => {
    it('mnemonic -> wallet -> two receive addresses (testnet)', () => {
        const m = generateMnemonic(128);
        const w = fromMnemonic(m, { testnet: true });
        const a1 = w.nextReceive();
        const a2 = w.nextReceive();
        expect(a1.address.startsWith('tb1')).toBe(true);
        expect(a2.address.startsWith('tb1')).toBe(true);
        expect(a1.address).not.toBe(a2.address);
    });
});