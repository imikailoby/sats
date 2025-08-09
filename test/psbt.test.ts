import { fromMnemonic } from '../src/keys.js';
import { buildPsbt, signPsbt, finalizePsbt } from '../src/psbt.js';
import * as bitcoin from 'bitcoinjs-lib';

describe('psbt', () => {
  it('builds, signs and finalizes a simple P2WPKH tx (testnet)', () => {
    const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const w = fromMnemonic(mnemonic, { testnet: true });

    const recv = w.nextReceive().address;

    const scriptPubKey = bitcoin.address.toOutputScript(recv, bitcoin.networks.testnet).toString('hex');

    const utxos = [{ txid: '00'.repeat(32), vout: 0, value: 10_000, scriptPubKey }];

    const outputs = [{ address: recv, value: 9_000 }];
    const fee = 500;

    const psbt = buildPsbt({ utxos, outputs, changeAddress: recv, fee, testnet: true });

    const wif = w.toWIF(0, 0);
    signPsbt(psbt, wif, true);

    const { hex, txid } = finalizePsbt(psbt);
    expect(typeof hex).toBe('string');
    expect(hex.length).toBeGreaterThan(100);
    expect(typeof txid).toBe('string');
    expect(txid.length).toBe(64);
  });
});