import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import type * as bitcoin from 'bitcoinjs-lib';
import { ecPairToSigner } from '../src/crypto/signer.js';

const ECPair = ECPairFactory(ecc);

describe('crypto/signer adapter', () => {
  it('adapts ECPair to bitcoinjs Signer', () => {
    const pair = ECPair.fromPrivateKey(Buffer.alloc(32, 1));
    const signer = ecPairToSigner(pair) as bitcoin.Signer;
    expect(Buffer.isBuffer(signer.publicKey)).toBe(true);
    const dummy = Buffer.alloc(32, 2);
    const sig = signer.sign(dummy);
    expect(Buffer.isBuffer(sig)).toBe(true);
  });
});


