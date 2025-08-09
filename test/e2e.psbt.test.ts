import { describe, it, expect } from '@jest/globals';
import * as bitcoin from 'bitcoinjs-lib';

import {
    fromMnemonic,
    buildPsbt,
    signPsbt,
    finalizePsbt,
} from '../src/index.js';

describe('e2e: PSBT build → sign → finalize (testnet)', () => {
    it('builds, signs and finalizes a valid P2WPKH tx with change', () => {
        const mnemonic =
            'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

        const w = fromMnemonic(mnemonic, { testnet: true });

        const recv1 = w.nextReceive().address;
        const recv2 = w.nextReceive().address;

        const scriptPubKey = bitcoin
            .address
            .toOutputScript(recv1, bitcoin.networks.testnet)
            .toString('hex');

        const utxos = [{ txid: '00'.repeat(32), vout: 0, value: 100_000, scriptPubKey }];

        const psbt = buildPsbt({
            utxos,
            outputs: [{ address: recv2, value: 30_000 }],
            changeAddress: recv1,
            fee: 500,
            testnet: true,
        });

        const wif = w.toWIF(0, 0);
        signPsbt(psbt, wif, true);

        const { hex, txid } = finalizePsbt(psbt);

        expect(typeof hex).toBe('string');
        expect(hex.length).toBeGreaterThan(100);
        expect(txid).toMatch(/^[0-9a-f]{64}$/);

        const tx = bitcoin.Transaction.fromHex(hex);
        expect(tx.ins.length).toBe(1);
        expect(tx.outs.length).toBe(2);

        const outValues = tx.outs.map(o => o.value).sort((a, b) => a - b);
        const changeExpected = 100_000 - 30_000 - 500;
        expect(outValues).toEqual([30_000, changeExpected].sort((a, b) => a - b));

        const outAddrs = tx.outs.map(o =>
            bitcoin.address.fromOutputScript(o.script, bitcoin.networks.testnet)
        );
        expect(outAddrs).toContain(recv1);
        expect(outAddrs).toContain(recv2);

        const wstack = (tx as any).ins[0].witness as Buffer[];
        expect(Array.isArray(wstack)).toBe(true);
        expect(wstack.length).toBeGreaterThanOrEqual(2);
        expect(wstack[1].length === 33 || wstack[1].length === 65).toBe(true);
    });
});