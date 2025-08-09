import * as bip39 from "bip39";
import { BIP32Factory } from "bip32";
import { ECPairFactory } from "ecpair";
import * as ecc from "tiny-secp256k1";
import * as bitcoin from "bitcoinjs-lib";
import { network } from "../net/index";
import type { Derivation, ReceiveAddress } from "../types";
import { DerivationError, AddressError } from "../core/errors";
import { toBuffer } from "../utils/bytes";

const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);
bitcoin.initEccLib(ecc);

export type Wallet = {
  testnet: boolean;
  account: number;
  nextIndex: number;
  mnemonic?: string;
  getKeyAt: (index: number, change?: 0 | 1) => { priv: Buffer; pub: Buffer; path: string };
  nextReceive: () => ReceiveAddress;
  toWIF: (index: number, change?: 0 | 1) => string;
};

/**
 * Generate BIP39 mnemonic.
 */
/**
 * Generate BIP39 mnemonic phrase.
 * @param strength - Entropy bits (128..256)
 * @returns mnemonic words string
 * @example
 * const m = generateMnemonic();
 */
export function generateMnemonic(strength: 128 | 160 | 192 | 224 | 256 = 128): string {
  return bip39.generateMnemonic(strength);
}

/**
 * Derive BIP84 keypair for path m/84'/coin'/account'/change/index.
 * coin: 0 mainnet, 1 testnet
 */
/**
 * Derive a keypair by BIP84 path m/84'/coin'/account'/change/index.
 * @param mnemonic - BIP39 mnemonic
 * @param d - derivation params
 * @param testnet - if true, coin=1; else coin=0
 * @returns private/public key buffers and path
 */
export function deriveKeypair(mnemonic: string, d: Derivation, testnet = false) {
  const seedU8 = bip39.mnemonicToSeedSync(mnemonic);
  const seed = toBuffer(seedU8 as unknown as Uint8Array);
  const root = bip32.fromSeed(seed, network(testnet));
  const coin = testnet ? 1 : 0;
  const path = `m/84'/${coin}'/${d.account}'/${d.change}/${d.index}`;
  const child = root.derivePath(path);
  if (!child.privateKey || !child.publicKey) throw new DerivationError("no keys derived");
  const priv = toBuffer(child.privateKey as unknown as Uint8Array);
  const pub = toBuffer(child.publicKey as unknown as Uint8Array);
  return { priv, pub, path };
}

/**
 * Construct wallet helper from mnemonic with BIP84 derivation (P2WPKH, bech32).
 * @param opts.testnet When true, uses coin=1 and bitcoin testnet network
 */
/**
 * Create a simple wallet helper using BIP84 (bech32 P2WPKH).
 * @param opts.testnet - use testnet derivation and network
 * @param opts.account - BIP84 account index (default 0)
 * @returns Wallet helper with `nextReceive()` and `toWIF()`
 */
export function fromMnemonic(mnemonic: string, opts?: { testnet?: boolean; account?: number }): Wallet {
  const testnet = !!opts?.testnet;
  const account = opts?.account ?? 0;

  const getKeyAt = (index: number, change: 0 | 1 = 0) => deriveKeypair(mnemonic, { account, change, index }, testnet);

  let nextIndex = 0;

  const nextReceive = (): ReceiveAddress => {
    const k = getKeyAt(nextIndex, 0);
    const pay = bitcoin.payments.p2wpkh({ pubkey: k.pub, network: network(testnet) });
    if (!pay.address) throw new AddressError("failed to build receive address");
    nextIndex++;
    return { address: pay.address, path: k.path };
  };

  const toWIF = (index: number, change: 0 | 1 = 0) => {
    const k = getKeyAt(index, change);
    return ECPair.fromPrivateKey(k.priv, { network: network(testnet) }).toWIF();
  };

  return { testnet, account, nextIndex, mnemonic, getKeyAt, nextReceive, toWIF };
}


